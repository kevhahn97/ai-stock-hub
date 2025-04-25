"use client";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import AssetCard from '@/components/AssetCard';
import { Suspense } from "react";

interface Asset {
  id: string;
  fileUrl: string;
  title?: string;
  createdAt?: string;
}

function SearchPage() {
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
        {/* Search bar for new queries */}
        <form action="/search" method="get" className="flex w-full max-w-xl mx-auto mb-8">
          <div className="flex flex-1 items-center bg-white border border-neutral-200 rounded-l-full px-5 py-3 shadow focus-within:ring-2 focus-within:ring-blue-200">
            <input
              name="q"
              type="text"
              defaultValue={q}
              placeholder="Search for free high-resolution photos"
              className="flex-1 bg-transparent outline-none text-neutral-900 placeholder-neutral-400 text-lg"
            />
          </div>
          <button type="submit" className="bg-neutral-900 text-white px-8 py-3 rounded-r-full font-semibold text-lg hover:bg-blue-700 transition-colors">Search</button>
        </form>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Search results for “{q}”</h1>
        {loading ? (
          <p className="text-gray-500 text-center mt-8">Loading...</p>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-6 space-y-6">
            {(assets as Asset[]).map((asset) => (
              <AssetCard
                key={asset.id}
                id={asset.id}
                fileUrl={asset.fileUrl}
                title={asset.title}
                createdAt={asset.createdAt}
              />
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

function SearchPageWithSuspense() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <SearchPage />
    </Suspense>
  );
}

export default SearchPageWithSuspense; 