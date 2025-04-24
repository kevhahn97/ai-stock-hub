"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const { data: assets = [], isLoading: loading } = useQuery({
    queryKey: ['search', q],
    queryFn: async () => {
      if (!q) return [];
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
      return res.json();
    },
    enabled: !!q,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!q) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please enter a search query.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-neutral-50">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between bg-white border-b border-neutral-200 sticky top-0 z-20">
        <Link href="/" className="text-2xl font-bold text-blue-700">AI Stock Hub</Link>
        <nav className="hidden md:flex space-x-6 text-neutral-800 font-medium">
          <Link href="/" className="hover:text-blue-600 transition">Home</Link>
          <Link href="/new" className="hover:text-blue-600 transition">New</Link>
        </nav>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Search results for “{q}”</h1>
        {loading ? (
          <p className="text-gray-500 text-center mt-8">Loading...</p>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-6 space-y-6">
            {assets.map((asset) => (
              <Link key={asset.id} href={`/assets/${asset.id}`}>  
                <div className="mb-6 break-inside-avoid overflow-hidden rounded-xl bg-white shadow hover:shadow-xl transition-shadow">
                  <Image
                    src={asset.fileUrl}
                    alt={asset.title || 'Image'}
                    width={400}
                    height={300}
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-2">
                    {asset.title && <h2 className="text-sm font-medium text-gray-800 mb-1 truncate">{asset.title}</h2>}
                    {asset.createdAt && (
                      <p className="text-xs text-gray-500">{new Date(asset.createdAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {!loading && assets.length === 0 && (
          <p className="text-gray-500 text-center mt-8">No results found.</p>
        )}
      </section>
    </div>
  );
} 