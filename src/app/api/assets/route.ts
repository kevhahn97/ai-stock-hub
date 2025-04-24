import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)
  const page = parseInt(url.searchParams.get('page') ?? '1', 10)
  const skip = (page - 1) * limit

  // Get a Supabase client for Storage
  const supabase = await createClient()

  // Fetch newest uploads with pagination
  const uploads = await prisma.upload.findMany({
    orderBy: [{ created_at: 'desc' }],
    select: { id: true, fileUrl: true, title: true, created_at: true },
    take: limit,
    skip,
  })

  // Map to public URLs with resizing
  const results = uploads.map((u) => {
    const { data } = supabase.storage.from('images').getPublicUrl(u.fileUrl)
    // Return createdAt in ISO string
    return { id: u.id, fileUrl: data.publicUrl, title: u.title, createdAt: u.created_at.toISOString() }
  })

  return NextResponse.json(results)
}
