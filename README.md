## User Management (Next.js + Prisma)

Production‑ready user management dashboard built with Next.js App Router, Prisma (PostgreSQL), Tailwind/shadcn‑ui, React Query, Zod, Sonner, Framer Motion, and Recharts.

- Root route `/` redirects to `/users`.
- CRUD for users with optimistic updates and filters/sorting.
- CSV export via `/api/users/export` and a Download button.
- Avatar upload to Cloudinary using `/api/upload`.
- Responsive: table collapses to cards on small screens.

## Tech Stack
- Next.js 14 (App Router)
- Prisma ORM + PostgreSQL
- Tailwind CSS + shadcn/ui components
- @tanstack/react-query for data fetching/caching
- zod for validation
- sonner for toasts
- framer-motion for subtle transitions
- lucide-react icons, recharts for charts

## Requirements
- Node.js 18+
- PostgreSQL database
- Cloudinary account (for avatar/image uploads)

## Setup
1) Install dependencies
- `npm install`

2) Create environment file `.env` (or `.env.local`)
- `DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"`
- `CLOUDINARY_CLOUD_NAME=your_cloud_name`
- `CLOUDINARY_API_KEY=your_api_key`
- `CLOUDINARY_API_SECRET=your_api_secret`
- Optional: `CLOUDINARY_FOLDER=user-avatars`
- Optional: `NEXT_PUBLIC_API_URL=/api` (default)

3) Set up the database
- Apply schema: `npx prisma migrate dev`
- Seed data: `npx prisma db seed`

4) Run the app
- Development: `npm run dev` (open http://localhost:3000)
- Build: `npm run build`
- Start: `npm start`

## Project Structure (highlights)
- `app/`
  - `page.tsx` → redirects to `/users`
  - `users/page.tsx` → main list with filters, analytics, responsive layout
  - `users/new/page.tsx` → create user
  - `users/[id]/page.tsx` → edit existing user
  - `api/users/` → REST endpoints for users (list/create and by id)
  - `api/users/export/route.ts` → CSV export
  - `api/upload/route.ts` → image upload to Cloudinary
- `lib/db.ts` → Prisma client
- `lib/cloudinary.ts` → Cloudinary config
- `components/` → shadcn/ui components and shared UI
- `prisma/schema.prisma` → DB schema, `prisma/seed.ts` → seed script

## Key Flows
### Users list
- Search, filter by role, date, sort by name/email/created, bulk selection and delete with undo window.
- Small screens: table collapses into animated cards.

### Create / Edit user
- Avatar field supports either a direct URL or selecting a file.
- If a file is selected, it is uploaded to Cloudinary only when you click “Create” or “Save”; the returned URL fills the avatar field and is stored in the DB.

### CSV export
- API: `GET /api/users/export`
- UI: “Download CSV” button on the `/users` page triggers a file download.

## API Endpoints (summary)
- `GET /api/users` → list users (supports search/filters/sort)
- `POST /api/users` → create user (Zod‑validated)
- `GET /api/users/:id` → get a user
- `PUT /api/users/:id` → update a user (partial)
- `DELETE /api/users/:id` → delete a user
- `GET /api/users/export` → export all users as CSV
- `POST /api/upload` → multipart/form-data with `file` → `{ url }` from Cloudinary

## Environment & Security Notes
- Treat `CLOUDINARY_API_SECRET` like a password. Never expose it client‑side.
- The upload happens on the server route (`/api/upload`) using a stream to Cloudinary.
- Ensure `DATABASE_URL` points to a reachable Postgres instance.

## Troubleshooting
- Prisma migration issues: `npx prisma migrate reset` (destructive; re‑seeds)
- Verify DB connection: `npx prisma db pull` or `npx prisma studio`
- Cloudinary auth: double‑check cloud name/key/secret and that the account allows uploads.

## Scripts
- `npm run dev` → start dev server
- `npm run build` → build production
- `npm start` → run production build
- `npm run lint` → lint

## License
Private/internal project. Do not distribute without permission.
