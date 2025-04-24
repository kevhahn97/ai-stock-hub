import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Database } from './types.ts'
import { basename, extname } from 'https://deno.land/std@0.200.0/path/mod.ts'

type SoRecord = Database['storage']['Tables']['objects']['Row']

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: SoRecord
  schema: 'public'
  old_record: null | SoRecord
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// API keys and environment for embeddings and vector store
const openAIKey = Deno.env.get('OPENAI_API_KEY')!
const jinaApiKey = Deno.env.get('JINA_API_KEY')!
const pineconeApiKey = Deno.env.get('PINECONE_API_KEY')!
const pineconeImageHost = Deno.env.get('PINECONE_IMAGE_HOST')!
const pineconeDescHost = Deno.env.get('PINECONE_DESC_HOST')!

// Main webhook handler
Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()
    const record = payload.record
    if (record.bucket_id !== 'images') {
      return new Response('Not an image', { status: 200 })
    }
    console.log('payload', payload)

    const filePath = record.path_tokens!.join('/')
    const fileName = record.name
    const id = basename(fileName, extname(fileName))

    // 1. Create signed URL
    const signedUrl = await getSignedUrl(record.bucket_id!, filePath)

    // 2. Generate keywords & description via OpenAI
    const { keywords, description } = await getTagsAndDescription(signedUrl)

    // 3. Run DB update and embeddings in parallel
    const [imageEmb, descEmb] = await Promise.all([
      getJinaImageEmbedding(signedUrl),
      getOpenAITextEmbedding(description),
    ])
    const updateResult = await updateUploadRecord(fileName, keywords, description, imageEmb, descEmb)

    if (updateResult.error) {
      console.error('Failed to update upload record', updateResult.error)
      return new Response('Failed to update upload record', { status: 500 })
    }

    // 4. Upsert both embeddings to Pinecone in parallel (with keywords as metadata)
    await Promise.all([
      upsertToPinecone(pineconeImageHost, id, imageEmb, { keywords }),
      upsertToPinecone(pineconeDescHost, id, descEmb, { keywords }),
    ])

    return new Response('OK', { status: 200 })
  } catch (e) {
    console.error('Error processing request', e)
    return new Response('Internal Server Error', { status: 500 })
  }
})

// Helper to get a signed URL for the image
async function getSignedUrl(bucketId: string, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucketId).createSignedUrl(path, 60)
  if (error) throw error
  return data.signedUrl
}

// Helper to call OpenAI chat for tags and description
async function getTagsAndDescription(imageUrl: string): Promise<{ keywords: string[]; description: string }> {
  const prompt = `
You are an expert stock image tagger and describer. Given an image, respond in JSON with two fields:
- "keywords": an array of 5-10 short, relevant, comma-separated search keywords describing the image (no hashtags, no duplicates, no generic words like 'photo').
- "description": a detailed, vivid description of the image, suitable for a stock image catalog. Be detailed as possible.

Respond ONLY with valid JSON adhering to the JSON schema:
{
  "keywords": ["keyword1", "keyword2", ...],
  "description": "detailed description of the image"
}
`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1024,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI LLM failed: ${res.statusText}`)
  const data = await res.json()
  let keywords: string[] = []
  let description = ''
  try {
    const content = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)
    keywords = Array.isArray(parsed.keywords) ? parsed.keywords.map((k: string) => k.trim()).filter(Boolean) : []
    description = typeof parsed.description === 'string' ? parsed.description.trim() : ''
  } catch (e) {
    throw new Error(`Failed to parse LLM output: ${e}`)
  }
  return { keywords, description }
}

// Helper to update Supabase upload record
async function updateUploadRecord(
  fileUrl: string,
  keywords: string[],
  description: string,
  image_embedding: number[],
  desc_embedding: number[],
) {
  return supabase
    .from('upload')
    .update({ llm_keywords: keywords, llm_description: description, image_embedding, desc_embedding })
    .eq('fileUrl', fileUrl)
}

// Helper to get image embedding from Jina
async function getJinaImageEmbedding(imageUrl: string): Promise<number[]> {
  const payload = { model: 'jina-clip-v2', dimensions: 256, input: [{ image: imageUrl }] }
  const res = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jinaApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Jina embedding failed: ${res.statusText}`)
  const json = await res.json()
  // Attempt to extract embedding
  if (Array.isArray(json.embeddings)) {
    return json.embeddings[0]
  }
  if (Array.isArray(json.data) && Array.isArray(json.data[0]?.embedding)) {
    return json.data[0].embedding
  }
  throw new Error('Unexpected Jina response format')
}

// Helper to get text embedding from OpenAI
async function getOpenAITextEmbedding(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-large', input: text, dimensions: 256 }),
  })
  if (!res.ok) throw new Error(`OpenAI embedding failed: ${res.statusText}`)
  const data = await res.json()
  return data.data[0].embedding
}

interface PineconeVector {
  id: string
  values: number[]
  metadata?: Record<string, unknown>
}

interface PineconeUpsertBody {
  vectors: PineconeVector[]
  namespace?: string
}

async function upsertToPinecone(
  host: string,
  id: string,
  values: number[],
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const url = `https://${host}/vectors/upsert`
  const body: PineconeUpsertBody = {
    vectors: [{ id, values, metadata }],
    namespace: '',
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Api-Key': pineconeApiKey,
      'Content-Type': 'application/json',
      'X-Pinecone-API-Version': '2025-01',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pinecone upsert failed for ${host}: ${res.statusText} - ${text}`)
  }
}
