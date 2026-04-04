"use client";

export function RuneDivider() {
  return (
    <div className="mt-3 flex items-center gap-2">
      <div className="h-2 flex-1 wire-run animate-wire-pulse" />
      <div className="h-3 w-3 border-2 border-border bg-fortress-pink" />
      <div className="h-2 flex-1 wire-run animate-wire-pulse" />
    </div>
  );
}
