import { useState, useEffect } from "react";

interface SafetyBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export function SafetyBadge({ score, size = "md", animate = true }: SafetyBadgeProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) {
      setDisplayed(score);
      return;
    }
    setDisplayed(0);
    if (score <= 0) return;
    const duration = 800;
    const steps = Math.min(score, 40);
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += Math.ceil(score / steps);
      if (current >= score) {
        setDisplayed(score);
        clearInterval(timer);
      } else {
        setDisplayed(current);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [score, animate]);

  const color =
    score >= 70
      ? "text-primary border-primary bg-primary/10"
      : score >= 40
      ? "text-yellow-400 border-yellow-400 bg-yellow-400/10"
      : "text-destructive border-destructive bg-destructive/10";

  const glowColor =
    score >= 70
      ? "shadow-[0_0_8px_rgba(204,255,0,0.3)]"
      : score >= 40
      ? "shadow-[0_0_8px_rgba(250,204,21,0.25)]"
      : "shadow-[0_0_8px_rgba(239,68,68,0.25)]";

  const label = score >= 70 ? "SAFE" : score >= 40 ? "CAUTION" : "RISKY";

  const sizeClass =
    size === "lg"
      ? "text-2xl px-4 py-2 min-w-[80px]"
      : size === "sm"
      ? "text-xs px-2 py-0.5 min-w-[48px]"
      : "text-sm px-3 py-1 min-w-[60px]";

  return (
    <div
      className={`flex flex-col items-center border font-mono transition-shadow duration-300 ${color} ${sizeClass} ${glowColor}`}
      data-testid="safety-badge"
    >
      <span className="font-bold leading-none tabular-nums">{displayed}</span>
      <span className="text-[10px] leading-none mt-0.5 opacity-80">{label}</span>
    </div>
  );
}

export function safetyColor(score: number) {
  if (score >= 70) return "text-primary";
  if (score >= 40) return "text-yellow-400";
  return "text-destructive";
}

export function safetyBg(score: number) {
  if (score >= 70) return "bg-primary/10 border-primary";
  if (score >= 40) return "bg-yellow-400/10 border-yellow-400";
  return "bg-destructive/10 border-destructive";
}
