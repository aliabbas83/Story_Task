"use client";
import { useState, useRef, useEffect } from "react";

const IDEAS = [
  "A lighthouse keeper who finds a door in the sea, spooky",
  "A tiny dragon afraid of fire, in a busy bakery, cozy",
  "Last bus to Mars. First line: 'Nobody told me about the dog.'",
];

export default function Home() {
  const [spark, setSpark] = useState("");
  const [started, setStarted] = useState(false);
  const [scenes, setScenes] = useState([]); // {scene, choice?}
  const [choices, setChoices] = useState([]);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const end = useRef(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [scenes, loading]);

  async function next(history, text) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spark: text, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setScenes([...history, { scene: data.scene }]);
      setChoices(data.choices); setEnded(data.ended); setStarted(true);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  const start = () => spark.trim() && next([], spark);
  const pick = (c) => {
    const history = scenes.map((s, i) => (i === scenes.length - 1 ? { ...s, choice: c } : s));
    setScenes(history);
    setChoices([]);
    next(history, spark);
  };
  const retry = () => next(scenes, spark);
  const reset = () => { setStarted(false); setScenes([]); setChoices([]); setEnded(false); setError(""); };

  return (
    <main>
      <h1>Story Machine</h1>
      {!started ? (
        <section>
          <p className="sub">Give me a spark: a character, a place, a mood, a first line. We will walk the story together.</p>
          <textarea value={spark} maxLength={500} onChange={(e) => setSpark(e.target.value)} placeholder="A sleepy fox detective in a rainy city..." rows={4} />
          <div className="ideas">{IDEAS.map((i) => <button key={i} className="chip" onClick={() => setSpark(i)}>{i}</button>)}</div>
          <button className="primary" onClick={start} disabled={loading || !spark.trim()}>{loading ? "Weaving your story..." : "Begin the story"}</button>
        </section>
      ) : (
        <section>
          {scenes.map((s, i) => (
            <div key={i} className="scene">
              <p>{s.scene}</p>
              {s.choice && <p className="picked">→ {s.choice}</p>}
            </div>
          ))}
          {loading && <p className="loading">The story unfolds...</p>}
          {!loading && choices.map((c) => <button key={c} className="choice" onClick={() => pick(c)}>{c}</button>)}
          {!loading && ended && <><p className="theend">The End</p><button className="primary" onClick={reset}>Tell another story</button></>}
        </section>
      )}
      {error && <p className="error">{error} {!loading && <button className="chip" onClick={started ? retry : start}>Retry</button>}</p>}
      <div ref={end} />
    </main>
  );
}
