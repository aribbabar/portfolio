# Arib Farooqui Portfolio

A terminal-flavored portfolio built with Astro and React.

It highlights projects, skills, resume links, and an interactive contact terminal with a tiny fake filesystem. The tone is intentionally developer-mode: practical, playful, and a little sarcastic.

## Run It

Requires Node.js `22.12.0` or newer.

```sh
npm install
npm run dev
```

## Useful Commands

```sh
npm run check
npm run build
npm run preview
npm run preview:pages
npm run deploy:pages
```

## Cloudflare Deployment

Deploy this site as a Cloudflare Pages project, not as a Worker.

Recommended Pages settings:

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root

For manual deploys, use:

```sh
npm run deploy:pages
```

Avoid `wrangler deploy` for this repo. The site is static, and deploying it as a Worker can make Wrangler try to provision an unnecessary `SESSION` KV namespace, which fails if Cloudflare already has a namespace with the generated title.

## Stack

Astro, React, TypeScript, Pixelarticons, and enough terminal energy to justify `sudo hire-me`.
