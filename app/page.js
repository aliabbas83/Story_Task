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
    speech: "en-US",
  },
  ar: {
    title: "كويتي من المستقبل",
    sub: "قصة تفاعلية مستوحاة من محمد الشارخ، الذي ساهم في تعليم الحاسوب اللغة العربية. أضف لمسة من عندك، أو ابدأ مباشرة.",
    placeholder: "أضف لمسة خاصة (اختياري)...",
    ideas: ["تبدأ القصة في ورشة صغيرة في الكويت ليلاً", "يصل زائر غامض يحمل لوحة مفاتيح متوهجة", "تظهر الحروف العربية الأولى على الشاشة"],
    begin: "ابدأ القصة", weaving: "نحيك قصتك...", unfolds: "القصة تتكشف...",
    end: "النهاية", again: "احكِ قصة أخرى", retry: "إعادة المحاولة",
    read: "اقرأها لي", pause: "إيقاف مؤقت", resume: "استئناف", stop: "إيقاف", noVoice: "متصفحك لا يملك صوتاً لهذه اللغة.",
    speech: "ar-SA",
  },
};

function pictureUrl(prompt, seed) {
  const p = encodeURIComponent(prompt + ", digital painting, warm cinematic light");
  return `https://image.pollinations.ai/prompt/${p}?width=768&height=432&nologo=true&seed=${seed}`;
}

export default function Home() {
  const [lang, setLang] = useState("en");
  const [spark, setSpark] = useState("");
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
      <h1>{t.title}</h1>
      {!started ? (
        <section>
          <p className="sub">{t.sub}</p>
          <textarea value={spark} maxLength={500} onChange={(e) => setSpark(e.target.value)} placeholder={t.placeholder} rows={4} />
          <div className="ideas">{t.ideas.map((i) => <button key={i} className="chip" onClick={() => setSpark(i)}>{i}</button>)}</div>
          <button className="primary" onClick={start} disabled={loading}>{loading ? t.weaving : t.begin}</button>
        </section>
      ) : (
        <section>
          {scenes.map((s, i) => (
            <div key={i} className="scene">
              {s.image && !badImages[i] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="pic" src={pictureUrl(s.image, i + 7)} alt="" loading="lazy" onError={() => setBadImages((b) => ({ ...b, [i]: true }))} />
              )}
              <p>{s.scene}</p>
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
            </div>
          ))}
          {loading && <p className="loading">{t.unfolds}</p>}
          {!loading && choices.map((c) => <button key={c} className="choice" onClick={() => pick(c)}>{c}</button>)}
          {!loading && ended && <><p className="theend">{t.end}</p><button className="primary" onClick={reset}>{t.again}</button></>}
        </section>
      )}
      {error && <p className="error">{error} {!loading && <button className="chip" onClick={started ? retry : start}>{t.retry}</button>}</p>}
      <div ref={end} />
    </main>
  );
}
