import Link from 'next/link';

interface AssetCardProps {
  id: string;
  fileUrl: string;
  title?: string;
  createdAt?: string;
  href?: string; // Optional override for link
}

export default function AssetCard({ id, fileUrl, title, createdAt, href }: AssetCardProps) {
  return (
    <Link
      href={href || `/assets/${id}`}
      className="group relative block mb-6 break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-2xl transition-shadow border border-neutral-200 focus:ring-2 focus:ring-blue-300 focus:outline-none"
    >
      <img
        src={fileUrl}
        alt={title || 'Image'}
        className="w-full h-auto object-cover"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all"></div>
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {title && (
          <h3 className="text-base font-semibold text-white truncate">
            {title}
          </h3>
        )}
        {createdAt && (
          <p className="text-xs text-white">
            {new Date(createdAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </Link>
  );
} 