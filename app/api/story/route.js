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
