# Project Description: "A Kuwaiti from the Future" (Story Machine)

This file is a complete handover of the project: what it is, every decision made while building it, how it works, the full source code, and how to move it to a new Claude account, a new GitHub account and Vercel.

> **No secrets are in this file.** The OpenRouter API key lives only in `.env.local` on the original laptop, which is never pushed. You need to create a **new** key on the new account (see "Moving to new accounts").

---

## 1. Where the project came from

It started as the **Day 6 Weekend Challenge, "The Story Machine"** (optional, no grade), from a course that had already covered fetching facts with an AI over OpenRouter.

The brief, in short:

- **Core:** build a website or phone app where a person gives a *spark* (a character, place, mood or first line) and an AI writes them a story. Suggested shapes: a one-shot storyteller, a **choose-your-own-adventure**, or a themed machine.
- **Engine:** OpenRouter: one account, one key, a `:free` model, with hidden instructions (a system prompt) that ask for a story.
- **Extras (optional):** a voice (ElevenLabs), listening (Whisper on Groq), pictures (an image API), motion (Higgsfield).
- **Boss sparks (optional):** two models arguing, mood music, a story that remembers, shareable story links.
- **Rules about keys:** never push a key to GitHub; keep it in a settings file that is not pushed; never put a *paid* key in a published website; set spending limits; delete keys when done.
- **Save as you go:** commit and push every time a level works.
- **Done when:** a stranger can give it an idea and get back a story worth reading.

## 2. What we built (the final product)

**"A Kuwaiti from the Future" (كويتي من المستقبل)**: an interactive storybook website, inspired by **Mohammed Al-Sharekh**, the Kuwaiti pioneer who founded **Sakhr**, the company whose computers and software brought Arabic to the computer age in the 1980s.

The reader plays Mohammed ("you") and chooses what happens next on each page.

### Reader flow

1. **Introduction page** (page "i" / "أ"): portrait, title, three short paragraphs about computers that only spoke English, Al-Sharekh and Sakhr, and a note that the story is imagined. Button: **"Turn the page →"**.
2. **Cover / start page**: portrait, title, an optional "twist" text box (max 500 characters), three tappable starter ideas, and **"Begin the story"**.
3. **Story pages 1–5**: each page has:
   - a round portrait of Mohammed and a "Page N" heading,
   - an AI illustration of the scene,
   - about 90–130 words of story,
   - a **"🔊 Read it to me"** button (Pause / Resume / Stop while playing),
   - three choices on the latest page; the chosen one is shown under the scene as "→ choice",
   - a page number at the bottom ("— 1 —"; Arabic numerals in Arabic mode).
4. **Page 5 is the ending**: no choices, then "The End" and **"Tell another story"**.
5. A **"The story unfolds…"** placeholder page shows while the AI writes. If something fails, an error with a **Retry** button appears.

### Features

| Feature | How it works | Cost / key |
|---|---|---|
| Story generation | Next.js API route calls OpenRouter chat completions with a hidden system prompt; model replies in JSON | OpenRouter free model, key kept on the server |
| Choose-your-own-adventure | 3 choices per scene, story ends at scene 5 | – |
| English / Arabic switch | Buttons at the top. Arabic flips the page right-to-left, translates the whole interface, and asks the model for Modern Standard Arabic | – |
| Read aloud | Browser's built-in `speechSynthesis` (en-US / ar-SA) | Free, no key |
| Scene pictures | The model writes an English picture description; the page loads it from `image.pollinations.ai` | Free, no key, but rate-limited |
| Portrait on every page | Local photo `public/mohammed.png`; if missing, falls back to an AI-drawn portrait | Photo is not in Git (see below) |
| Storybook design | Aged paper pages, double ruled border, spine shadow, drop-cap first letter, page-turn animation, dark leather "desk" background | – |
| Page numbers | Roman "i" on the intro, 1–5 on story pages; Arabic-Indic numerals in Arabic | – |

### Tech stack

- **Next.js 15** (App Router), **React 19**, plain JavaScript (no TypeScript), plain CSS (no Tailwind).
- **OpenRouter** for text: `https://openrouter.ai/api/v1/chat/completions`.
- **Model:** `nvidia/nemotron-3-ultra-550b-a55b:free` (set by `OPENROUTER_MODEL`).
- **Pollinations** for images, browser **Web Speech API** for voice.
- Node 24 and npm 11 were used on Windows 11.

## 3. Project structure

