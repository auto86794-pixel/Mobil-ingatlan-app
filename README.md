This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## SEO

The app includes global Hungarian metadata, canonical URLs, Open Graph/Twitter metadata, robots.txt, a dynamic sitemap for active listings, per-listing metadata, and Schema.org structured data for the website and listing pages.


## Step 10 – technical stabilization

- Next.js updated within the existing major line to 14.2.35.
- React pinned to 18.3.1 to avoid an unnecessary React 19 / Next 16 migration in this stabilization pass.
- Firebase updated conservatively within v10 to 10.12.5.
- Added `npm run typecheck` and `npm run check`.
- Added baseline response security headers and removed the `X-Powered-By` header.
- Firebase Storage image configuration now uses `remotePatterns`.
- Node.js 20–22 is the supported runtime range for this project revision.

After replacing the project, run `npm install` once so `package-lock.json` is refreshed for the updated dependency versions, then run `npm run check`.
