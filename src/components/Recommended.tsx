"use client";
import { useQuery } from '@tanstack/react-query';
import AssetCard from '@/components/AssetCard';

interface Item {
  id: string;
  fileUrl: string;
  title?: string;
  createdAt: string;
}

export default function Recommended() {
  const { data: recs = [], isLoading } = useQuery<Item[]>({
    queryKey: ['recommend'],
    queryFn: async () => {
      const res = await fetch('/api/recommend');
      
      if (!res.ok) return [];
      const resJson = await res.json();
      console.log(resJson);
      return resJson;
    },
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-gray-500">Loading recommendations...</div>
    );
  }
  if (!recs.length) {
    return null;
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Recommended for you 💌</h2>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {recs.map((item) => (
          <AssetCard
            key={item.id}
            id={item.id}
            fileUrl={item.fileUrl}
            title={item.title}
            createdAt={item.createdAt}
          />
        ))}
      </div>
    </section>
  );
} 