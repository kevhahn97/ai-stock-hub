'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AssetCard from '@/components/AssetCard';

interface Upload {
  id: string;
  fileUrl: string;
  title?: string;
  createdAt: string;
}

export default function NewPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [reset, setReset] = useState(false);
  const pathname = usePathname();

  // Set reset flag when navigating to this route
  useEffect(() => {
    if (pathname === '/new') {
      setReset(true);
    }
  }, [pathname]);

  // Handle reset: clear uploads, set page to 1, load first page
  useEffect(() => {
    if (reset) {
      setUploads([]);
      setPage(1);
      setHasMore(true);
      // Load first page directly
      (async () => {
        setLoading(true);
        const res = await fetch(`/api/assets?limit=20&page=1`);
        if (!res.ok) {
          setLoading(false);
          setReset(false);
          return;
        }
        const data: Upload[] = await res.json();
        if (data.length < 20) setHasMore(false);
        setUploads(data);
        setLoading(false);
        setReset(false);
      })();
    }
  }, [reset]);

  // Load a page of uploads (for Load More button only)
  const loadPage = async (pageNum: number) => {
    setLoading(true);
    const res = await fetch(`/api/assets?limit=20&page=${pageNum}`);
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data: Upload[] = await res.json();
    if (data.length < 20) setHasMore(false);
    setUploads((prev) => [...prev, ...data]);
    setLoading(false);
  };

  // On page change, fetch data (but not on reset)
  useEffect(() => {
    if (page === 1 || reset) return;
    loadPage(page);
  }, [page]);

  return (
    <div className="min-h-screen w-full bg-neutral-50">
      {/* Navbar */}
      <header className="w-full px-6 py-4 flex items-center justify-between bg-white border-b border-neutral-200 sticky top-0 z-20">
        <Link href="/" className="text-2xl font-bold text-blue-700">AI Stock Hub</Link>
        <nav className="hidden md:flex space-x-6 text-neutral-800 font-medium">
          <Link href="/" className="hover:text-blue-600 transition">Home</Link>
          <Link href="/new" className="hover:text-blue-600 transition">New</Link>
        </nav>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Latest Uploads</h1>
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-6 space-y-6">
          {uploads.map((upload) => (
            <AssetCard
              key={upload.id}
              id={upload.id}
              fileUrl={upload.fileUrl}
              title={upload.title}
              createdAt={upload.createdAt}
            />
          ))}
        </div>
        {/* Load More button */}
        {!loading && hasMore && (
          <div className="flex justify-center py-8">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Load More
            </button>
          </div>
        )}
      </section>
    </div>
  );
} 