```
story/
├─ app/
│  ├─ api/story/route.js   # server: builds the prompt, calls OpenRouter, returns JSON
│  ├─ page.js              # the whole UI (intro, cover, pages, voice, pictures, languages)
│  ├─ layout.js            # page <title> and description
│  └─ globals.css          # storybook styling
├─ public/
│  └─ mohammed.png         # portrait photo (LOCAL ONLY, git-ignored)
├─ .claude/launch.json     # lets Claude's preview pane run `npm run dev`
├─ .env.example            # template for settings (no real key)
├─ .env.local              # real key (LOCAL ONLY, git-ignored)
├─ .gitignore
├─ package.json
├─ package-lock.json
├─ README.md              # short guide for GitHub visitors
└─ projectDescription.md   # this file
```

## 4. How the story engine works

1. The browser sends `POST /api/story` with:
   ```json
   { "spark": "optional twist", "history": [{ "scene": "...", "choice": "..." }], "lang": "en" | "ar" }
   ```
2. The server (`route.js`):
   - rejects the request if `OPENROUTER_API_KEY` is missing (500) or the twist is over 500 characters (400);
   - works out the scene number (`history.length + 1`); scene 5 is the final scene;
   - builds the chat messages: system prompt (+ language rule), the twist or "Begin the story.", then each past scene as an *assistant* message followed by "I choose: …" as a *user* message, then "Write scene N of 5" or "This is the FINAL scene…";
   - calls OpenRouter (`temperature: 1`), up to 2 attempts; a 429 returns "The storyteller is busy";
   - pulls the first `{…}` JSON out of the reply, checks it has a `scene` string, keeps at most 3 choices and a picture description of at most 300 characters.
3. It replies:
   ```json
   { "scene": "...", "choices": ["...", "...", "..."], "image": "English picture description", "sceneNumber": 1, "ended": false }
   ```

### The hidden instructions (system prompt), summarised

- Narrator of "A Kuwaiti from the Future", a **respectful, fictionalized** tale inspired by Mohammed Al-Sharekh and Sakhr.
- Celebrate vision, curiosity, perseverance and the pride of bringing Arabic to computers.
- **Keep real-world claims modest:** invent scenes and dialogue, but never present invented events as fact, and never invent scandals or anything unflattering (he is a real person).
- 90–130 words, second person ("you" are Mohammed), warm tone, Kuwaiti sensory details (sea air, the souq, workshop tinkering, early keyboards); a gentle sense of "the future arriving early".
- Exactly 3 choices under 12 words, except the final scene, which gets an inspiring ending and no choices.
- Reply only with JSON `{scene, choices, image}`; `image` always in English, under 25 words, no text in the picture.
- Arabic mode adds: write the scene and choices in natural, elegant Modern Standard Arabic, keeping JSON keys and `image` in English.

### Pictures

- `HERO` constant: "a wise, kind older Kuwaiti man in his sixties with short grey hair, a neat grey moustache and thin-rimmed glasses, wearing a white dishdasha". It is added to every scene picture prompt so he looks consistent.
- `STYLE`: "classic children's storybook illustration, soft watercolor and ink, warm light, no text".
- URL: `https://image.pollinations.ai/prompt/<prompt>?width=768&height=432&nologo=true&seed=<n>`.
- If an image fails it is hidden, and the page still works.

### Voice

- `SpeechSynthesisUtterance` with `lang` `en-US` or `ar-SA`, rate 0.95, using the first installed voice that matches the language.
- If there is no Arabic voice on the computer, the reader sees "Your browser has no voice for this language." Chrome or Edge on Windows usually has one.

## 5. Settings and secrets

`.env.local` (never committed) holds two lines:

```
OPENROUTER_API_KEY=<your key>
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
```

`.gitignore` blocks `node_modules`, `.next`, `.env` and every `.env.*` except `.env.example`, plus `public/mohammed.png` and `/Screenshot*.png`.

**Security note:** the original OpenRouter key was pasted into the chat during building. **Delete that key on the old OpenRouter account** and make a new one on the new account, with a spending limit.

## 6. Build log: what happened, in order

