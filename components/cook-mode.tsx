"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Ingredient, Stage } from "@/lib/recipe/schema";
import { cookDoneAction, cookStartAction } from "@/app/recipes/actions";
import { HEAT_LABEL, ingredientQuantity } from "@/lib/recipe/labels";
import { fa } from "@/lib/format";
import { RichText } from "./rich-text";
import { CheckIcon, ClockIcon, FlameIcon } from "./icons";
import { TipBox } from "./tip-box";

type Timer = { id: string; label: string; startedAt: number; endsAt: number; done: boolean };
const maxMinutes = (m: number | [number, number]) => (Array.isArray(m) ? m[1] : m);
const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${fa(Math.floor(s / 60))}:${String(s % 60).padStart(2, "0").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}`;
};

/** A short synthesized bell (no audio file): three decaying tones, repeated (3 times by default). */
function ringBell(ctx: AudioContext, times = 3) {
  const t0 = ctx.currentTime;
  for (let r = 0; r < times; r++) {
    for (const [f, g] of [[880, 0.25], [1320, 0.12], [1760, 0.06]] as const) {
      const o = ctx.createOscillator();
      const v = ctx.createGain();
      const t = t0 + r * 1.1;
      o.type = "sine";
      o.frequency.value = f;
      v.gain.setValueAtTime(0, t);
      v.gain.linearRampToValueAtTime(g, t + 0.01);
      v.gain.exponentialRampToValueAtTime(0.001, t + 1);
      o.connect(v).connect(ctx.destination);
      o.start(t);
      o.stop(t + 1.05);
    }
  }
}

/**
 * One stage at a time, big targets, screen stays awake, resumes where you left (per device).
 * RTL: "next" is to the LEFT (swipe left or ArrowLeft); "previous" is to the right.
 */
export function CookMode({
  slug,
  title,
  stages,
  ingredients,
}: {
  slug: string;
  title: string;
  stages: Stage[];
  ingredients: { group?: string; items: Ingredient[] }[];
  servings: number;
}) {
  const last = stages.length; // index === stages.length is the "done" screen
  const [step, setStep] = useState(0);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [showIngredients, setShowIngredients] = useState(false);
  const touchX = useRef<number | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const rung = useRef<Set<string>>(new Set());
  const [muted, setMuted] = useState(false);
  const key = `cook:${slug}`;

  // resume
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(key));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from localStorage after mount (keeps SSR markup identical)
      if (Number.isInteger(saved) && saved > 0 && saved <= last) setStep(saved);
    } catch {}
    void cookStartAction(slug);
  }, [key, last, slug]);
  useEffect(() => {
    try {
      localStorage.setItem(key, String(step === last ? 0 : step));
    } catch {}
  }, [key, step, last]);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from localStorage after mount
      setMuted(localStorage.getItem("cook:muted") === "1");
    } catch {}
  }, []);

  // browsers only allow sound after a user gesture, so the context is created/resumed on a click
  const unlockAudio = () => {
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume();
    } catch {}
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem("cook:muted", next ? "1" : "0");
    } catch {}
    if (!next) {
      unlockAudio(); // the click is the gesture; play a preview so the user hears what is on
      if (audio.current) ringBell(audio.current, 1);
    }
  };

  // ring once for each timer that has just finished (unless muted)
  useEffect(() => {
    for (const t of timers) {
      if (!t.done || rung.current.has(t.id)) continue;
      rung.current.add(t.id);
      if (!muted && audio.current) {
        try {
          ringBell(audio.current);
        } catch {}
      }
    }
  }, [timers, muted]);

  // keep the screen awake; re-acquire when the tab becomes visible again
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const acquire = async () => {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") lock = await navigator.wakeLock.request("screen");
      } catch {}
    };
    void acquire();
    const onVis = () => void acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release();
    };
  }, []);

  // timers tick once a second
  useEffect(() => {
    if (!timers.some((t) => !t.done)) return;
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      setTimers((ts) =>
        ts.map((t) => {
          if (!t.done && t.endsAt <= n) {
            try {
              navigator.vibrate?.([300, 150, 300]);
            } catch {}
            return { ...t, done: true };
          }
          return t;
        }),
      );
    }, 1000);
    return () => clearInterval(id);
  }, [timers]);

  const go = useCallback((d: number) => setStep((s) => Math.min(last, Math.max(0, s + d))), [last]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(1); // RTL: left = forward
      if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const stage = stages[step];
  const startTimer = (label: string, minutes: number) => {
    unlockAudio();
    setTimers((ts) => [...ts, { id: `${Date.now()}-${ts.length}`, label, startedAt: Date.now(), endsAt: Date.now() + minutes * 60_000, done: false }]);
  };

  return (
    <div
      className="recipe-scope mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl flex-col px-4 pb-28 pt-4"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1); // swipe left = next in RTL
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <Link href={`/recipes/${slug}`} className="text-sm font-bold text-brand-ink underline">← {title}</Link>
        <div className="flex items-center gap-2">
          <button type="button" className="chip" onClick={toggleMute} aria-pressed={!muted} aria-label={muted ? "روشن کردن صدای تایمر" : "بی‌صدا کردن تایمر"}>
            {muted ? "🔕 بی‌صدا" : "🔔 صدا روشن"}
          </button>
          <button type="button" className="chip" onClick={() => setShowIngredients((v) => !v)} aria-expanded={showIngredients}>
            مواد
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuemin={0} aria-valuemax={last} aria-valuenow={step}>
        <div className="h-full rounded-full" style={{ width: `${(step / last) * 100}%`, background: "var(--r-solid)", transition: "width .3s" }} />
      </div>
      <p className="mt-2 text-sm text-muted">{step < last ? `مرحلهٔ ${fa(step + 1)} از ${fa(last)}` : "تمام شد"}</p>

      {showIngredients && (
        <section className="card mt-3 max-h-64 overflow-auto p-4 text-sm" aria-label="مواد">
          {ingredients.flatMap((g) => g.items).map((it, i) => (
            <p key={i} className="flex justify-between gap-3 border-b border-line py-1.5 last:border-0">
              <span>{it.name}</span>
              <strong>{ingredientQuantity(it)}</strong>
            </p>
          ))}
        </section>
      )}

      {stage ? (
        <section className="mt-4 flex-1" aria-live="polite">
          <h1 className="text-3xl font-extrabold leading-snug">{stage.title}</h1>
          <ol className="stage-list mt-4 text-xl leading-10">
            {stage.actions.map((a, i) => (
              <li key={i}>
                <RichText text={a.text} />
                {a.sub && (
                  <ul className="sub-list text-lg">
                    {a.sub.map((s, j) => (
                      <li key={j} className="rounded-xl border px-3 py-2" style={{ borderColor: "var(--r-line)", background: "var(--r-soft)" }}>
                        {s.label && <strong>{s.label}: </strong>}
                        <RichText text={s.text} />
                        {s.minutes && (
                          <button type="button" className="timer-btn ms-2" onClick={() => startTimer(s.label ?? stage.title, s.minutes![1])}>
                            <ClockIcon width={15} height={15} /> شروع تایمر {fa(s.minutes[1])} دقیقه
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {a.heat && (
                    <span className="chip text-base">
                      <FlameIcon width={16} height={16} /> {HEAT_LABEL[a.heat]}
                    </span>
                  )}
                  {a.minutes !== undefined && (
                    <button type="button" className="timer-btn" onClick={() => startTimer(stage.title, maxMinutes(a.minutes!))}>
                      <ClockIcon width={16} height={16} /> شروع تایمر {fa(maxMinutes(a.minutes))} دقیقه
                    </button>
                  )}
                </div>
                {a.cue && (
                  <p className="mt-2 flex items-start gap-2 rounded-2xl px-3 py-2 text-xl font-extrabold" style={{ background: "var(--r-soft)", color: "var(--r-accent)" }}>
                    <CheckIcon width={22} height={22} className="mt-2 shrink-0" /> {a.cue}
                  </p>
                )}
              </li>
            ))}
          </ol>
          {stage.tip && <TipBox tip={stage.tip} />}
          {stage.note && <p className="prose-note mt-2">{stage.note}</p>}
        </section>
      ) : (
        <section className="mt-6 grid flex-1 content-center justify-items-center gap-4 text-center">
          <h1 className="text-3xl font-extrabold">نوش جان!</h1>
          <p className="text-muted">امیدوارم بار اول درست درآمده باشد.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              void cookDoneAction(slug);
              setStep(0);
            }}
          >
            پختم؛ ثبت کن
          </button>
          <Link href={`/recipes/${slug}`} className="btn btn-ghost">بازگشت به دستور</Link>
        </section>
      )}

      {timers.length > 0 && (
        <ul className="fixed inset-x-3 bottom-[5.5rem] z-30 mx-auto grid max-w-2xl gap-2" aria-label="تایمرها">
          {timers.map((t) => (
            <li
              key={t.id}
              role={t.done ? "alert" : undefined}
              className={`relative isolate flex items-center justify-between gap-3 overflow-hidden rounded-2xl px-4 py-3 font-bold ${t.done ? "bg-lime text-[#1f4a0c]" : "bg-ink text-white"}`}
            >
              {!t.done && (
                <span
                  aria-hidden
                  className="timer-fill absolute inset-y-0 start-0 -z-10"
                  style={{ width: `${Math.min(100, Math.max(0, ((now - t.startedAt) / (t.endsAt - t.startedAt)) * 100))}%` }}
                />
              )}
              <span>{t.label}</span>
              <span className="tabular-nums">{t.done ? "تمام شد!" : mmss(t.endsAt - now)}</span>
              <button type="button" className="chip !min-h-9" onClick={() => setTimers((ts) => ts.filter((x) => x.id !== t.id))}>
                بستن
              </button>
            </li>
          ))}
        </ul>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" aria-label="مراحل">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button type="button" className="btn btn-ghost !min-h-14 flex-1 text-lg" onClick={() => go(-1)} disabled={step === 0}>
            قبلی
          </button>
          <button type="button" className="btn btn-primary !min-h-14 flex-[2] text-lg" onClick={() => go(1)} disabled={step === last}>
            {step === last - 1 ? "پایان" : "بعدی"}
          </button>
        </div>
      </nav>
    </div>
  );
}
