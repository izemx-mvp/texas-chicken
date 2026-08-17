import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { restaurants } from "@/lib/tc/data";

/**
 * DIGITAL TERRITORY — fond propriétaire Texas Chicken.
 *
 * Concept : le réseau marocain vu comme un territoire numérique vivant.
 * Contour abstrait du Maroc + nœuds (villes réelles du réseau) + flux de données
 * animés entre les villes + particules lentes + halo de contrôle.
 * Aucune image, uniquement SVG/CSS : léger, net à toute résolution.
 */

const VB_W = 1000;
const VB_H = 1200;
const LNG_MIN = -17.6;
const LNG_MAX = -0.6;
const LAT_MIN = 20.4;
const LAT_MAX = 36.4;

const px = (lng: number) => ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * VB_W;
const py = (lat: number) => ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VB_H;

/** Contour abstrait (stylisé) du territoire marocain. */
const OUTLINE: [number, number][] = [
  [-5.9, 35.9],
  [-5.2, 35.85],
  [-4.3, 35.2],
  [-2.9, 35.3],
  [-2.0, 34.75],
  [-1.7, 33.6],
  [-1.1, 32.1],
  [-2.6, 31.6],
  [-3.7, 30.9],
  [-4.9, 30.5],
  [-6.1, 29.6],
  [-7.6, 29.3],
  [-8.7, 28.7],
  [-8.7, 27.7],
  [-8.7, 25.9],
  [-12.0, 25.9],
  [-12.0, 23.5],
  [-13.1, 22.8],
  [-13.1, 21.4],
  [-17.0, 21.0],
  [-16.0, 22.2],
  [-14.6, 26.1],
  [-13.2, 27.7],
  [-11.4, 28.5],
  [-9.9, 29.9],
  [-9.7, 31.5],
  [-8.7, 33.2],
  [-7.0, 34.0],
  [-6.3, 35.0],
];

const outlinePath =
  OUTLINE.map(([lng, lat], i) => `${i === 0 ? "M" : "L"}${px(lng).toFixed(1)} ${py(lat).toFixed(1)}`).join(" ") + " Z";