| # | Step | Commit |
|---|---|---|
| 1 | Chose a **Next.js website** and the **choose-your-own-adventure** shape. Wrote `package.json`, API route, page, CSS, `.gitignore`, `.env.example` by hand (no `create-next-app`). Build passed. | `Story Machine: choose-your-own-adventure with OpenRouter` |
| 2 | Connected Git to `git@github.com:t072405-crypto/story.git` (branch `main`). Git had no identity, so a repo-only identity was set (name `abbas`, school email). | (same) |
| 3 | Themed the story: **"A Kuwaiti from the Future"**, about Mohammed Al-Sharekh and Sakhr. The twist became optional. | `Theme story: A Kuwaiti from the Future` (2 commits: the first only changed the title because Python wasn't installed; the second applied the real edits) |
| 4 | Added the OpenRouter key to `.env.local`. The planned free model `meta-llama/llama-3.3-70b-instruct:free` no longer existed (404); both Gemma 4 free models were rate-limited (429); `thinkingmachines/inkling:free` was only allowed in coding tools (403). **`nvidia/nemotron-3-ultra-550b-a55b:free` worked.** | `Use working free model (Nemotron)` |
| 5 | Added **all three** extras the user chose: Arabic mode, read-aloud voice, scene pictures. Tested an Arabic scene (valid; one stray Portuguese word slipped in once). | `Add Arabic mode, read-aloud voice, and scene illustrations` |
| 6 | **Storybook design**: paper pages, page numbers, portrait on every page. Fixed a bug where the fallback portrait never loaded, because the missing photo failed before React attached `onError`; it now also checks on mount. Changed the AI portrait to an **older, wiser look** (grey hair, glasses), as chosen by the user. | `Storybook design: paper pages, page numbers, portrait on every page` |
| 7 | The user supplied a **real photo** (an Al Jazeera documentary poster, "الشارخ.. صخر الضاد"). Saved as `public/mohammed.png`, cropped in the circle to his face (`object-position: 50% 32%`) so the logo and title text are hidden. **Kept out of Git** because it is a broadcaster's image in a public repo. | `Use local photo for portrait, framed on the face` |
| 8 | A screenshot of the poster dropped in the folder was pushed by accident; it was **removed from GitHub history** (two commits squashed, force-pushed). | (history rewritten) |
| 9 | Added the **introduction page** before the story, in both languages. | `Add introduction page before the story` |

### Problems met and lessons

- **Free models disappear or get rate-limited.** If stories stop coming, change `OPENROUTER_MODEL` to another model ending in `:free`. To list current free text models:
  ```bash
  curl -s https://openrouter.ai/api/v1/models | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const x of JSON.parse(s).data)if(x.id.endsWith(":free"))console.log(x.id)})'
  ```
- **Pollinations free limit:** about 1 image every 45 seconds. When it's over the limit it returns an image saying "Free limit reached", so pictures and the AI portrait can show that. The local photo avoids this for the portrait.
- **Running `next build` while `next dev` is running breaks the dev server's styling** (they share `.next`). Stop the dev server, delete `.next`, and start again.
- **Python isn't installed** on the original laptop, so use Node or the shell for scripts.
- Heredocs with many quotes inside one long Bash command failed to parse once, so write files separately.

## 7. Not done yet / ideas

- **Sakhr computer picture on every page:** requested; waiting for the user to send a photo. Plan: save as `public/sakhr.png`, show it as a small "pasted photo" opposite the portrait in each page header and larger on the intro page, and keep it out of Git unless it's freely licensed.
- **Not built:** ElevenLabs voice, Whisper speech input, Higgsfield video, the "Boss" ideas (two models arguing, mood music, saving progress, shareable links).
- The full five-page story hasn't been played through end to end in the browser, and the Arabic intro and the voice haven't been checked by eye.

## 8. Moving to new accounts

### New GitHub

1. Create a new **empty** repository on the new account (no README).
2. In the project folder, point Git at it and push:
   ```bash
   git remote set-url origin git@github.com:<new-user>/<new-repo>.git
   git push -u origin main
   ```
   The new account needs an SSH key added under GitHub → Settings → SSH keys. Optionally update the commit identity: `git config user.name "..."` and `git config user.email "..."`.
3. Or start fresh: copy the folder **without** `node_modules`, `.next` and `.git`, then `git init -b main`, commit, add the new remote and push.

### New OpenRouter key

1. Sign up on openrouter.ai with the new account, create a key, and **set a spending limit**.
2. Create `.env.local` from `.env.example` and paste the key.
3. Delete the old key on the old account.

### Vercel

1. Sign in to Vercel with the new GitHub account → **Add New → Project** → import the repo. The framework is detected as Next.js; no build settings need changing.
2. Under **Settings → Environment Variables**, add `OPENROUTER_API_KEY` (the new key, **free plan only**) and `OPENROUTER_MODEL`.
3. Deploy. The key stays on the server (it's only read in `route.js`), so visitors can't see it, but anyone can use up its free limit.
4. **The portrait photo isn't in Git, so it won't appear on Vercel**: the site shows the AI-drawn fallback portrait instead. To show the real photo online, commit `public/mohammed.png` (remove its line from `.gitignore`), keeping in mind it's an Al Jazeera image.

### New Claude account

- Open the folder in Claude Code and point it at this file: "Read projectDescription.md and continue from section 7."

### Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

---

## 9. Full source code

Every file in the repository, exactly as it is now (except `package-lock.json`, which `npm install` recreates, and `.env.local`, which holds the secret).

### `package.json`

```json
{
  "name": "story-machine",
  "version": "0.1.0",
  "private": true,
  "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },
  "dependencies": { "next": "^15.0.0", "react": "^19.0.0", "react-dom": "^19.0.0" }
}
```

### `.gitignore`

```text
node_modules
.next
.env
.env.*
!.env.example

# Photo from an Al Jazeera poster: used locally, not published
public/mohammed.png
/Screenshot*.png
```

### `.env.example`

```text
# Copy to .env.local and fill in. Never commit .env.local.
OPENROUTER_API_KEY=
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
```

### `.claude/launch.json`

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "dev",
      "runtimeExecutable": "npm",
      "runtimeArgs": [
        "run",
        "dev"
      ],
      "port": 3000
    }
  ]
}
```

### `app/layout.js`

```js
import "./globals.css";

