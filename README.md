# A Kuwaiti from the Future · كويتي من المستقبل

An interactive storybook website inspired by **Mohammed Al-Sharekh**, the Kuwaiti pioneer behind **Sakhr**, the computers and software that brought Arabic to the computer age. You play Mohammed, and on every page an AI writes the next scene and gives you three choices. The story ends after five pages.

Built for the *Story Machine* weekend challenge with Next.js and OpenRouter.

## Features

- **Choose-your-own-adventure:** an introduction page, a start page with an optional twist, then five numbered story pages.
- **English and Arabic:** switch at the top. Arabic flips the page right-to-left and the AI writes in Modern Standard Arabic.
- **Read it to me:** reads each page aloud with the browser's built-in voice, with pause and stop.
- **Pictures:** an AI illustration for every scene (free, from pollinations.ai).
- **Storybook look:** paper pages, page numbers and a portrait of Mohammed on every page.

## Run it

You need Node.js 18 or newer and a free [OpenRouter](https://openrouter.ai) key.

```bash
npm install
```

Copy `.env.example` to `.env.local` and put your key in it:

```
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
```

```bash
npm run dev
```

Then open http://localhost:3000.

If stories stop coming, the free model may be busy or retired. Set `OPENROUTER_MODEL` to another model ending in `:free`.

## Portrait photo

Put a photo at `public/mohammed.png` to use it as the portrait on every page. Without it, the app uses an AI-drawn portrait. The photo is git-ignored, so it isn't published.

## Deploy to Vercel

Import the repository in Vercel, which detects Next.js. Add `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` under **Settings → Environment Variables**, then deploy. Only use a **free** key on a public site.

## Keys and safety

- `.env.local` is never committed. Never push a key to GitHub.
- The key is only used on the server (`app/api/story/route.js`), so visitors can't see it.
- Set a spending limit on any key, and delete it if it leaks.

## Project files

| File | What it does |
|---|---|
| `app/api/story/route.js` | Builds the hidden instructions, calls OpenRouter, returns the scene as JSON |
| `app/page.js` | The whole interface: intro, start page, story pages, voice, pictures, languages |
| `app/globals.css` | Storybook styling |
| `app/layout.js` | Page title and description |
| `projectDescription.md` | Full handover: every decision, the build log and all source code |

The story is fiction inspired by a real person's journey. It is not a historical record.
