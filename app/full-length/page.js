"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || `The backend returned ${response.status}.`);
  return body;
}

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      onLogin(user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-ink">
      <form className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-[0_24px_80px_rgba(23,32,51,0.10)] sm:p-12" onSubmit={submit}>
        <p className="font-display text-xl font-semibold tracking-tight">essay<span className="text-coral">.</span>learner</p>
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.24em] text-coral">Private practice</p>
        <h1 className="mt-4 font-display text-4xl leading-tight">Welcome back.</h1>
        <p className="mt-4 text-sm leading-6 text-ink/60">Sign in to continue your writing practice.</p>
        {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</p>}
        <label className="mt-8 block text-sm font-semibold" htmlFor="username">Username</label>
        <input className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 outline-none focus:border-coral" id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
        <label className="mt-5 block text-sm font-semibold" htmlFor="password">Password</label>
        <input className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 outline-none focus:border-coral" id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        <button className="mt-7 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-coral disabled:cursor-wait disabled:opacity-60" disabled={loading} type="submit">{loading ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export default function FullLengthPage() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [topic, setTopic] = useState(null);
  const [essay, setEssay] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    request("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    request("/topic/today")
      .then(setTopic)
      .catch((requestError) => setError(`${requestError.message} Make sure the FastAPI server is running at ${API_URL}.`));
  }, [user]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const interval = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const wordCount = useMemo(() => {
    const words = essay.trim().match(/\S+/g);
    return words ? words.length : 0;
  }, [essay]);

  async function logout() {
    await request("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }

  async function evaluateEssay(event) {
    event.preventDefault();
    setEvaluationLoading(true);
    setError("");
    try {
      const result = await request("/evaluate/essay", {
        method: "POST",
        body: JSON.stringify({ topic_id: topic.id, essay }),
      });
      setEvaluation(result.evaluation);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setEvaluationLoading(false);
    }
  }

  if (!authChecked) return <main className="flex min-h-screen items-center justify-center bg-paper text-sm text-ink/50">Checking your session…</main>;
  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-6 py-7 sm:px-10 lg:px-16">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-6">
          <a className="font-display text-xl font-semibold tracking-tight" href="/">essay<span className="text-coral">.</span>learner</a>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex items-center gap-1 rounded-full bg-ink/5 p-1" aria-label="Practice sections">
              <a className="rounded-full px-4 py-2 text-xs font-semibold text-ink/55 transition hover:bg-white hover:text-ink" href="/">Daily practice</a>
              <a className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink shadow-sm" href="/full-length" aria-current="page">Full-length essay</a>
            </nav>
            <span className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-ink/60">GRE AWA</span>
            <button className="text-xs font-semibold text-ink/50 transition hover:text-coral" onClick={logout} type="button">Log out</button>
          </div>
        </header>

        <section className="py-16">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-coral">Full-length practice</p>
          <h1 className="max-w-3xl font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">Make the complete argument.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/65">Set your own pace, develop the topic below, and use the word count to keep your essay focused.</p>
        </section>

        {error && <p className="mb-8 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</p>}

        <div className="mb-6 flex justify-end">
          <aside className="w-full rounded-[1.5rem] bg-ink px-6 py-5 text-white sm:w-auto sm:min-w-[360px]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Writing timer</p>
                <p className={`mt-2 font-display text-4xl tracking-tight ${seconds >= 30 * 60 ? "text-coral" : "text-white"}`} aria-live="polite">{formatTime(seconds)}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-full bg-coral px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-ink" onClick={() => setTimerRunning((running) => !running)} type="button">{timerRunning ? "Pause" : "Start"}</button>
                <button className="rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:border-white hover:text-white" onClick={() => { setTimerRunning(false); setSeconds(0); }} type="button">Reset</button>
              </div>
            </div>
          </aside>
        </div>

        <section>
          <form className="rounded-[2rem] bg-white p-8 shadow-[0_24px_80px_rgba(23,32,51,0.10)] sm:p-12" onSubmit={evaluateEssay}>
            <div className="mb-10 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">
              <span>Issue topic</span>
              {topic && <span>#{String(topic.id).padStart(3, "0")}</span>}
            </div>
            {topic ? <blockquote className="font-display text-2xl leading-[1.5] sm:text-3xl">{topic.topic}</blockquote> : <div className="space-y-4" aria-label="Loading topic"><div className="h-5 w-full animate-pulse rounded bg-ink/10" /><div className="h-5 w-5/6 animate-pulse rounded bg-ink/10" /></div>}
            <label className="sr-only" htmlFor="full-length-essay">Your essay</label>
            <textarea className="mt-10 min-h-[30rem] w-full resize-y rounded-2xl border border-ink/10 bg-paper p-6 text-base leading-8 text-ink outline-none ring-coral/30 placeholder:text-ink/35 focus:ring-2" id="full-length-essay" placeholder="Begin your essay here…" value={essay} onChange={(event) => setEssay(event.target.value)} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/50">
              <span><strong className="font-semibold text-ink">{wordCount}</strong> {wordCount === 1 ? "word" : "words"}</span>
              <span>Suggested length: 450–600 words</span>
            </div>
            <button className="mt-7 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50" disabled={evaluationLoading || !topic || !essay.trim()} type="submit">
              {evaluationLoading ? "Evaluating essay…" : evaluation ? "Evaluate again" : "Evaluate essay"}
            </button>
          </form>

        </section>

        {evaluation && (
          <section className="mt-8 rounded-[2rem] border border-ink/10 bg-[#eee9df] p-8 sm:p-10">
            <div className="flex flex-col gap-3 border-b border-ink/15 pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Essay evaluation</p>
                <h2 className="mt-4 font-display text-3xl leading-tight">A complete read of your argument.</h2>
              </div>
              <p className="font-display text-5xl text-coral">{evaluation.score}<span className="text-lg text-ink/40"> / 6</span></p>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div>
                <p className="font-semibold">What&apos;s working</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink/70">
                  {evaluation.strengths.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-semibold">Next to improve</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink/70">
                  {evaluation.weaknesses.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                </ul>
              </div>
            </div>

            <div className="mt-8 border-t border-ink/15 pt-7">
              <p className="font-semibold">Suggested rewrite</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink/70">{evaluation.suggested_rewrite}</p>
            </div>

            {evaluation.better_vocabulary?.length > 0 && (
              <div className="mt-8 border-t border-ink/15 pt-7">
                <p className="font-semibold">Vocabulary improvements</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {evaluation.better_vocabulary.map((item, index) => {
                    const synonyms = Array.isArray(item.synonyms) ? item.synonyms : item.synonyms ? [item.synonyms] : [];
                    return (
                      <div className="rounded-2xl border border-ink/5 bg-white/60 p-5" key={`${item.word}-${index}`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">Consider replacing</p>
                        <p className="mt-2 font-display text-xl text-coral">{item.word}</p>
                        {synonyms.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{synonyms.map((synonym, synonymIndex) => <span className="rounded-lg bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/70" key={`${synonym}-${synonymIndex}`}>{synonym}</span>)}</div>}
                        {item.context && <p className="mt-3 text-xs italic leading-5 text-ink/50">{item.context}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        <footer className="mt-16 flex items-center justify-between border-t border-ink/10 pt-5 text-xs text-ink/45"><span>Practice with intention.</span><span>02 / full-length essay</span></footer>
      </div>
    </main>
  );
}