export const metadata = { title: "A Kuwaiti from the Future", description: "An interactive story inspired by Mohammed Al-Sharekh and the Sakhr computer." };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### `app/api/story/route.js`

```js
const MAX_SCENES = 5;

const SYSTEM = `You narrate an interactive story titled "A Kuwaiti from the Future".
It is a respectful, fictionalized tale inspired by Mohammed Al-Sharekh, the Kuwaiti pioneer behind Sakhr, the company and computers that taught machines to work in Arabic in the 1980s. Celebrate his vision, curiosity and perseverance, and the pride of bringing Arabic to the computer age. Keep real-world claims modest: invent scenes, dialogue and small details freely, but never present invented events as documented fact, and never invent scandals or anything unflattering.
Rules:
- Write each scene as 90-130 words of vivid prose in second person ("you" are Mohammed), warm in tone, with sensory details of Kuwait (sea air, the souq, workshop tinkering, early computers and keyboards).
- A gentle sense of "the future arriving early" runs through the story.
- If the reader gives a twist, weave it in and honor earlier choices.
- Unless told this is the final scene, end with exactly 3 distinct choices, each under 12 words.
- If told this is the final scene, write an inspiring ending and give NO choices.
- Reply with ONLY valid JSON: {"scene": string, "choices": string[], "image": string}. "image" is always in ENGLISH: one short sentence (under 25 words) describing the scene as an illustration, painterly, warm light, no text in the picture. No markdown, no extra text.`;

function parse(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no json");
  const data = JSON.parse(match[0]);
  if (typeof data.scene !== "string") throw new Error("bad shape");
  return { scene: data.scene, image: typeof data.image === "string" ? data.image.slice(0, 300) : "", choices: Array.isArray(data.choices) ? data.choices.slice(0, 3).map(String) : [] };
}

export async function POST(req) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return Response.json({ error: "Server is missing OPENROUTER_API_KEY." }, { status: 500 });

  const { spark, history = [], lang = "en" } = await req.json();
  if (typeof spark !== "string" || spark.length > 500)
    return Response.json({ error: "Keep your twist under 500 characters." }, { status: 400 });

  const sceneNumber = history.length + 1;
  const isFinal = sceneNumber >= MAX_SCENES;
  const messages = [
    { role: "system", content: SYSTEM + (lang === "ar" ? "\nWrite the scene and the choices in natural, elegant Modern Standard Arabic. Keep the JSON keys and the \"image\" value in English." : "\nWrite in English.") },
    { role: "user", content: spark.trim() ? `Reader twist: ${spark.trim()}` : "Begin the story." },
    ...history.slice(-MAX_SCENES).flatMap((h) => [
      { role: "assistant", content: String(h.scene).slice(0, 1500) },
      { role: "user", content: `I choose: ${String(h.choice).slice(0, 200)}` },
    ]),
    { role: "user", content: isFinal ? "This is the FINAL scene. Write the ending, no choices." : `Write scene ${sceneNumber} of ${MAX_SCENES}.` },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free", messages, temperature: 1 }),
      });
      if (!res.ok) {
        if (res.status === 429) return Response.json({ error: "The storyteller is busy. Try again in a moment." }, { status: 429 });
        continue;
      }
      const out = await res.json();
      const story = parse(out.choices[0].message.content);
      if (isFinal) story.choices = [];
      return Response.json({ ...story, sceneNumber, ended: isFinal || story.choices.length === 0 });
    } catch {}
  }
  return Response.json({ error: "The storyteller got tongue-tied. Please try again." }, { status: 502 });
}
```

