import Link from 'next/link';
import { FiSearch, FiLogIn, FiLogOut, FiUpload, FiGrid } from 'react-icons/fi';
import { createClient } from '@/lib/supabase/server';

const images = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
];

const tags = [
  'technology', 'nature', 'business', 'workspace', 'lifestyle', 'travel', 'food',
];

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name && name.trim()) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return '?';
}

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navbar */}
      <header className="w-full px-8 py-5 flex items-center justify-between bg-white/80 backdrop-blur border-b border-neutral-100 sticky top-0 z-10">
        <span className="text-2xl font-black tracking-tight text-blue-700 select-none">AI Stock Hub</span>
        <nav className="hidden md:flex gap-10 text-base font-medium text-neutral-700 items-center">
          {['Home', 'Explore', 'New'].map((item) => (
            <Link
              key={item}
              href={item === 'Home' ? '/' : `#${item.toLowerCase()}`}
              className="relative px-1 hover:text-blue-600 transition-colors after:content-[''] after:block after:h-0.5 after:bg-blue-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left after:duration-200"
              style={{ transition: 'color 0.2s' }}
            >
              {item}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-neutral-100"><FiSearch size={20} /></button>
          {!user ? (
            <Link href="/login" className="flex items-center gap-1 text-neutral-700 hover:text-blue-600 font-medium"><FiLogIn size={18} /> Sign In</Link>
          ) : (
            <div className="relative group focus-within:z-30">
              <button
                type="button"
                tabIndex={0}
                className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg border border-blue-200 shadow-sm cursor-pointer"
              >
                {getInitials(user.user_metadata?.name, user.email)}
              </button>
              <div className="absolute right-0 mt-2 w-44 bg-white border border-neutral-100 rounded-xl shadow-lg py-2 opacity-0 group-focus-within:opacity-100 transition-all z-20"
              >
                <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50"><FiGrid /> Dashboard</Link>
                <Link href="/upload" className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50"><FiUpload /> Upload</Link>
                <form action="/logout" method="post">
                  <button type="submit" className="flex items-center gap-2 px-4 py-2 w-full text-neutral-700 hover:bg-neutral-50"><FiLogOut /> Sign Out</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-28 px-4 animate-fade-in">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-neutral-900 mb-8 leading-tight max-w-4xl tracking-tight">Stunning images for your <br className="hidden sm:inline" />next project</h1>
        <p className="text-lg text-neutral-500 mb-10 max-w-xl">Discover and download high-quality stock photos that inspire creativity</p>
        <form className="flex w-full max-w-xl mx-auto mb-5">
          <div className="flex flex-1 items-center bg-white border border-neutral-200 rounded-l-full px-5 py-3 shadow focus-within:ring-2 focus-within:ring-blue-200">
            <FiSearch className="text-neutral-400 mr-2" size={22} />
            <input
              type="text"
              placeholder="Search for free high-resolution photos"
              className="flex-1 bg-transparent outline-none text-neutral-900 placeholder-neutral-400 text-lg"
            />
          </div>
          <button type="submit" className="bg-neutral-900 text-white px-8 py-3 rounded-r-full font-semibold text-lg hover:bg-blue-700 transition-colors">Search</button>
        </form>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {tags.map(tag => (
            <button
              key={tag}
              className="bg-white border border-neutral-200 shadow-sm text-neutral-700 rounded-full px-5 py-1.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
              style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)' }}
            >
              {tag}
            </button>
          ))}
        </div>
        {user && (
          <div className="mt-8">
            <Link href="/dashboard" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors">Go to Dashboard</Link>
          </div>
        )}
      </section>

      {/* Featured Images Section */}
      <section id="explore" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Free stock photos for everyone</h2>
        <p className="text-neutral-500 mb-8">Browse our curated collection of stunning images</p>
        <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
          {images.map((src, i) => (
            <div
              key={i}
              className="break-inside-avoid rounded-2xl overflow-hidden shadow border border-neutral-100 bg-white group transition-transform hover:scale-[1.025] hover:shadow-lg cursor-pointer"
              style={{ transition: 'box-shadow 0.2s, transform 0.2s' }}
            >
              <img
                src={src}
                alt="AI visual"
                className="w-full h-auto object-cover transition-transform duration-200 group-hover:scale-105 rounded-2xl"
              />
            </div>
          ))}
        </div>
        <div className="mt-12 text-center text-neutral-400 text-xs">
          &copy; {new Date().getFullYear()} AI Stock Hub. All rights reserved.
        </div>
      </section>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 1s cubic-bezier(.4,0,.2,1) both;
        }
      `}</style>
    </div>
  );
}