import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const asset = await prisma.upload.findUnique({
    where: { id },
    select: {
      id: true,
      fileUrl: true,
      title: true,
      prompt: true,
      modelName: true,
      licence: true,
      llm_keywords: true,
      llm_description: true,
      created_at: true,
    },
  })
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }
  return NextResponse.json(asset)
}
