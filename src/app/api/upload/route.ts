import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiAuth } from '@/lib/requireAuth'

export async function POST(req: NextRequest) {
  const user = await requireApiAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id, fileUrl, title, prompt, modelName, licence } = await req.json()
    if (!id || !fileUrl || !title || !prompt || !modelName || !licence) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const upload = await prisma.upload.create({
      data: {
        id,
        fileUrl,
        title,
        prompt,
        modelName,
        licence,
        user: { connect: { id: user.id } },
      },
    })
    return NextResponse.json({ success: true, id: upload.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