### `app/page.js`

```js
"use client";
import { useState, useRef, useEffect } from "react";

const T = {
  en: {
    title: "A Kuwaiti from the Future",
    sub: "An interactive story inspired by Mohammed Al-Sharekh, who helped teach the computer to speak Arabic. Add a twist of your own, or just begin.",
    placeholder: "Add a twist (optional)...",
    ideas: ["It begins in a small Kuwait workshop at night", "A mysterious visitor arrives carrying a glowing keyboard", "The first Arabic letters appear on the screen"],
    begin: "Begin the story", weaving: "Weaving your story...", unfolds: "The story unfolds...",
    end: "The End", again: "Tell another story", retry: "Retry",
    read: "Read it to me", pause: "Pause", resume: "Resume", stop: "Stop", noVoice: "Your browser has no voice for this language.",
    speech: "en-US", chapter: "Page", hero: "Mohammed Al-Sharekh",
    introHead: "Introduction",
    intro: [
      "Long before phones spoke every language, computers spoke only one. Their keyboards, screens and programs were built for English letters, and Arabic had no place on them.",
      "In the early 1980s, a Kuwaiti dreamer named Mohammed Al-Sharekh set out to change that. He founded Sakhr, whose computers and programs taught the machine to read and write in Arabic, and a whole generation of Arab children met the computer age in their own language.",
      "The story you are about to read is imagined, inspired by his journey. You will walk in his footsteps, and at every turn of the page, you choose what happens next.",
    ],
    turn: "Turn the page →",
  },
  ar: {
    title: "كويتي من المستقبل",
    sub: "قصة تفاعلية مستوحاة من محمد الشارخ، الذي ساهم في تعليم الحاسوب اللغة العربية. أضف لمسة من عندك، أو ابدأ مباشرة.",
    placeholder: "أضف لمسة خاصة (اختياري)...",
    ideas: ["تبدأ القصة في ورشة صغيرة في الكويت ليلاً", "يصل زائر غامض يحمل لوحة مفاتيح متوهجة", "تظهر الحروف العربية الأولى على الشاشة"],
    begin: "ابدأ القصة", weaving: "نحيك قصتك...", unfolds: "القصة تتكشف...",
    end: "النهاية", again: "احكِ قصة أخرى", retry: "إعادة المحاولة",
    read: "اقرأها لي", pause: "إيقاف مؤقت", resume: "استئناف", stop: "إيقاف", noVoice: "متصفحك لا يملك صوتاً لهذه اللغة.",
    speech: "ar-SA", chapter: "صفحة", hero: "محمد الشارخ",
    introHead: "المقدمة",
    intro: [
      "قبل زمن طويل من الهواتف التي تتحدث كل اللغات، كانت الحواسيب لا تعرف إلا لغة واحدة. صُنعت لوحات مفاتيحها وشاشاتها وبرامجها للحروف الإنجليزية، ولم يكن للعربية مكان فيها.",
      "في مطلع الثمانينيات، قرر حالم كويتي اسمه محمد الشارخ أن يغيّر ذلك. فأسس شركة صخر، التي علّمت حواسيبها وبرامجها الآلة أن تقرأ وتكتب بالعربية، فالتقى جيل كامل من الأطفال العرب بعصر الحاسوب بلغتهم.",
      "القصة التي ستقرؤها متخيَّلة، مستوحاة من رحلته. ستسير على خطاه، وعند كل صفحة تختار أنت ما سيحدث بعد ذلك.",
    ],
    turn: "← اقلب الصفحة",
  },
};

// Same description every time so the character looks consistent across pages.
const HERO = "a wise, kind older Kuwaiti man in his sixties with short grey hair, a neat grey moustache and thin-rimmed glasses, wearing a white dishdasha";
const STYLE = "classic children's storybook illustration, soft watercolor and ink, warm light, no text";

function pictureUrl(prompt, seed, w = 768, h = 432) {
  const p = encodeURIComponent(`${prompt}, ${STYLE}`);
  return `https://image.pollinations.ai/prompt/${p}?width=${w}&height=${h}&nologo=true&seed=${seed}`;
}

