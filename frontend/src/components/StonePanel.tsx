"use client";

import type { ReactNode } from "react";

export function StonePanel({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`fortress-panel flex flex-col ${className}`}>
      {(title || eyebrow) && (
        <div className="border-b-4 border-border px-4 py-3 shrink-0">
          {eyebrow ? <div className="pixel-text text-[0.52rem] text-muted">{eyebrow}</div> : null}
          {title ? <div className="pixel-text mt-1 text-[0.9rem] text-text">{title}</div> : null}
        </div>
      )}
      <div className="p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">{children}</div>
    </section>
  );
}
