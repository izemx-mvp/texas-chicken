import { useMemo, useState } from "react";
import { Building2, Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import texasLogo from "@/assets/texas-chicken-logo.svg";
import type { Restaurant } from "@/lib/tc/types";

/* Projection simple lat/lng -> viewBox 0..100 sur l'emprise du Maroc */
const BOUNDS = { west: -13.2, east: -0.9, south: 27.6, north: 36.2 };
export function project(lat: number, lng: number) {
  const x = ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 100;
  const y = ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * 100;
  return { x, y };
}

/* Contour simplifié du Maroc (coordonnées géographiques) */
const OUTLINE: [number, number][] = [
  [35.92, -5.35],
  [35.75, -5.92],
  [35.19, -6.15],
  [34.28, -6.62],
  [33.55, -7.66],
  [32.9, -8.7],
  [32.3, -9.28],
  [31.5, -9.77],
  [30.42, -9.68],
  [29.6, -10.0],
  [28.75, -11.05],
  [27.9, -12.3],
  [27.66, -13.0],
  [27.66, -8.67],
  [27.66, -8.67],
  [28.0, -8.67],
  [29.0, -8.0],
  [29.6, -7.4],
  [30.6, -6.0],
  [31.7, -3.8],
  [32.1, -2.2],
  [32.6, -1.7],
  [33.7, -1.6],
  [34.75, -1.79],
  [35.1, -2.42],
  [35.28, -3.6],
  [35.55, -4.6],
  [35.92, -5.35],
];

export function MoroccoMap({
  restaurants,
  onSelect,
  selectedCity,
  onCityChange,
}: {
  restaurants: Restaurant[];
  onSelect: (r: Restaurant) => void;
  selectedCity: string | null;
  onCityChange: (city: string | null) => void;
}) {
  const [hover, setHover] = useState<Restaurant | null>(null);
  const [zoom, setZoom] = useState(1);

  const cities = useMemo(() => {
    const map = new Map<string, { city: string; lat: number; lng: number; list: Restaurant[] }>();
    for (const r of restaurants) {
      const e = map.get(r.city) ?? { city: r.city, lat: 0, lng: 0, list: [] };
      e.list.push(r);
      map.set(r.city, e);
    }
    for (const e of map.values()) {
      e.lat = e.list.reduce((a, r) => a + r.lat, 0) / e.list.length;
      e.lng = e.list.reduce((a, r) => a + r.lng, 0) / e.list.length;
    }
    return [...map.values()];
  }, [restaurants]);

  const focus = selectedCity ? cities.find((c) => c.city === selectedCity) : null;
  const scale = focus ? 4.2 * zoom : zoom;
  const center = focus ? project(focus.lat, focus.lng) : { x: 50, y: 50 };
  const viewW = 100 / scale;
  const viewH = 100 / scale;
  const viewX = Math.max(0, Math.min(100 - viewW, center.x - viewW / 2));
  const viewY = Math.max(0, Math.min(100 - viewH, center.y - viewH / 2));

  const path =
    OUTLINE.map(([lat, lng], i) => {
      const p = project(lat, lng);
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    }).join(" ") + " Z";

  const markerSize = focus ? 3.2 : 5;

  return (
    <div className="glass relative overflow-hidden rounded-3xl">
      <div className="absolute left-4 top-4 z-10">
        <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">Réseau Maroc</div>
        <div className="font-display text-lg font-bold uppercase">
          {focus ? focus.city : `${restaurants.length} restaurants`}
        </div>
      </div>

      <div className="absolute right-4 top-4 z-10 flex flex-col gap-1.5">
        <button
          className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background/70 backdrop-blur"
          onClick={() => setZoom((z) => Math.min(3, z + 0.4))}
          aria-label="Zoom avant"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background/70 backdrop-blur"
          onClick={() => setZoom((z) => Math.max(1, z - 0.4))}
          aria-label="Zoom arrière"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background/70 backdrop-blur"
          onClick={() => {
            setZoom(1);
            onCityChange(null);
          }}
          aria-label="Réinitialiser la vue"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <svg
        viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
        className="h-[460px] w-full transition-[view-box] duration-500"
        style={{ transition: "all .6s cubic-bezier(.22,1,.36,1)" }}
      >
        <defs>
          <linearGradient id="ma-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.23 28 / 22%)" />
            <stop offset="100%" stopColor="oklch(0.86 0.17 82 / 16%)" />
          </linearGradient>
        </defs>
        <path d={path} fill="url(#ma-fill)" stroke="oklch(0.62 0.23 28 / 60%)" strokeWidth={0.25} />

        {!focus &&
          cities.map((c) => {
            const p = project(c.lat, c.lng);
            const avg = Math.round(c.list.reduce((a, r) => a + r.compliance, 0) / c.list.length);
            return (
              <g
                key={c.city}
                className="cursor-pointer"
                onClick={() => onCityChange(c.city)}
                role="button"
                aria-label={`Zoomer sur ${c.city}`}
              >
                <circle cx={p.x} cy={p.y} r={markerSize} fill="oklch(0.62 0.23 28 / 25%)">
                  <animate attributeName="r" values={`${markerSize};${markerSize * 1.5};${markerSize}`} dur="2.6s" repeatCount="indefinite" />
                </circle>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={markerSize * 0.62}
                  fill={avg >= 90 ? "oklch(0.68 0.17 150)" : avg >= 75 ? "oklch(0.82 0.16 85)" : "oklch(0.62 0.23 28)"}
                  stroke="white"
                  strokeWidth={0.25}
                />
                <text x={p.x} y={p.y + 0.6} textAnchor="middle" fontSize={2.2} fontWeight="700" fill="white">
                  {c.list.length}
                </text>
                <text x={p.x} y={p.y - markerSize - 1} textAnchor="middle" fontSize={2.6} fill="currentColor" className="fill-foreground">
                  {c.city}
                </text>
              </g>
            );
          })}

        {focus &&
          focus.list.map((r) => {
            const p = project(r.lat, r.lng);
            return (
              <g
                key={r.id}
                className="cursor-pointer"
                onMouseEnter={() => setHover(r)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(r)}
                role="button"
                aria-label={r.name}
              >
                <circle cx={p.x} cy={p.y} r={markerSize} fill="oklch(0.86 0.17 82 / 25%)" />
                <image
                  href={texasLogo}
                  x={p.x - markerSize * 0.75}
                  y={p.y - markerSize * 0.75}
                  width={markerSize * 1.5}
                  height={markerSize * 1.5}
                />
                <text x={p.x} y={p.y + markerSize + 1.6} textAnchor="middle" fontSize={1.4} className="fill-foreground">
                  {r.code}
                </text>
              </g>
            );
          })}
      </svg>

      {hover && (
        <div className="glass pointer-events-none absolute bottom-4 left-4 z-10 w-64 rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gold" />
            <span className="truncate text-sm font-semibold">{hover.name}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{hover.address}</p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span>Conformité</span>
            <span
              className={cn(
                "font-display font-bold",
                hover.compliance >= 90 ? "text-success" : hover.compliance >= 75 ? "text-warning" : "text-destructive",
              )}
            >
              {hover.compliance}%
            </span>
          </div>
        </div>
      )}

      {!focus && (
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-1.5">
          {cities.map((c) => (
            <button
              key={c.city}
              onClick={() => onCityChange(c.city)}
              className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs backdrop-blur hover:border-gold/50"
            >
              {c.city} · {c.list.length}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