// Drop your own photo at public/mohammed.png to use it; otherwise an illustrated portrait is used.
const PORTRAIT_FALLBACK = pictureUrl(`head and shoulders portrait of ${HERO}, bareheaded, thoughtful gentle smile, oval vignette`, 1942, 320, 320);

function Portrait({ alt }) {
  const [src, setSrc] = useState("/mohammed.png");
  const img = useRef(null);
  const fallback = () => src !== PORTRAIT_FALLBACK && setSrc(PORTRAIT_FALLBACK);
  // The photo can fail before React attaches onError (server-rendered), so check once on mount too.
  useEffect(() => { const el = img.current; if (el?.complete && el.naturalWidth === 0) fallback(); }, []);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={img} className="portrait" src={src} alt={alt} onError={fallback} />
  );
}

const pageNumber = (n, lang) => (lang === "ar" ? n.toLocaleString("ar-EG") : String(n));

export default function Home() {
  const [lang, setLang] = useState("en");
  const [spark, setSpark] = useState("");
  const [showIntro, setShowIntro] = useState(true);
  const [started, setStarted] = useState(false);
  const [scenes, setScenes] = useState([]); // {scene, image, choice?}
  const [choices, setChoices] = useState([]);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(null); // null | "playing" | "paused"
  const [speakingIdx, setSpeakingIdx] = useState(-1);
  const [badImages, setBadImages] = useState({});
  const end = useRef(null);
  const t = T[lang];

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [scenes, loading]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  async function next(history, text) {
    stopSpeech();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spark: text, history: history.map(({ scene, choice }) => ({ scene, choice })), lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setScenes([...history, { scene: data.scene, image: data.image }]);
      setChoices(data.choices); setEnded(data.ended); setStarted(true);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function stopSpeech() {
    window.speechSynthesis?.cancel();
    setSpeaking(null); setSpeakingIdx(-1);
  }
  function speak(i) {
    const synth = window.speechSynthesis;
    if (!synth) return setError(t.noVoice);
    stopSpeech();
    const u = new SpeechSynthesisUtterance(scenes[i].scene);
    u.lang = t.speech;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    if (voice) u.voice = voice; else if (lang === "ar") return setError(t.noVoice);
    u.rate = 0.95;
    u.onend = u.onerror = () => { setSpeaking(null); setSpeakingIdx(-1); };
    setSpeaking("playing"); setSpeakingIdx(i);
    synth.speak(u);
  }
  function togglePause() {
    const synth = window.speechSynthesis;
    if (speaking === "playing") { synth.pause(); setSpeaking("paused"); }
    else { synth.resume(); setSpeaking("playing"); }
  }

  const start = () => next([], spark);
  const pick = (c) => {
    const history = scenes.map((s, i) => (i === scenes.length - 1 ? { ...s, choice: c } : s));
    setScenes(history);
    setChoices([]);
    next(history, spark);
  };
  const retry = () => next(scenes, spark);
  const reset = () => { stopSpeech(); setStarted(false); setScenes([]); setChoices([]); setEnded(false); setError(""); setBadImages({}); };
  const switchLang = (l) => { reset(); setLang(l); };

  return (
    <main dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <div className="langs">
        <button className={lang === "en" ? "on" : ""} onClick={() => switchLang("en")}>English</button>
        <button className={lang === "ar" ? "on" : ""} onClick={() => switchLang("ar")}>العربية</button>
      </div>
      {showIntro ? (
        <section className="page intro">
          <Portrait alt={t.hero} />
          <h1>{t.title}</h1>
          <div className="flourish">❦</div>
          <h2 className="chapter">{t.introHead}</h2>
          {t.intro.map((p) => <p key={p} className="text">{p}</p>)}
          <button className="primary" onClick={() => setShowIntro(false)}>{t.turn}</button>
          <footer className="pagenum">— {lang === "ar" ? "أ" : "i"} —</footer>
        </section>
      ) : !started ? (
        <section className="page cover">
          <Portrait alt={t.hero} />
          <h1>{t.title}</h1>
          <div className="flourish">❦</div>
          <p className="sub">{t.sub}</p>
          <textarea value={spark} maxLength={500} onChange={(e) => setSpark(e.target.value)} placeholder={t.placeholder} rows={3} />
          <div className="ideas">{t.ideas.map((i) => <button key={i} className="chip" onClick={() => setSpark(i)}>{i}</button>)}</div>
          <button className="primary" onClick={start} disabled={loading}>{loading ? t.weaving : t.begin}</button>
        </section>
      ) : (
        <>
          <h1 className="running">{t.title}</h1>
          {scenes.map((s, i) => {
            const last = i === scenes.length - 1;
            return (
              <section key={i} className="page">
                <header className="pagehead">
                  <Portrait alt={t.hero} />
                  <span className="chapter">{t.chapter} {pageNumber(i + 1, lang)}</span>
                </header>
                {s.image && !badImages[i] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="pic" src={pictureUrl(`${HERO}. ${s.image}`, i + 7)} alt="" loading="lazy" onError={() => setBadImages((b) => ({ ...b, [i]: true }))} />
                )}
                <p className="text">{s.scene}</p>
                <div className="voice">
                  {speakingIdx === i ? (
                    <>
                      <button className="chip" onClick={togglePause}>{speaking === "paused" ? t.resume : t.pause}</button>
                      <button className="chip" onClick={stopSpeech}>{t.stop}</button>
                    </>
                  ) : (
                    <button className="chip" onClick={() => speak(i)}>🔊 {t.read}</button>
                  )}
                </div>
                {s.choice && <p className="picked">→ {s.choice}</p>}
                {last && !loading && choices.map((c) => <button key={c} className="choice" onClick={() => pick(c)}>{c}</button>)}
                {last && !loading && ended && <><p className="theend">{t.end}</p><button className="primary" onClick={reset}>{t.again}</button></>}
                <footer className="pagenum">— {pageNumber(i + 1, lang)} —</footer>
              </section>
            );
          })}
          {loading && <section className="page turning"><p className="loading">{t.unfolds}</p></section>}
        </>
      )}
      {error && <p className="error">{error} {!loading && <button className="chip" onClick={started ? retry : start}>{t.retry}</button>}</p>}
      <div ref={end} />
    </main>
  );
}
```

### `app/globals.css`

```css
* { box-sizing: border-box; }
:root {
  --paper: #f6ecd2; --paper-edge: #e3d0a4; --ink: #3b2a1a; --ink-soft: #6e5638;
  --accent: #8a3b1e; --gold: #b8862f;
}
body {
  margin: 0; color: var(--ink); line-height: 1.75;
  font-family: "Palatino Linotype", Palatino, "Book Antiqua", Georgia, "Traditional Arabic", "Times New Roman", serif;
  /* dark leather desk the book rests on */
  background: radial-gradient(ellipse at top, #4a2f1d 0%, #2a1a10 60%, #1a100a 100%) fixed;
}
main { max-width: 720px; margin: 0 auto; padding: 24px 16px 80px; }

.langs { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; }
.langs button { background: transparent; color: #e9d7ae; border: 1px solid #7a5a3a; border-radius: 999px; padding: 4px 14px; }
.langs .on { background: var(--gold); color: #2a1a10; border-color: var(--gold); }

/* a storybook page: aged paper, inner shadow at the spine, double ruled border */
.page {
  position: relative; margin: 0 0 28px; padding: 36px 40px 56px;
  background:
    radial-gradient(ellipse at center, rgba(255,250,235,.9) 0%, rgba(246,236,210,0) 70%),
    linear-gradient(90deg, rgba(120,90,50,.18) 0%, rgba(120,90,50,0) 6%, rgba(120,90,50,0) 94%, rgba(120,90,50,.12) 100%),
    var(--paper);
  border-radius: 4px 10px 10px 4px;
  box-shadow: 0 1px 0 var(--paper-edge), 0 3px 0 #d9c393, 0 5px 0 #cdb581, 0 18px 40px rgba(0,0,0,.55);
  animation: turn .7s ease;
}
[dir="rtl"] .page { border-radius: 10px 4px 4px 10px; }
.page::before {
  content: ""; position: absolute; inset: 14px; pointer-events: none;
  border: 2px solid rgba(138,59,30,.35); outline: 1px solid rgba(138,59,30,.2); outline-offset: 4px; border-radius: 2px;
}

h1 { text-align: center; font-weight: normal; letter-spacing: .06em; color: var(--accent); margin: 8px 0 0; font-size: 2.1rem; }
.running { color: #e9d7ae; font-size: 1.2rem; letter-spacing: .2em; margin-bottom: 18px; font-variant: small-caps; }
.flourish { text-align: center; color: var(--gold); font-size: 1.6rem; margin: 2px 0 6px; }
.sub { text-align: center; color: var(--ink-soft); font-style: italic; }

.cover { text-align: center; }
.cover .portrait { width: 150px; height: 150px; margin: 8px auto 4px; display: block; }

.portrait {
  width: 76px; height: 76px; object-fit: cover; object-position: 50% 32%; border-radius: 50%;
  border: 3px solid var(--gold); box-shadow: 0 0 0 3px var(--paper), 0 0 0 5px rgba(138,59,30,.4), 0 4px 10px rgba(0,0,0,.25);
  background: var(--paper-edge);
}
.pagehead { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.chapter { color: var(--accent); font-variant: small-caps; letter-spacing: .15em; font-size: 1.05rem; }

.pic {
  width: 100%; aspect-ratio: 16 / 9; object-fit: cover; margin: 0 0 18px;
  border: 6px solid #fffaf0; box-shadow: 0 2px 8px rgba(0,0,0,.25); background: var(--paper-edge);
}
.text { margin: 0 0 10px; font-size: 1.15rem; text-align: justify; }
[dir="ltr"] .text::first-letter {
  float: left; font-size: 3.4rem; line-height: .9; padding: 6px 8px 0 0; color: var(--accent); font-weight: bold;
}
[dir="rtl"] .text { font-size: 1.3rem; line-height: 2; }

textarea {
  width: 100%; padding: 12px 14px; border-radius: 6px; border: 1px solid var(--paper-edge);
  background: rgba(255,252,240,.8); color: var(--ink); font: inherit; resize: vertical; margin-top: 8px;
}
.ideas { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 20px; justify-content: center; }
button { font: inherit; cursor: pointer; }
.chip { background: rgba(255,252,240,.7); color: var(--ink-soft); border: 1px solid var(--paper-edge); border-radius: 999px; padding: 3px 12px; font-size: .85rem; }
.chip:hover { border-color: var(--gold); }
.primary { width: 100%; padding: 12px; border: 0; border-radius: 6px; background: var(--accent); color: #fdf5e2; font-weight: bold; letter-spacing: .05em; }
.primary:disabled { opacity: .5; cursor: default; }
.voice { display: flex; gap: 8px; margin: 4px 0 10px; }
.picked { color: var(--accent); font-style: italic; font-size: .95rem; margin: 6px 0 0; }
.choice {
  display: block; width: 100%; text-align: start; margin: 10px 0; padding: 11px 16px;
  background: rgba(255,252,240,.75); color: var(--ink); border: 1px solid var(--paper-edge); border-inline-start: 4px solid var(--gold); border-radius: 4px;
}
.choice:hover { background: #fffaf0; border-inline-start-color: var(--accent); }

.pagenum { position: absolute; bottom: 22px; left: 0; right: 0; text-align: center; color: var(--ink-soft); font-size: .95rem; letter-spacing: .2em; }
.turning { min-height: 160px; display: flex; align-items: center; justify-content: center; }
.loading { color: var(--ink-soft); font-style: italic; animation: pulse 1.4s infinite; }
.theend { text-align: center; font-size: 1.5rem; color: var(--accent); letter-spacing: .25em; margin: 24px 0 14px; }
.error { color: #ffb4a0; text-align: center; }

@keyframes turn { from { opacity: 0; transform: perspective(1200px) rotateY(-8deg) translateY(6px); transform-origin: left; } }
@keyframes pulse { 50% { opacity: .4; } }

@media (max-width: 520px) {
  .page { padding: 28px 22px 52px; }
  .page::before { inset: 8px; }
  h1 { font-size: 1.6rem; }
  .portrait { width: 60px; height: 60px; }
}
.intro { text-align: center; }
.intro .portrait { width: 150px; height: 150px; margin: 8px auto 4px; display: block; }
.intro h2.chapter { font-weight: normal; font-size: 1.3rem; margin: 6px 0 14px; }
.intro .text { text-align: start; }
.intro .text + .text::first-letter { float: none; font-size: inherit; padding: 0; color: inherit; font-weight: inherit; }
.intro .primary { margin-top: 14px; }
```
