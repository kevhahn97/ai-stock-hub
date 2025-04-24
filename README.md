# AI Stock Hub

**Version 0.2 – MVP**

AI Stock Hub is a full-stack Next.js 14 (App Router) application that lets creators upload AI-generated visuals and consumers browse, search, and license them—instead of regenerating. It leverages Supabase for auth, database and storage; Prisma for ORM; OpenAI & Jina for embeddings; Pinecone for vector search; and Vercel for hosting.

---

## Features Implemented

### 1. Authentication

- Passwordless email login via Supabase Auth
- Protected routes redirect `/login` if unauthenticated

### 2. Upload Flow

- `/upload` page to upload JPEG/PNG/WebP (≤100 MB) or MP4 (≤250 MB)
- Supabase Edge Function triggers on every new upload for asynchronous image tagging
  - Calls OpenAI GPT-4.1-nano to generate keywords & description
  - Computes image embeddings (Jina CLIP v2) & text embeddings (OpenAI)
  - Stores metadata & embeddings in Postgres (Prisma)
  - Upserts vectors into Pinecone for future queries (`image-emb` & `desc-emb` indices)

### 3. Home Feed (Recommendations)

- Home page displays "Recommended for you" for signed-in users
- `/api/recommend`:
  1. Loads the user's last 5 viewed uploads
  2. Queries Pinecone with each view's embeddings
  3. Combines and normalizes scores
  4. Returns top-20 asset recommendations
- Home UI component fetches and renders recs asynchronously
- For non-signed-in users, shows 20 most recent uploads

### 4. Search

- Search box in header → `/search?q=...`
- `/api/search`:
  1. Computes query text embedding (OpenAI) & multimodal embedding (Jina)
  2. Queries Pinecone for top matches in both indices
  3. Combines scores (linear blend)
  4. Fetches metadata via Prisma
  5. Returns top-20 results
- `/search` page renders results in the same masonry grid

### 5. Browse "New"

- `/new` lists newest assets in a Pinterest-style masonry layout
- Pagination via "Load More" (calls `/api/assets?limit&page`)
- Backend: `/api/assets` uses Prisma to fetch uploads ordered by `created_at`

### 6. Asset Detail (+ Recent Views)

- `/assets/[id]` shows full-size image, prompt, model, license, keywords, description
- Records "recent views" in DB (up to 5 per user) to feed recommendations
- Download link to get a time-limited signed URL

---

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router) on Vercel
- **Database**: PostgreSQL via Supabase + Prisma
- **Storage**: Supabase Storage (S3-compatible) + Vercel CDN
- **Auth**: Supabase Auth (email magic link)
- **Edge Functions**: Supabase Functions (Deno) for tagging & embedding
- **Embeddings**: OpenAI (text) + Jina (image/text)
- **Vector Search**: Pinecone (two indices)
- **Styling**: Tailwind CSS

---

## Getting Started (Local Development)

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   - Copy `.env.example` to `.env.local` and fill in your Supabase and Postgres credentials.

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. **Deploy:**
   - Push to Vercel and set the same environment variables in the Vercel dashboard.

---

- Uses: Next.js 14 (App Router), Supabase (DB/Auth/Storage), Prisma ORM, Tailwind CSS
- See MVP requirements in `/docs` (coming soon)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Future Works

- **Creator Dashboard**: Views, downloads, earnings tracking
- **Admin Panel**: Asset moderation, reporting
- **In-App Payments**: License purchases & payouts
- **Personalized Recs**: Collaborative filtering & user profiling
- **Enhanced Search**: Tag filters, FTS fallback, typo tolerance
- **UI/UX Polishing**: Dark mode, improved mobile layout
- **Analytics & Monitoring**: Real-time metrics & error tracking
- **Testing & CI**: Unit/integration tests, GitHub Actions
- **Internationalization** (i18n)

---

Thank you for exploring AI Stock Hub! Feel free to contribute, report issues, or suggest features.
