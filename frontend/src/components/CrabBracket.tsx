"use client";

export function CrabBracket() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute left-4 top-1/2 h-8 w-10 -translate-y-1/2 border-y-4 border-l-4 border-fortress-pink" />
      <div className="absolute right-4 top-1/2 h-8 w-10 -translate-y-1/2 border-y-4 border-r-4 border-fortress-pink" />
    </div>
  );
}
