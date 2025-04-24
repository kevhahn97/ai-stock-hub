import { prisma } from '@/lib/prisma'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getRecentUploads(supabase: SupabaseClient, take = 20) {
  const assets = await prisma.upload.findMany({
    orderBy: { created_at: 'desc' },
    select: { id: true, fileUrl: true, title: true, created_at: true },
    take,
  })
  return assets
    .filter((a): a is { id: string; fileUrl: string; title: string; created_at: Date } => !!a)
    .map((a) => {
      const { data } = supabase.storage.from('images').getPublicUrl(a.fileUrl)
      return { id: a.id, fileUrl: data.publicUrl, title: a.title, createdAt: a.created_at.toISOString() }
    })
}
