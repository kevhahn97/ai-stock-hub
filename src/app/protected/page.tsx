import { requireAuth } from '@/lib/requireAuth';

export default async function ProtectedPage() {
  const user = await requireAuth();
  return <div className="p-8">Welcome, {user.email}!</div>;
} 