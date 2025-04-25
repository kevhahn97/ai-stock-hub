import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { getRecentUploads } from '@/lib/getRecentUploads'

const PINECONE_API_KEY = process.env.PINECONE_API_KEY!
const PINECONE_DESC_HOST = process.env.PINECONE_DESC_HOST!
const PINECONE_IMAGE_HOST = process.env.PINECONE_IMAGE_HOST!

interface PineconeMatch {
  id: string
  score: number
}
interface PineconeResponse {
  matches: PineconeMatch[]
}

async function queryPinecone(host: string, vector: number[], topK: number) {
  const url = `https://${host}/query`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json',
      'X-Pinecone-API-Version': '2025-01',
    },
    body: JSON.stringify({ vector, topK, namespace: '' }),
  })
  if (!res.ok) throw new Error(`Pinecone query failed: ${res.statusText}`)
  const data = (await res.json()) as PineconeResponse
  return data.matches
}

export async function GET() {
  const supabase = await createSupabaseClient()
  const { data: sessionData } = await supabase.auth.getUser()
  const user = sessionData?.user
  if (!user) return NextResponse.json([])

  const desiredCount = 20
  // Get recent 10 views
  const recViews = await prisma.recentView.findMany({
    where: { userId: user.id },
    orderBy: { viewed_at: 'desc' },
    select: { uploadId: true },
    take: 10,
  })
  if (recViews.length === 0) {
    console.log('No recent views, returning 20 most recent uploads as popular items')
    // No recent views, return 20 most recent uploads as popular items
    const results = await getRecentUploads(supabase, 20)
    return NextResponse.json(results)
  }

  // Mix results properly to guarantee each recent view contributes
  const perViewMatches: string[][] = []
  let numUploadsWithEmbeds = 0
  const maxQueries = 3
  for (const { uploadId } of recViews) {
    if (numUploadsWithEmbeds >= maxQueries) break
    // Fetch embeddings from DB
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      select: { desc_embedding: true, image_embedding: true },
    })
    if (!upload) continue
    if (upload.desc_embedding.length === 0 || upload.image_embedding.length === 0) {
      console.log('Upload found, but no embeddings', uploadId)
      continue
    }
    numUploadsWithEmbeds++
    console.log('Upload found, querying Pinecone', uploadId)
    // convert Decimal[] to number[]
    const descVec = upload.desc_embedding.map((d) => Number(d))
    const imgVec = upload.image_embedding.map((d) => Number(d))
    const [descMatches, imgMatches] = await Promise.all([
      queryPinecone(PINECONE_DESC_HOST, descVec, 10),
      queryPinecone(PINECONE_IMAGE_HOST, imgVec, 10),
    ])
    // Combine desc and image scores per match
    const viewScoreMap = new Map<string, number>()
    for (const m of descMatches) {
      viewScoreMap.set(m.id, (viewScoreMap.get(m.id) || 0) + m.score * 0.5)
    }
    for (const m of imgMatches) {
      viewScoreMap.set(m.id, (viewScoreMap.get(m.id) || 0) + m.score * 0.5)
    }
    // Sort matches for this view
    const sortedViewIds = Array.from(viewScoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
    perViewMatches.push(sortedViewIds)
  }

  // Interleave matches from each view to mix contributions
  const finalIds: string[] = []
  const seen = new Set<string>()
  for (let rank = 0; finalIds.length < desiredCount; rank++) {
    let addedInRound = false
    for (const viewIds of perViewMatches) {
      if (rank < viewIds.length) {
        const id = viewIds[rank]
        if (!seen.has(id)) {
          seen.add(id)
          finalIds.push(id)
          addedInRound = true
          if (finalIds.length >= desiredCount) break
        }
      }
    }
    if (!addedInRound) break
  }
  const sortedIds = finalIds

  // Fetch metadata
  const assets = await prisma.upload.findMany({
    where: { id: { in: sortedIds } },
    select: { id: true, fileUrl: true, title: true, created_at: true },
  })

  // Map to public URLs
  const assetMap = new Map(assets.map((a) => [a.id, a]))
  let results = sortedIds
    .map((id) => assetMap.get(id))
    .filter((a): a is { id: string; fileUrl: string; title: string; created_at: Date } => !!a)
    .map((a) => {
      const { data } = supabase.storage.from('images').getPublicUrl(a.fileUrl)
      return { id: a.id, fileUrl: data.publicUrl, title: a.title, createdAt: a.created_at.toISOString() }
    })

  // If no recommendations, fallback to recent uploads
  if (results.length === 0) {
    results = await getRecentUploads(supabase, 20)
  }

  return NextResponse.json(results)
}
