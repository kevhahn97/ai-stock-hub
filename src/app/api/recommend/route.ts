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

  // Get recent 5 views
  const recViews = await prisma.recentView.findMany({
    where: { userId: user.id },
    orderBy: { viewed_at: 'desc' },
    select: { uploadId: true },
    take: 5,
  })
  if (recViews.length === 0) {
    // No recent views, return 20 most recent uploads as popular items
    const results = await getRecentUploads(supabase, 20)
    return NextResponse.json(results)
  }

  const matchScores = new Map<string, number>()
  const recCount = recViews.length
  for (const { uploadId } of recViews) {
    // Fetch embeddings from DB
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      select: { desc_embedding: true, image_embedding: true },
    })
    if (!upload) continue
    // convert Decimal[] to number[]
    const descVec = upload.desc_embedding.map((d) => Number(d))
    const imgVec = upload.image_embedding.map((d) => Number(d))
    const [descMatches, imgMatches] = await Promise.all([
      queryPinecone(PINECONE_DESC_HOST, descVec, 10),
      queryPinecone(PINECONE_IMAGE_HOST, imgVec, 10),
    ])
    const viewWeight = 1 / recCount
    for (const m of descMatches) {
      matchScores.set(m.id, (matchScores.get(m.id) || 0) + m.score * viewWeight * 0.5)
    }
    for (const m of imgMatches) {
      matchScores.set(m.id, (matchScores.get(m.id) || 0) + m.score * viewWeight * 0.5)
    }
  }

  // Sort and limit to 20
  const sortedIds = Array.from(matchScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, 20)

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
