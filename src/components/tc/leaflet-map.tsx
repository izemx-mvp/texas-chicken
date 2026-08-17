import { useEffect, useMemo, useRef, useState } from "react";
import type * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { Globe2, Minus, Plus, Undo2 } from "lucide-react";
import texasLogo from "@/assets/texas-chicken-logo.svg";
import { cn } from "@/lib/utils";
import type { Restaurant } from "@/lib/tc/types";

export interface MapRestaurantStats {
  progress: number;
  done: number;
  total: number;
  late: number;
  compliance: number;
}

export interface LeafletMapProps {
  restaurants: Restaurant[];
  stats: (r: Restaurant) => MapRestaurantStats;
  onSelect: (r: Restaurant) => void;
}

const MOROCCO_CENTER: [number, number] = [31.4, -7.6];
const MOROCCO_ZOOM = 5.6;

const SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const LABELS =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

function lowPower() {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return cores <= 4 || !!reduce;
}

export default function LeafletMap({ restaurants, stats, onSelect }: LeafletMapProps) {
  const holder = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const historyRef = useRef<{ center: [number, number]; zoom: number }[]>([]);
  const cbRef = useRef({ stats, onSelect });
  cbRef.current = { stats, onSelect };

  const [ready, setReady] = useState(false);
  const [flying, setFlying] = useState(false);
  const [canBack, setCanBack] = useState(false);
  const [hover, setHover] = useState<{ r: Restaurant; x: number; y: number } | null>(null);
  const [zoomLabel, setZoomLabel] = useState("Maroc");
  const soft = useMemo(() => lowPower(), []);

  /* ---------- init ---------- */
  useEffect(() => {
    let disposed = false;
    let map: L.Map | null = null;

    (async () => {
      const leaflet = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      if (disposed || !holder.current) return;

      map = leaflet.map(holder.current, {
        center: MOROCCO_CENTER,
        zoom: MOROCCO_ZOOM,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: true,
        zoomSnap: 0.25,
        worldCopyJump: true,
      });
      mapRef.current = map;

      leaflet.tileLayer(SAT, { maxZoom: 18, attribution: "Esri, Maxar, Earthstar Geographics" }).addTo(map);
      leaflet.tileLayer(LABELS, { maxZoom: 18, opacity: 0.9 }).addTo(map);

      const cluster = leaflet.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: (z: number) => (z < 8 ? 80 : z < 11 ? 55 : 30),
        animate: true,
        animateAddingMarkers: false,
        iconCreateFunction: (c) => {
          const n = c.getChildCount();
          const size = n < 5 ? 52 : n < 10 ? 58 : 64;
          // Le logo Texas Chicken reste l'élément visuel principal : le nombre
          // n'est qu'un badge discret indiquant la présence de plusieurs restaurants.
          return leaflet.divIcon({
            className: "tc-cluster-wrap",
            html: `<div class="tc-cluster" style="width:${size}px;height:${size}px">
                     <img src="${texasLogo}" alt="Texas Chicken" />
                     <span class="tc-cluster-badge">+${n}</span>
                   </div>`,
            iconSize: [size, size],
          });
        },

      });
      clusterRef.current = cluster;
      map.addLayer(cluster);

      const remember = () => {
        const c = map!.getCenter();
        historyRef.current.push({ center: [c.lat, c.lng], zoom: map!.getZoom() });
        if (historyRef.current.length > 12) historyRef.current.shift();
        setCanBack(true);
      };

      cluster.on("clusterclick", (e: L.LeafletEvent & { layer: L.MarkerCluster }) => {
        remember();
        const bounds = e.layer.getBounds();
        setFlying(true);
        map!.flyToBounds(bounds, { padding: [70, 70], duration: 2.4, easeLinearity: 0.18 });
      });

      map.on("zoomend moveend", () => {
        const z = map!.getZoom();
        setZoomLabel(z < 7 ? "Maroc" : z < 10 ? "Région" : z < 13 ? "Ville" : "Restaurants");
      });
      map.on("movestart", () => setHover(null));
      map.on("moveend", () => setFlying(false));

      setReady(true);
    })();

    return () => {
      disposed = true;
      map?.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  /* ---------- markers ---------- */
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const leaflet = (await import("leaflet")).default;
      const cluster = clusterRef.current;
      if (cancelled || !cluster) return;
      cluster.clearLayers();

      for (const r of restaurants) {
        const icon = leaflet.divIcon({
          className: "tc-pin-wrap",
          html: `<div class="tc-pin${r.status === "Actif" ? " tc-pin-live" : ""}">
                   <span class="tc-pin-ring"></span>
                   <img src="${texasLogo}" alt="${r.name}" />
                 </div>`,
          iconSize: [46, 46],
          iconAnchor: [23, 23],
        });
        const marker = leaflet.marker([r.lat, r.lng], { icon, title: r.name, riseOnHover: true });
        marker.on("mouseover", (e: L.LeafletMouseEvent) => {
          const p = e.containerPoint;
          setHover({ r, x: p.x, y: p.y });
        });
        marker.on("mouseout", () => setHover(null));
        marker.on("click", () => {
          const el = (marker as unknown as { _icon?: HTMLElement })._icon;
          el?.classList.add("tc-pin-selected");
          setHover(null);
          setFlying(true);
          mapRef.current?.flyTo([r.lat, r.lng], 17, { duration: 1.8, easeLinearity: 0.2 });
          window.setTimeout(() => cbRef.current.onSelect(r), 1500);
        });
        cluster.addLayer(marker);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, restaurants]);

  const flyGlobal = () => {
    setFlying(true);
    historyRef.current = [];
    setCanBack(false);
    mapRef.current?.flyTo(MOROCCO_CENTER, MOROCCO_ZOOM, { duration: 2, easeLinearity: 0.2 });
  };
  const flyBack = () => {
    const prev = historyRef.current.pop();
    setCanBack(historyRef.current.length > 0);
    if (!prev) return flyGlobal();
    setFlying(true);
    mapRef.current?.flyTo(prev.center, prev.zoom, { duration: 1.8, easeLinearity: 0.2 });
  };

  const hoverStats = hover ? cbRef.current.stats(hover.r) : null;

  return (
    <div className="tc-map-shell glass relative overflow-hidden rounded-3xl">
      <div ref={holder} className="h-[560px] w-full" />

      {/* atmosphère / nuages */}
      {!soft && (
        <div className="pointer-events-none absolute inset-0 z-[500]">
          <div className="tc-haze absolute inset-0" />
          <div className={cn("tc-clouds absolute inset-0 transition-opacity duration-700", flying ? "opacity-90" : "opacity-25")} />
          <div className={cn("tc-clouds tc-clouds-2 absolute inset-0 transition-opacity duration-700", flying ? "opacity-70" : "opacity-15")} />
          <div className={cn("absolute inset-0 bg-black/25 transition-opacity duration-700", flying ? "opacity-100" : "opacity-0")} />
        </div>
      )}

      {/* header */}
      <div className="pointer-events-none absolute left-4 top-4 z-[600]">
        <div className="glass rounded-2xl px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">Niveau · {zoomLabel}</div>
          <div className="font-display text-lg font-bold uppercase leading-tight">{restaurants.length} restaurants</div>
        </div>
      </div>

      {/* contrôles */}
      <div className="absolute right-4 top-4 z-[600] flex flex-col gap-1.5">
        <MapBtn label="Zoom avant" onClick={() => mapRef.current?.zoomIn(1)}>
          <Plus className="h-4 w-4" />
        </MapBtn>
        <MapBtn label="Zoom arrière" onClick={() => mapRef.current?.zoomOut(1)}>
          <Minus className="h-4 w-4" />
        </MapBtn>
        <MapBtn label="Retour au niveau précédent" onClick={flyBack} disabled={!canBack}>
          <Undo2 className="h-4 w-4" />
        </MapBtn>
        <MapBtn label="Vue globale Maroc" onClick={flyGlobal}>
          <Globe2 className="h-4 w-4" />
        </MapBtn>
      </div>

      {/* mini-card hover */}
      {hover && hoverStats && (
        <div
          className="glass animate-rise pointer-events-none absolute z-[700] w-64 rounded-2xl p-3 shadow-2xl"
          style={{
            left: Math.min(Math.max(hover.x - 128, 12), (holder.current?.clientWidth ?? 600) - 268),
            top: Math.max(hover.y - 200, 12),
          }}
        >
          <div className="flex items-center gap-2">
            <img src={texasLogo} alt="" className="h-9 w-9 object-contain" />
            <div className="min-w-0">
              <div className="truncate font-display text-xs font-bold uppercase leading-tight">{hover.r.name}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{hover.r.city}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span className={cn("h-2 w-2 rounded-full", hover.r.status === "Actif" ? "bg-success" : "bg-muted-foreground")} />
            {hover.r.status}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${hoverStats.progress}%` }} />
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
            <Stat label="Progression" value={`${hoverStats.progress} %`} />
            <Stat label="Tâches" value={`${hoverStats.done} / ${hoverStats.total}`} />
            <Stat label="En retard" value={String(hoverStats.late)} tone={hoverStats.late > 0 ? "bad" : undefined} />
            <Stat label="Conformité" value={`${hoverStats.compliance} %`} />
          </dl>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "bad" }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 px-2 py-1">
      <dt className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className={cn("font-display text-xs font-bold", tone === "bad" ? "text-destructive" : "text-foreground")}>{value}</dd>
    </div>
  );
}

function MapBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background/80 backdrop-blur transition-colors hover:border-gold/50 disabled:opacity-35"
    >
      {children}
    </button>
  );
}
