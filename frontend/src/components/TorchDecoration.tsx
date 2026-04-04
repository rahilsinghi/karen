"use client";

export function TorchDecoration() {
  return (
    <div className="relative h-20 w-8">
      <div className="animate-torch-flame torch-flame absolute left-1/2 top-0 h-8 w-5 -translate-x-1/2 blur-[0.2px]" />
      <div className="absolute left-1/2 top-6 h-12 w-2 -translate-x-1/2 bg-[#6f4b2d]" />
      <div className="absolute left-1/2 top-8 h-3 w-6 -translate-x-1/2 border-2 border-border bg-[#2f2a34]" />
    </div>
  );
}
