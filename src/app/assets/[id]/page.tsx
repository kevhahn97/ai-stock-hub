import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export default async function AssetPage({ params }: { params: { id: string } }) {
  const asset = await prisma.upload.findUnique({
    where: { id: params.id },
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
  });
  if (!asset) notFound();

  // Get public URL with resizing
  const supabase = await createClient();
  const { data } = supabase.storage.from('images').getPublicUrl(asset.fileUrl);
  const publicUrl = `${data.publicUrl}`;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navbar */}
      <header className="w-full px-8 py-5 flex items-center justify-between bg-white/80 backdrop-blur border-b border-neutral-100 sticky top-0 z-10">
        <Link href="/" className="text-2xl font-black tracking-tight text-blue-700 select-none">
          AI Stock Hub
        </Link>
        <nav className="hidden md:flex gap-8 text-base font-medium text-neutral-800 items-center">
          <Link href="/" className="hover:text-blue-600 transition">Home</Link>
          <Link href="/new" className="hover:text-blue-600 transition">New</Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <Link href="/new" className="text-blue-600 hover:underline mb-8 inline-block text-sm font-medium">
          &larr; Back to New Uploads
        </Link>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden shadow-lg bg-white flex items-center justify-center p-2">
            <Image
              src={publicUrl}
              alt={asset.title || 'Image'}
              width={700}
              height={520}
              className="w-full h-auto object-cover rounded-xl"
              priority
            />
          </div>
          {/* Details */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-2 leading-tight">
                {asset.title || 'Untitled'}
              </h1>
              <div className="text-sm text-neutral-400 font-medium mb-2">
                Uploaded on {new Date(asset.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-400 mb-1">Prompt:</div>
              <div className="text-neutral-700 text-base mb-4">{asset.prompt}</div>
            </div>
            {asset.llm_description && (
              <div>
                <div className="text-xs font-semibold text-neutral-400 mb-1">Description:</div>
                <div className="text-neutral-700 text-base mb-4 leading-relaxed">{asset.llm_description}</div>
              </div>
            )}
            {asset.llm_keywords && asset.llm_keywords.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-neutral-400 mb-1">Keywords:</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {asset.llm_keywords.map((kw: string) => (
                    <span
                      key={kw}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2 mt-2">
              <div className="text-xs font-semibold text-neutral-400">Model:</div>
              <div className="text-neutral-700 text-base">{asset.modelName}</div>
              <div className="mt-2">
                <span className="inline-block bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                  Licence: {asset.licence}
                </span>
              </div>
            </div>
            <div className="mt-8">
              <a
                href={publicUrl}
                download
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow hover:bg-blue-700 transition-colors"
              >
                Download Image
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 