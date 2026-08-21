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

        <section className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <article className="rounded-[2rem] bg-white p-8 shadow-[0_24px_80px_rgba(23,32,51,0.10)] sm:p-12">
            <div className="mb-10 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">
              <span>Issue topic</span>
              {topic && <span>#{String(topic.id).padStart(3, "0")}</span>}
            </div>
            {topic ? <blockquote className="font-display text-2xl leading-[1.5] sm:text-3xl">{topic.topic}</blockquote> : <div className="space-y-4" aria-label="Loading topic"><div className="h-5 w-full animate-pulse rounded bg-ink/10" /><div className="h-5 w-5/6 animate-pulse rounded bg-ink/10" /></div>}
            <label className="sr-only" htmlFor="full-length-essay">Your essay</label>
            <textarea className="mt-10 min-h-[30rem] w-full resize-y rounded-2xl border border-ink/10 bg-paper p-6 text-base leading-8 text-ink outline-none ring-coral/30 placeholder:text-ink/35 focus:ring-2" id="full-length-essay" placeholder="Begin your essay here…" value={essay} onChange={(event) => setEssay(event.target.value)} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/50">
              <span><strong className="font-semibold text-ink">{wordCount}</strong> {wordCount === 1 ? "word" : "words"}</span>
              <span>Suggested length: 500–700 words</span>
            </div>
          </article>

          <aside className="h-fit rounded-[2rem] bg-ink p-7 text-white lg:sticky lg:top-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Writing timer</p>
            <p className="mt-6 font-display text-6xl tracking-tight" aria-live="polite">{formatTime(seconds)}</p>
            <p className="mt-3 text-sm leading-6 text-white/55">Start when you are ready. The timer runs only while this page is open.</p>
            <div className="mt-7 flex gap-2">
              <button className="flex-1 rounded-full bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-ink" onClick={() => setTimerRunning((running) => !running)} type="button">{timerRunning ? "Pause" : "Start"}</button>
              <button className="rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white/75 transition hover:border-white hover:text-white" onClick={() => { setTimerRunning(false); setSeconds(0); }} type="button">Reset</button>
            </div>
          </aside>
        </section>

        <footer className="mt-16 flex items-center justify-between border-t border-ink/10 pt-5 text-xs text-ink/45"><span>Practice with intention.</span><span>02 / full-length essay</span></footer>
      </div>
    </main>
  );
}
