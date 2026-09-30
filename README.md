# Splash of Color Painters

A warm, responsive redesign for Splash of Color Painters, LLC in Sugar Grove, Illinois.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Deployment

Pushes to `main` are built and deployed to GitHub Pages by
`.github/workflows/deploy-pages.yml`. The published project URL is configured as:

`https://<github-username>.github.io/splash-of-color-painters/`

## Source archive

The original public site was archived on 2026-09-29:

- `source/content/` — one Markdown file per sitemap page
- `source/raw/` — original HTML snapshots
- `source/color-profile.md` — extracted Wix color variables
- `source/assets.json` — downloaded image manifest
- `public/assets/source/` — 110 original image assets

The scripts in `scripts/` can refresh the archive and generate contact sheets for visual review.
