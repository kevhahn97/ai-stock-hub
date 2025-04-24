'use client';
import { useRef, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

const MAX_SIZE_MB = 100;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const LICENCES = [
  { value: 'CC0', label: 'CC0 (Public Domain)' },
  { value: 'Non-commercial', label: 'Non-commercial' },
];
const BUCKET = 'images';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('');
  const [licence, setLicence] = useState(LICENCES[0].value);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Only JPEG, PNG, or WebP images are allowed.');
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError('File is too large (max 100MB).');
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setError('');
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  useEffect(() => {
    // Clean up the object URL when the file changes or component unmounts
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      const dt = new DataTransfer();
      dt.items.add(f);
      handleFileChange({ target: { files: dt.files } } as React.ChangeEvent<HTMLInputElement>);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title || !prompt || !model || !licence) return;
    setUploading(true);
    setError('');
    setSuccess(false);
    try {
      // 1. Generate a UUID for this upload
      const uploadId = uuidv4();
      const fileExt = file.name.split('.').pop();
      // Shard by first 2 chars of UUID
      const shard = uploadId.slice(0, 2);
      const filePath = `${shard}/${uploadId}.${fileExt}`;

      // 2. Upload original image to Supabase Storage
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) {
        console.error(uploadError);
        throw uploadError;
      }

      // 3. Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 4. Save metadata to DB via API route
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uploadId,
          fileUrl: filePath,
          title,
          prompt,
          modelName: model,
          licence,
          userId: user.id,
        }),
      });
      if (!res.ok) throw new Error('Failed to save metadata');

      setSuccess(true);
      setFile(null);
      setTitle('');
      setPrompt('');
      setModel('');
      setLicence(LICENCES[0].value);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-2">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-100 p-8 flex flex-col gap-6"
      >
        <h1 className="text-2xl font-bold text-neutral-900 mb-2 text-center">Upload Image</h1>
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer py-8 px-4 text-center"
          onClick={() => fileInput.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {file ? (
            <>
              <div className="text-blue-700 font-medium mb-2">{file.name}</div>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 max-w-full rounded-lg border border-neutral-200 shadow mb-2"
                  style={{ objectFit: 'contain' }}
                />
              )}
            </>
          ) : (
            <>
              <div className="text-neutral-400 mb-2">Drag & drop or click to select an image</div>
              <div className="text-xs text-neutral-400">JPEG, PNG, WebP · max 100MB</div>
            </>
          )}
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <input
          type="text"
          placeholder="Title"
          className="border border-neutral-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-200 outline-none text-neutral-900 placeholder-neutral-400"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Prompt (what was used to generate this?)"
          className="border border-neutral-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-200 outline-none text-neutral-900 placeholder-neutral-400"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Model Name (e.g. Stable Diffusion)"
          className="border border-neutral-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-200 outline-none text-neutral-900 placeholder-neutral-400"
          value={model}
          onChange={e => setModel(e.target.value)}
          required
        />
        <select
          className="border border-neutral-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-200 outline-none text-neutral-900"
          value={licence}
          onChange={e => setLicence(e.target.value)}
          required
        >
          {LICENCES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center">Upload successful!</div>}
        <button
          type="submit"
          className="bg-blue-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-blue-700 transition-colors mt-2 shadow disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!file || !title || !prompt || !model || !licence || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </main>
  );
} 