import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, prompt, modelName, licence, userId } = await req.json()
    if (!fileUrl || !prompt || !modelName || !licence || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const upload = await prisma.upload.create({
      data: {
        fileUrl,
        prompt,
        modelName,
        licence,
        userId,
        // Optionally: status: 'pending'
      },
    })
    return NextResponse.json({ success: true, id: upload.id })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
