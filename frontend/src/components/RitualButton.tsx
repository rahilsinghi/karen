"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function RitualButton({
  label,
  subtitle,
  variant = "stone",
  className = "",
  disabled,
  onClick,
  children,
}: {
  label: string;
  subtitle?: string;
  variant?: "primary" | "danger" | "arcane" | "stone";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const styles = {
    primary:
      "bg-[#b53028] shadow-[inset_6px_6px_0_rgba(255,255,255,0.14),inset_-6px_-6px_0_rgba(78,12,12,0.7),0_12px_0_#531010]",
    danger:
      "bg-[#563019] shadow-[inset_6px_6px_0_rgba(255,255,255,0.12),inset_-6px_-6px_0_rgba(38,17,7,0.85),0_12px_0_#271209]",
    arcane:
      "bg-[#5f2a82] shadow-[inset_6px_6px_0_rgba(255,255,255,0.14),inset_-6px_-6px_0_rgba(42,13,65,0.85),0_12px_0_#291039]",
    stone:
      "bg-[#413a46] shadow-[inset_6px_6px_0_rgba(255,255,255,0.1),inset_-6px_-6px_0_rgba(0,0,0,0.45),0_10px_0_#1f1822]",
  }[variant];

  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { y: 8 }}
      disabled={disabled}
      onClick={onClick}
      className={`group relative border-4 border-border px-4 py-4 text-left ${styles} ${className} ${
        disabled ? "cursor-not-allowed opacity-45" : ""
      }`}
    >
      <div className="pixel-text text-[0.98rem] leading-tight text-text [text-shadow:2px_2px_0_rgba(0,0,0,0.55)]">{label}</div>
      {subtitle ? <div className="mt-1 font-mono text-[0.95rem] uppercase tracking-[0.08em] text-[#f2c6bc]">{subtitle}</div> : null}
      {children}
    </motion.button>
  );
}