export function AnimatedBackground({
  intensity = "full",
  className,
}: {
  intensity?: "full" | "soft";
  className?: string;
}) {
  const soft = intensity === "soft";

  /** Nœuds = villes réelles du réseau (une par ville, taille = nb de restaurants). */
  const nodes = useMemo(() => {
    const byCity = new Map<string, { city: string; lat: number; lng: number; count: number }>();
    for (const r of restaurants) {
      const cur = byCity.get(r.city);
      if (cur) cur.count += 1;
      else byCity.set(r.city, { city: r.city, lat: r.lat, lng: r.lng, count: 1 });
    }
    return [...byCity.values()].map((c, i) => ({
      ...c,
      x: px(c.lng),
      y: py(c.lat),
      delay: (i % 7) * 0.7,
    }));
  }, []);

  /** Flux de données : chaque ville reliée à son voisin le plus proche + au hub. */
  const links = useMemo(() => {
    if (nodes.length < 2) return [];
    const hub = nodes.reduce((a, b) => (a.count >= b.count ? a : b));
    const out: { d: string; delay: number; dur: number }[] = [];
    nodes.forEach((n, i) => {
      if (n === hub) return;
      const nearest = nodes
        .filter((o) => o !== n)
        .sort((a, b) => (a.x - n.x) ** 2 + (a.y - n.y) ** 2 - ((b.x - n.x) ** 2 + (b.y - n.y) ** 2))[0];
      const targets = [hub, nearest].filter(Boolean) as typeof nodes;
      targets.forEach((t, k) => {
        const mx = (n.x + t.x) / 2 + (((i * 37) % 60) - 30);
        const my = (n.y + t.y) / 2 + (((i * 53) % 60) - 30);
        out.push({
          d: `M${n.x.toFixed(1)} ${n.y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${t.x.toFixed(1)} ${t.y.toFixed(1)}`,
          delay: ((i * 2 + k) % 9) * 0.8,
          dur: 5 + ((i + k) % 5),
        });
      });
    });
    return out;
  }, [nodes]);

  const particles = useMemo(
    () =>
      Array.from({ length: soft ? 14 : 26 }, (_, i) => ({
        left: (i * 41) % 100,
        delay: (i % 13) * 0.9,
        dur: 14 + (i % 9) * 2,
        size: 1.5 + (i % 3),
        gold: i % 3 === 0,
      })),
    [soft],
  );

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background", className)}
    >
      {/* profondeur : halos de contrôle */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 65% at 50% 110%, oklch(0.62 0.23 28 / 22%) 0%, transparent 62%)," +
            "radial-gradient(70% 50% at 14% -8%, oklch(0.86 0.17 82 / 14%) 0%, transparent 62%)," +
            "radial-gradient(65% 45% at 90% 6%, oklch(0.52 0.13 250 / 14%) 0%, transparent 66%)",
        }}
      />

      {/* grille de contrôle */}
      <div className="grid-lines absolute inset-0 opacity-40 [mask-image:radial-gradient(75%_65%_at_50%_45%,black,transparent)]" />

      {/* territoire numérique */}
      <div
        className={cn(
          "animate-territory absolute inset-0 grid place-items-center [mask-image:radial-gradient(95%_85%_at_50%_45%,black,transparent)]",
          soft ? "opacity-[0.55]" : "opacity-90",
        )}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-[125%] w-[125%] max-w-none text-[oklch(0.52_0.2_30)] dark:text-[oklch(0.88_0.17_82)]"
        >
          <defs>
            <linearGradient id="tc-territory-fill" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.07" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.13" />
            </linearGradient>
            <linearGradient id="tc-territory-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          <path d={outlinePath} fill="url(#tc-territory-fill)" />
          {/* contour permanent (visible même sans animation) */}
          <path
            d={outlinePath}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.3}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <path
            d={outlinePath}
            fill="none"
            stroke="url(#tc-territory-stroke)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            className="animate-territory-trace"
          />

          {/* flux de données entre villes */}
          {links.map((l, i) => (
            <path
              key={i}
              d={l.d}
              fill="none"
              stroke="currentColor"
              strokeOpacity={soft ? 0.22 : 0.34}
              strokeWidth={1.2}
              strokeDasharray="6 22"
              className="animate-data-flow"
              style={{ animationDelay: `${l.delay}s`, animationDuration: `${l.dur}s` }}
            />
          ))}

          {/* nœuds = villes du réseau */}
          {nodes.map((n) => (
            <g key={n.city} style={{ animationDelay: `${n.delay}s` }} className="animate-node-pulse">
              <circle cx={n.x} cy={n.y} r={6 + n.count * 2.2} fill="currentColor"
                fillOpacity={0.12} />
              <circle cx={n.x} cy={n.y} r={3 + n.count * 0.6} fill="currentColor" fillOpacity={0.8} />
            </g>
          ))}
        </svg>
      </div>

      {/* particules de données */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="animate-ember absolute bottom-0 rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            background: p.gold ? "oklch(0.88 0.17 82)" : "oklch(0.66 0.22 30)",
            boxShadow: p.gold ? "0 0 10px oklch(0.88 0.17 82 / 70%)" : "0 0 10px oklch(0.66 0.22 30 / 70%)",
          }}
        />
      ))}

      {intensity === "full" && (
        <>
          <div className="animate-float absolute left-[8%] top-[18%] h-72 w-72 rounded-full bg-[oklch(0.62_0.23_28_/_16%)] blur-[90px]" />
          <div
            className="animate-float absolute right-[10%] top-[8%] h-80 w-80 rounded-full bg-[oklch(0.86_0.17_82_/_12%)] blur-[110px]"
            style={{ animationDelay: "3s" }}
          />
          <div
            className="animate-float absolute bottom-[6%] left-[42%] h-64 w-64 rounded-full bg-[oklch(0.55_0.15_250_/_12%)] blur-[100px]"
            style={{ animationDelay: "6s" }}
          />
        </>
      )}

      {/* balayage radar horizontal très lent */}
      <div className="animate-sweep absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(90deg,transparent,oklch(0.86_0.17_82_/_7%),transparent)]" />

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(100%_100%_at_50%_50%,transparent_55%,oklch(0.1_0.01_40_/_16%)_100%)] dark:bg-[radial-gradient(100%_100%_at_50%_50%,transparent_35%,oklch(0.1_0.01_40_/_78%)_100%)]" />
    </div>
  );
}
