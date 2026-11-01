const MAX_SCENES = 5;

const SYSTEM = `You are the narrator of a choose-your-own-adventure story for a general audience.
Rules:
- Write each scene as 90-130 words of vivid, atmospheric prose in second person ("you").
- Stay true to the reader's spark (character, place, mood, first line) and to earlier choices.
- Unless told this is the final scene, end with exactly 3 distinct choices, each under 12 words.
- If told this is the final scene, write a satisfying ending and give NO choices.
- Reply with ONLY valid JSON: {"scene": string, "choices": string[]}. No markdown, no extra text.`;

function parse(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no json");
  const data = JSON.parse(match[0]);
  if (typeof data.scene !== "string") throw new Error("bad shape");
  return { scene: data.scene, choices: Array.isArray(data.choices) ? data.choices.slice(0, 3).map(String) : [] };
}

export async function POST(req) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return Response.json({ error: "Server is missing OPENROUTER_API_KEY." }, { status: 500 });

  const { spark, history = [] } = await req.json();
  if (typeof spark !== "string" || !spark.trim() || spark.length > 500)
    return Response.json({ error: "Give me a spark (under 500 characters)." }, { status: 400 });

  const sceneNumber = history.length + 1;
  const isFinal = sceneNumber >= MAX_SCENES;
  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Spark: ${spark.trim()}` },
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
        body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free", messages, temperature: 1 }),
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
