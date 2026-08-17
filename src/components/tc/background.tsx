import { useMemo } from "react";
import { cn } from "@/lib/utils";
import texasLogo from "@/assets/texas-chicken-logo.svg";


/**
 * Proprietary Texas Chicken animated backdrop:
 * canyon horizon glow + drifting heat haze + ember particles + control grid.
 */
export function AnimatedBackground({
  intensity = "full",
  className,
}: {
  intensity?: "full" | "soft";
  className?: string;
}) {
  const embers = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: (i % 11) * 0.55,
        dur: 5 + (i % 7),
        size: 2 + (i % 4),
        gold: i % 3 === 0,
      })),
    [],
  );

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background",
        className,
      )}
    >
      {/* deep horizon */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 108%, oklch(0.62 0.23 28 / 34%) 0%, transparent 62%)," +
            "radial-gradient(80% 55% at 12% -10%, oklch(0.86 0.17 82 / 16%) 0%, transparent 60%)," +
            "radial-gradient(70% 50% at 92% 8%, oklch(0.52 0.13 250 / 18%) 0%, transparent 65%)",
        }}
      />
      {/* control grid */}
      <div className="grid-lines absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]" />

      {/* drifting mesa silhouettes */}
      <div className="animate-drift absolute -bottom-24 left-0 right-0 h-[46vh] opacity-60">
        <svg viewBox="0 0 1440 400" preserveAspectRatio="none" className="h-full w-full">
          <path
            d="M0 320 L120 300 L180 240 L300 240 L340 300 L520 280 L600 200 L760 200 L810 290 L980 260 L1060 210 L1200 210 L1260 300 L1440 280 L1440 400 L0 400 Z"
            fill="oklch(0.2 0.03 40)"
          />
          <path
            d="M0 360 L200 340 L280 300 L420 300 L500 350 L700 330 L820 290 L980 300 L1120 340 L1300 330 L1440 350 L1440 400 L0 400 Z"
            fill="oklch(0.17 0.022 38)"
          />
        </svg>
      </div>

      {intensity === "full" && (
        <>
          {/* orbiting glow blobs */}
          <div className="animate-float absolute left-[8%] top-[18%] h-72 w-72 rounded-full bg-[oklch(0.62_0.23_28_/_22%)] blur-[90px]" />
          <div
            className="animate-float absolute right-[10%] top-[8%] h-80 w-80 rounded-full bg-[oklch(0.86_0.17_82_/_16%)] blur-[110px]"
            style={{ animationDelay: "3s" }}
          />
          <div
            className="animate-float absolute bottom-[6%] left-[42%] h-64 w-64 rounded-full bg-[oklch(0.55_0.15_250_/_16%)] blur-[100px]"
            style={{ animationDelay: "6s" }}
          />

          {/* embers */}
          {embers.map((e, i) => (
            <span
              key={i}
              className="animate-ember absolute bottom-0 rounded-full"
              style={{
                left: `${e.left}%`,
                width: e.size,
                height: e.size,
                animationDelay: `${e.delay}s`,
                animationDuration: `${e.dur}s`,
                background: e.gold
                  ? "oklch(0.88 0.17 82)"
                  : "oklch(0.66 0.22 30)",
                boxShadow: e.gold
                  ? "0 0 12px oklch(0.88 0.17 82 / 80%)"
                  : "0 0 12px oklch(0.66 0.22 30 / 80%)",
              }}
            />
          ))}
        </>
      )}

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(100%_100%_at_50%_50%,transparent_35%,oklch(0.1_0.01_40_/_75%)_100%)]" />
    </div>
  );
}
