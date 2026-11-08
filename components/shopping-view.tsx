"use client";

import { useEffect, useState } from "react";
import type { ShoppingLine } from "@/lib/recipe/shopping";

const KEY = "shopping:checked";

/** Checkable merged list, plus share (Web Share API, falling back to copy). */
export function ShoppingView({ lines, text }: { lines: ShoppingLine[]; text: string }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from localStorage after mount
      if (raw) setChecked(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);

  const toggle = (name: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (!next.delete(name)) next.add(name);
      try {
        localStorage.setItem(KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setMsg("لیست کپی شد؛ در تلگرام یا واتس‌اپ جایگذاری کن.");
    } catch {
      setMsg("ارسال انجام نشد.");
    }
  };

  return (
    <div className="grid gap-4">
      <ul className="card divide-y divide-line overflow-hidden">
        {lines.map((l) => {
          const done = checked.has(l.name);
          return (
            <li key={l.name}>
              <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2">
                <input type="checkbox" checked={done} onChange={() => toggle(l.name)} className="size-5 shrink-0 accent-[var(--brand)]" />
                <span className={`flex-1 ${done ? "text-muted line-through" : ""}`}>
                  {l.name}
                  {l.recipes.length > 1 && <span className="block text-xs text-muted">برای {l.recipes.length} دستور</span>}
                </span>
                <strong className={done ? "text-muted" : ""}>{l.quantity}</strong>
              </label>
            </li>
          );
        })}
      </ul>
      <button type="button" className="btn btn-primary" onClick={share}>ارسال یا کپی لیست</button>
      <p className="text-sm text-muted" role="status">{msg}</p>
    </div>
  );
}
