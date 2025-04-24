"use client";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="text-blue-600 hover:underline mb-8 inline-block text-sm font-medium"
    >
      &larr; Back
    </button>
  );
} 