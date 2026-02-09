"use client";

import { ButtonHTMLAttributes } from "react";
import Link from "next/link";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  asLink?: string;
  variant?: "primary" | "ghost";
};

export default function Button({
  children,
  asLink,
  variant = "primary",
  className = "",
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-base font-semibold transition-all duration-200 w-full";
  const variants = {
    primary:
      "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-blue-900/40 hover:scale-[1.01]",
    ghost:
      "bg-white/5 text-slate-100 border border-white/10 hover:bg-white/10",
  };
  const styles = `${base} ${variants[variant]} ${className}`;

  if (asLink) {
    return (
      <Link href={asLink} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles} {...rest}>
      {children}
    </button>
  );
}
