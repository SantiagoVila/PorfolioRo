# Rosario Medina — Portfolio

Portfolio of Rosario Medina (fashion design, styling, art direction and editorial production). A single-page experience set in her studio: her name and her cap on the wall, four projects on the desk (CHACARITA, COLORFULL, B&W and THE DAILY), her own About material and a contact card. Projects open out of their objects on the desk into their own full-screen experiences.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS 4
- framer-motion 13
- `next/font` (fonts self-hosted at build time) and `next/image`

## Requirements

Node.js 20.9 or newer, npm.

## Getting started

```bash
npm install
npm run dev
```

The site runs at <http://localhost:3000>.

### Testing on a phone (same network)

`npm run dev` listens on every network interface. Open `http://<this computer's LAN IP>:3000` on the phone. The development server accepts requests from `192.168.*.*` addresses (`allowedDevOrigins` in `next.config.ts`); add other private ranges there if your network uses them. This applies to development only.

## Checks and production build

```bash
npx tsc --noEmit   # type check
npm run lint       # ESLint
npm run build      # production build
npm run start      # serve the production build at http://localhost:3000
```

## Project structure

```
src/
  app/                 layout (metadata, viewport, fonts), the page, global CSS, favicon and Apple touch icon
  components/
    Studio/            the studio scene: camera and states, desk layout, desk objects, About and Contact
    Projects/          opening and closing a project, the project shell, one folder per project
    HeroStage.tsx      the intro: the cap and its caption
    CapViewer.tsx      the cap, drawn from 92 frames
    SiteHeader.tsx     navigation
  hooks/               scroll → state and camera, stage fitting, frame loading, the cap's cursor behaviour
  data/                About and Contact (profile.ts), the desk's projects (projectsData.ts)
public/                served assets: the cap frames, studio plates, project images, the film, the Daily's PDFs
source-assets/         source material that is not served (see below)
```

`source-assets/cap-frames/` holds the original 92 renders of the cap. The site uses `public/frames-grounded/`, derived from them with the studio floor removed and the cap's shadow kept as transparency.

## Content

| What | Where |
| --- | --- |
| Contact details | `src/data/profile.ts` → `CONTACT` |
| About text and portrait | `src/data/profile.ts` → `ABOUT` |
| Desk projects (title, category, cover) | `src/data/projectsData.ts` |
| CHACARITA / COLORFULL / B&W | `src/components/Projects/<project>/<project>Content.ts` |
| THE DAILY and its stories | `src/components/Projects/daily/dailyContent.ts`, `daily/stories/` |
| Title, description, social cards | `src/app/layout.tsx` |

**Contact.** Each field in `CONTACT` is `null` until supplied: `email`, `instagram` (handle without `@`), `linkedin` (full profile URL) and `cv` (a URL, or a public path such as `/cv/rosario-medina.pdf` with the file placed in `public/cv/`). The Contact card shows a field, with its actions, as soon as it has a value, and nothing for an empty one.

## URLs

The site is one page. Direct links:

- `/#work` (or `/#projects`), `/#about`, `/#contact`
- `/?project=chacarita`, `colorfull`, `bw`, `journalism` (THE DAILY)
- `/?project=journalism&story=artlab`, `arteba`, `explorers`

## Environment variables

None are required.

## Deployment

Deploys to Vercel as a standard Next.js project: default build command (`next build`), no environment variables, no custom routing. The page is statically prerendered; images are served through Next.js image optimization.

Security headers are set in `next.config.ts`: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, and `X-Powered-By` is off. The Content Security Policy is currently **Report-Only** (`Content-Security-Policy-Report-Only`): verify it on the Vercel preview deployment (browser console and DevTools Issues show any report) before switching it to an enforced `Content-Security-Policy`. Vercel's preview toolbar may itself trigger reports on preview deployments only.

Once the final domain is known, add `metadataBase`, a canonical URL, a social share image, `robots` and `sitemap`.
