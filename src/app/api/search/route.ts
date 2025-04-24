import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'

const OPENAI_KEY = process.env.OPENAI_API_KEY!
const JINA_API_KEY = process.env.JINA_API_KEY!
const PINECONE_API_KEY = process.env.PINECONE_API_KEY!
const PINECONE_DESC_HOST = process.env.PINECONE_DESC_HOST!
const PINECONE_IMAGE_HOST = process.env.PINECONE_IMAGE_HOST!

// Get text embedding from OpenAI
async function getTextEmbedding(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-large', input: text, dimensions: 256 }),
  })
  if (!res.ok) throw new Error(`OpenAI embedding failed: ${res.statusText}`)
  const data = await res.json()
  return data.data[0].embedding
}

// Get text embedding via Jina CLIP v2 (for multimodal retrieval)
async function getJinaTextEmbedding(text: string): Promise<number[]> {
  const payload = { model: 'jina-clip-v2', dimensions: 256, input: [{ text }] }
  const res = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${JINA_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Jina embedding failed: ${res.statusText}`)
  const json = await res.json()
  if (Array.isArray(json.embeddings)) {
    return json.embeddings[0]
  }
  if (Array.isArray(json.data) && Array.isArray(json.data[0]?.embedding)) {
    return json.data[0].embedding
  }
  throw new Error('Unexpected Jina response format')
}

// Define types for Pinecone query results
interface PineconeMatch {
  id: string
  score: number
}
interface PineconeResponse {
  matches: PineconeMatch[]
}

// Query Pinecone index for nearest neighbors
async function queryPinecone(host: string, vector: number[], topK = 20): Promise<PineconeMatch[]> {
  const url = `https://${host}/query`
  const body = { vector, topK, namespace: '', includeValues: false, includeMetadata: false }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json',
      'X-Pinecone-API-Version': '2025-01',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Pinecone query failed: ${res.statusText}`)
  const data = (await res.json()) as PineconeResponse
  return data.matches
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  console.log('[search] Incoming query:', q)
  if (!q) return NextResponse.json([])

  // Compute embeddings
  const [descEmb, imgEmb] = await Promise.all([getTextEmbedding(q), getJinaTextEmbedding(q)])
  console.log('[search] descEmb length:', descEmb.length, 'imgEmb length:', imgEmb.length)

  // Query indexes
  const [descMatches, imgMatches] = await Promise.all([
    queryPinecone(PINECONE_DESC_HOST, descEmb),
    queryPinecone(PINECONE_IMAGE_HOST, imgEmb),
  ])
  console.log('[search] descMatches:', descMatches.length, 'imgMatches:', imgMatches.length)
  console.log(
    '[search] descMatches scores:',
    descMatches.map((m) => ({ id: m.id, score: m.score })),
  )
  console.log(
    '[search] imgMatches scores:',
    imgMatches.map((m) => ({ id: m.id, score: m.score })),
  )

  // Combine scores (equal weight)
  const combined = new Map<string, number>()
  const weight = 0.5
  for (const { id, score } of descMatches) {
    combined.set(id, score * weight)
  }
  for (const { id, score } of imgMatches) {
    combined.set(id, (combined.get(id) ?? 0) + score * weight)
  }

  // Sort IDs by combined score
  const sortedIds = Array.from(combined.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
  console.log('[search] Sorted IDs:', sortedIds)

  // Fetch metadata from database
  const assets = await prisma.upload.findMany({
    where: { id: { in: sortedIds } },
    select: { id: true, fileUrl: true, title: true, created_at: true },
  })
  console.log('[search] DB assets fetched:', assets.length)
  const supabase = await createSupabaseClient()

  // Map to public URLs and preserve order
  const assetMap = new Map(assets.map((a) => [a.id, a]))
  const results = sortedIds
    .map((id) => assetMap.get(id))
    .filter((a): a is { id: string; fileUrl: string; title: string; created_at: Date } => !!a)
    .map((a) => {
      const { data } = supabase.storage.from('images').getPublicUrl(a.fileUrl)
      return { id: a.id, fileUrl: data.publicUrl, title: a.title, createdAt: a.created_at?.toISOString() }
    })
  console.log('[search] Final results count:', results.length)

  return NextResponse.json(results)
}
