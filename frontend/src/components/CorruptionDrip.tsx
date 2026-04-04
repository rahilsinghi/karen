"use client";

export function CorruptionDrip() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-between overflow-hidden px-10">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="animate-corruption-drip rounded-b-[14px] bg-gradient-to-b from-fortress-pink/80 via-fortress-purple to-fortress-slime/80"
          style={{
            width: `${18 + ((index * 7) % 16)}px`,
            height: `${26 + ((index * 11) % 34)}px`,
            animationDelay: `${index * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}
