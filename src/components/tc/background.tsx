import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { LAND } from "@/lib/tc/land";
import { restaurants } from "@/lib/tc/data";
import texasLogo from "@/assets/texas-chicken-logo.svg";

/**
 * GLOBAL TEXAS CHICKEN DIGITAL TERRITORY
 *
 * Globe terrestre numérique (continents Natural Earth, jour/nuit, city lights,
 * atmosphère, nuages, restaurants Texas Chicken dans le monde, arcs réseau)
 * qui se dissout en particules pour former le logo officiel Texas Chicken,
 * puis revient au globe. Tout est dessiné dans un seul canvas 2D.
 */

/* -------- réseau mondial Texas Chicken (implantations réelles de l'enseigne) -------- */
const WORLD_SITES: { name: string; lat: number; lng: number; hub?: boolean }[] = [
  { name: "San Antonio", lat: 29.42, lng: -98.49, hub: true },
  { name: "Houston", lat: 29.76, lng: -95.37 },
  { name: "Mexico", lat: 19.43, lng: -99.13 },
  { name: "Panama", lat: 8.98, lng: -79.52 },
  { name: "Bogota", lat: 4.71, lng: -74.07 },
  { name: "Londres", lat: 51.51, lng: -0.13 },
  { name: "Le Caire", lat: 30.04, lng: 31.24 },
  { name: "Riyad", lat: 24.71, lng: 46.68, hub: true },
  { name: "Dubaï", lat: 25.2, lng: 55.27 },
  { name: "Doha", lat: 25.29, lng: 51.53 },
  { name: "Karachi", lat: 24.86, lng: 67.01 },
  { name: "Delhi", lat: 28.61, lng: 77.21 },
  { name: "Jakarta", lat: -6.21, lng: 106.85, hub: true },
  { name: "Kuala Lumpur", lat: 3.14, lng: 101.69 },
  { name: "Singapour", lat: 1.35, lng: 103.82 },
  { name: "Manille", lat: 14.6, lng: 120.98 },
  { name: "Hô Chi Minh", lat: 10.82, lng: 106.63 },
  { name: "Lagos", lat: 6.52, lng: 3.38 },
  { name: "Nairobi", lat: -1.29, lng: 36.82 },
];

const MOROCCO_HUB = { lat: 33.57, lng: -7.59 };

const DEG = Math.PI / 180;

type Vec3 = { x: number; y: number; z: number };
const toVec = (lat: number, lng: number): Vec3 => {
  const la = lat * DEG;
  const lo = lng * DEG;
  return { x: Math.cos(la) * Math.cos(lo), y: Math.sin(la), z: Math.cos(la) * Math.sin(lo) };
};

function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const dot = Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z));
  const o = Math.acos(dot);
  if (o < 1e-4) return a;
  const s = Math.sin(o);
  const k1 = Math.sin((1 - t) * o) / s;
  const k2 = Math.sin(t * o) / s;
  return { x: a.x * k1 + b.x * k2, y: a.y * k1 + b.y * k2, z: a.z * k1 + b.z * k2 };
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* cycle : globe → dissolution → logo → recomposition → globe */
const T_GLOBE = 15;
const T_MORPH = 3.4;
const T_LOGO = 4.6;
const T_BACK = 3.4;
const T_CYCLE = T_GLOBE + T_MORPH + T_LOGO + T_BACK;

export function AnimatedBackground({
  intensity = "full",
  className,
}: {
  intensity?: "full" | "soft" | number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);

  const opacity = typeof intensity === "number" ? intensity : intensity === "soft" ? 0.35 : 1;

  /** Restaurants du réseau marocain géré par la plateforme. */
  const moroccoSites = useMemo(
    () => restaurants.map((r) => ({ lat: r.lat, lng: r.lng })),
    [],
  );

  /** Champ de logos défilants (identique à la première version). */
  const logoField = useMemo(
    () =>
      Array.from({ length: 64 }, (_, i) => ({
        size: [44, 62, 80, 96][i % 4] as number,
        opacity: intensity === "soft" ? 0.05 + (i % 3) * 0.015 : 0.07 + (i % 4) * 0.02,
        shift: ((i * 53) % 90) - 45,
      })),
    [intensity],
  );



  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dark = document.documentElement.classList.contains("dark");
    const themeObs = new MutationObserver(() => {
      dark = document.documentElement.classList.contains("dark");
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const lowPower = window.innerWidth < 640 || (navigator.hardwareConcurrency ?? 8) <= 4;

    /* ---------- données statiques ---------- */
    const stride = lowPower ? 2 : 1;
    const dotScale = lowPower ? 1 : 1.25;
    const land: Vec3[] = [];
    for (let i = 0; i < LAND.length; i += 2 * stride) {
      land.push(toVec((LAND[i + 1] as number) / 10, (LAND[i] as number) / 10));
    }
    const cityLight = land.map((_, i) => i % 17 === 0);

    const clouds = Array.from({ length: lowPower ? 14 : 26 }, (_, i) => ({
      lat: ((i * 37) % 140) - 70,
      lng: ((i * 97) % 360) - 180,
      r: 0.1 + ((i * 13) % 9) / 42,
      a: 0.05 + ((i * 7) % 5) / 90,
    }));

    const worldVecs = WORLD_SITES.map((s) => ({ ...s, v: toVec(s.lat, s.lng) }));
    const moroccoVecs = moroccoSites.map((s) => toVec(s.lat, s.lng));
    const moroccoV = toVec(MOROCCO_HUB.lat, MOROCCO_HUB.lng);

    const arcs = worldVecs.map((s, i) => ({
      a: s.v,
      b: i % 3 === 0 ? moroccoV : (worldVecs[(i * 5 + 3) % worldVecs.length] as { v: Vec3 }).v,
      speed: 0.09 + ((i % 5) * 0.03),
      phase: (i % 7) / 7,
    }));

    const stars = Array.from({ length: lowPower ? 60 : 130 }, (_, i) => ({
      x: ((i * 71) % 100) / 100,
      y: ((i * 149) % 100) / 100,
      r: 0.4 + ((i * 17) % 10) / 12,
      p: (i % 11) / 11,
    }));

    /* ---------- silhouette du logo (cible des particules) ---------- */
    let logoPts: { x: number; y: number }[] = [];
    const img = new Image();
    img.onload = () => {
      const S = 220;
      const off = document.createElement("canvas");
      off.width = S;
      off.height = S;
      const octx = off.getContext("2d");
      if (!octx) return;
      const ratio = Math.min(S / img.width, S / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      octx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
      const data = octx.getImageData(0, 0, S, S).data;
      const pts: { x: number; y: number }[] = [];
      for (let y = 0; y < S; y += 2) {
        for (let x = 0; x < S; x += 2) {
          const alpha = data[(y * S + x) * 4 + 3] ?? 0;
          if (alpha > 120) pts.push({ x: x / S - 0.5, y: y / S - 0.5 });
        }
      }
      // mélange déterministe pour des trajectoires réparties
      for (let i = pts.length - 1; i > 0; i--) {
        const j = (i * 7919) % (i + 1);
        const tmp = pts[i] as { x: number; y: number };
        pts[i] = pts[j] as { x: number; y: number };
        pts[j] = tmp;
      }
      logoPts = pts;
    };
    img.src = texasLogo;

    /* ---------- boucle ---------- */
    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    const start = performance.now();
    const speed = reduced ? 0.35 : 1;

    const render = (now: number) => {
      const t = ((now - start) / 1000) * speed;
      const c = t % T_CYCLE;
      const morphT =
        c < T_GLOBE
          ? 0
          : c < T_GLOBE + T_MORPH
            ? smooth(0, 1, (c - T_GLOBE) / T_MORPH)
            : c < T_GLOBE + T_MORPH + T_LOGO
              ? 1
              : 1 - smooth(0, 1, (c - T_GLOBE - T_MORPH - T_LOGO) / T_BACK);

      const globeA = 1 - morphT;
      const logoA = smooth(0.72, 1, morphT);
      if (logoRef.current) {
        logoRef.current.style.opacity = String(logoA);
        logoRef.current.style.transform = `scale(${0.9 + logoA * 0.1})`;
      }

      ctx.clearRect(0, 0, w, h);

      /* caméra flottante */
      const cx = w / 2 + Math.sin(t * 0.07) * w * 0.02;
      const cy = h * 0.52 + Math.cos(t * 0.05) * h * 0.02;
      const R = Math.min(w, h) * (w < 640 ? 0.42 : 0.36) * (1 + Math.sin(t * 0.045) * 0.02);

      /* étoiles */
      for (const s of stars) {
        if (!dark) break;
        const tw = 0.35 + 0.35 * Math.sin(t * 0.8 + s.p * 9);
        ctx.globalAlpha = tw * 0.7;
        ctx.fillStyle = "#e9e2d6";
        ctx.beginPath();
        ctx.arc(s.x * w + Math.sin(t * 0.03) * 6, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* rotation + inclinaison */
      const rot = t * (reduced ? 0.02 : 0.055);
      const tilt = 0.32;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);
      const project = (v: Vec3) => {
        const x1 = v.x * cosR - v.z * sinR;
        const z1 = v.x * sinR + v.z * cosR;
        const y2 = v.y * cosT - z1 * sinT;
        const z2 = v.y * sinT + z1 * cosT;
        return { sx: cx + x1 * R, sy: cy - y2 * R, z: z2, nx: x1, ny: y2 };
      };
      // direction du soleil (jour/nuit) tournant plus lentement
      const sunA = t * 0.02 + 0.6;
      const sun = { x: Math.cos(sunA), y: 0.25, z: Math.sin(sunA) };

      if (globeA > 0.02) {
        /* atmosphère + océan */
        const ocean = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.38, R * 0.08, cx, cy, R);
        if (dark) {
          ocean.addColorStop(0, `rgba(26,58,86,${0.92 * globeA})`);
          ocean.addColorStop(0.55, `rgba(12,30,50,${0.94 * globeA})`);
          ocean.addColorStop(0.85, `rgba(6,14,26,${0.96 * globeA})`);
          ocean.addColorStop(1, `rgba(3,7,13,${0.98 * globeA})`);
        } else {
          ocean.addColorStop(0, `rgba(255,214,150,${0.97 * globeA})`);
          ocean.addColorStop(0.55, `rgba(238,168,96,${0.97 * globeA})`);
          ocean.addColorStop(0.86, `rgba(206,116,62,${0.97 * globeA})`);
          ocean.addColorStop(1, `rgba(160,72,40,${0.98 * globeA})`);
        }
        ctx.fillStyle = ocean;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();

        /* graticule : méridiens & parallèles */
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.clip();
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = dark
          ? `rgba(150,200,235,${0.1 * globeA})`
          : `rgba(90,38,16,${0.20 * globeA})`;
        for (let lat = -60; lat <= 60; lat += 30) {
          ctx.beginPath();
          let st = false;
          for (let lng = -180; lng <= 180; lng += 6) {
            const p = project(toVec(lat, lng));
            if (p.z < 0) { st = false; continue; }
            if (!st) { ctx.moveTo(p.sx, p.sy); st = true; } else ctx.lineTo(p.sx, p.sy);
          }
          ctx.stroke();
        }
        for (let lng = -180; lng < 180; lng += 30) {
          ctx.beginPath();
          let st = false;
          for (let lat = -90; lat <= 90; lat += 4) {
            const p = project(toVec(lat, lng));
            if (p.z < 0) { st = false; continue; }
            if (!st) { ctx.moveTo(p.sx, p.sy); st = true; } else ctx.lineTo(p.sx, p.sy);
          }
          ctx.stroke();
        }
        ctx.restore();

        /* terminateur jour/nuit + reflet spéculaire */
        const sp = project({ x: sun.x, y: sun.y, z: sun.z });
        if (sp.z > -0.2) {
          const g = ctx.createRadialGradient(sp.sx, sp.sy, 0, sp.sx, sp.sy, R * 0.85);
          g.addColorStop(0, `rgba(255,246,225,${(dark ? 0.18 : 0.3) * globeA})`);
          g.addColorStop(1, "rgba(255,246,225,0)");
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, R, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = g;
          ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
          ctx.restore();
        }
        const shade = ctx.createRadialGradient(cx + R * 0.35, cy + R * 0.4, R * 0.2, cx, cy, R);
        shade.addColorStop(0, "rgba(0,0,0,0)");
        shade.addColorStop(1, `rgba(0,0,0,${(dark ? 0.55 : 0.26) * globeA})`);
        ctx.fillStyle = shade;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();

        const halo = ctx.createRadialGradient(cx, cy, R * 0.93, cx, cy, R * 1.26);
        halo.addColorStop(0, dark ? `rgba(120,180,235,${0.26 * globeA})` : `rgba(150,205,245,${0.42 * globeA})`);
        halo.addColorStop(0.45, dark ? `rgba(90,140,210,${0.1 * globeA})` : `rgba(120,180,225,${0.16 * globeA})`);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.26, 0, Math.PI * 2);
        ctx.fill();
      }

      /* continents / particules */
      const logoScale = Math.min(w, h) * (w < 640 ? 0.72 : 0.62);
      for (let i = 0; i < land.length; i++) {
        const p = project(land[i] as Vec3);
        const front = p.z > -0.02;
        let x = p.sx;
        let y = p.sy;
        let a = 0;
        const lit = Math.max(0, (land[i] as Vec3).x * sun.x + (land[i] as Vec3).y * sun.y + (land[i] as Vec3).z * sun.z);
        const dayA = dark ? 0.42 + lit * 0.55 : 0.75 + lit * 0.25;
        if (front) a = dayA;

        if (morphT > 0 && logoPts.length) {
          const target = logoPts[i % logoPts.length] as { x: number; y: number };
          const tx = cx + target.x * logoScale;
          const ty = cy + target.y * logoScale;
          const k = smooth(0, 1, Math.min(1, morphT * 1.15 - ((i % 9) / 9) * 0.12));
          x = p.sx + (tx - p.sx) * k;
          y = p.sy + (ty - p.sy) * k;
          a = (front ? dayA : 0.16) * (1 - morphT * 0.85) + 0.55 * morphT;
          if (morphT > 0.85) a *= 1 - smooth(0.85, 1, morphT);
        } else if (!front) {
          continue;
        }
        if (a <= 0.01) continue;

        ctx.globalAlpha = a;
        if (morphT > 0.15) {
          ctx.fillStyle = i % 4 === 0 ? "#e8b23a" : "#d8452f";
        } else if (cityLight[i] && lit < 0.15) {
          ctx.fillStyle = dark ? "#ffc978" : "#ffb347";
        } else if (dark) {
          ctx.fillStyle = lit > 0.35 ? "#e2f3cf" : lit > 0.12 ? "#a7cfa2" : "#4a7382";
        } else {
          ctx.fillStyle = lit > 0.35 ? "#14562f" : lit > 0.12 ? "#0d3f24" : "#08281a";
        }

        const size = (cityLight[i] && lit < 0.15 ? 1.7 : 1.55) * dotScale;
        ctx.fillRect(x, y, size, size);
      }
      ctx.globalAlpha = 1;

      if (globeA > 0.05) {
        /* nuages */
        for (const cl of clouds) {
          const v = toVec(cl.lat, cl.lng + t * (reduced ? 0.4 : 1.6));
          const p = project(v);
          if (p.z < 0.05) continue;
          const rr = cl.r * R * (0.5 + p.z * 0.7);
          const g = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, rr);
          g.addColorStop(0, `rgba(226,236,244,${cl.a * p.z * globeA})`);
          g.addColorStop(1, "rgba(226,236,244,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, rr, 0, Math.PI * 2);
          ctx.fill();
        }

        /* arcs réseau international */
        ctx.lineWidth = 0.8;
        for (const arc of arcs) {
          ctx.beginPath();
          let started = false;
          for (let s = 0; s <= 24; s++) {
            const f = s / 24;
            const m = slerp(arc.a, arc.b, f);
            const lift = 1 + Math.sin(f * Math.PI) * 0.16;
            const p = project({ x: m.x * lift, y: m.y * lift, z: m.z * lift });
            if (p.z < 0) {
              started = false;
              continue;
            }
            if (!started) {
              ctx.moveTo(p.sx, p.sy);
              started = true;
            } else ctx.lineTo(p.sx, p.sy);
          }
          ctx.strokeStyle = `rgba(232,178,58,${0.16 * globeA})`;
          ctx.stroke();

          /* flux lumineux le long de l'arc */
          const f = (t * arc.speed + arc.phase) % 1;
          const m = slerp(arc.a, arc.b, f);
          const lift = 1 + Math.sin(f * Math.PI) * 0.16;
          const p = project({ x: m.x * lift, y: m.y * lift, z: m.z * lift });
          if (p.z > 0) {
            ctx.globalAlpha = globeA;
            ctx.fillStyle = "#f2c14e";
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        /* implantations Texas Chicken dans le monde */
        worldVecs.forEach((s, i) => {
          const p = project(s.v);
          if (p.z < 0) return;
          const pulse = 0.5 + 0.5 * Math.sin(t * 1.1 + i);
          const a = globeA * (0.45 + p.z * 0.55);
          ctx.globalAlpha = a * (0.35 + pulse * 0.4);
          ctx.fillStyle = "#f0b93f";
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 3 + pulse * 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = a;
          ctx.fillStyle = s.hub ? "#ffd97a" : "#e8622f";
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, s.hub ? 2 : 1.5, 0, Math.PI * 2);
          ctx.fill();
        });

        /* emphase Maroc : territoire piloté par la plateforme */
        const pm = project(moroccoV);
        if (pm.z > 0) {
          const g = ctx.createRadialGradient(pm.sx, pm.sy, 0, pm.sx, pm.sy, R * 0.26);
          g.addColorStop(0, `rgba(216,69,47,${0.3 * globeA * pm.z})`);
          g.addColorStop(1, "rgba(216,69,47,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(pm.sx, pm.sy, R * 0.26, 0, Math.PI * 2);
          ctx.fill();
          moroccoVecs.forEach((v, i) => {
            const p = project(v);
            if (p.z < 0) return;
            const pulse = 0.5 + 0.5 * Math.sin(t * 1.6 + i * 0.9);
            ctx.globalAlpha = globeA * (0.5 + pulse * 0.5) * p.z;
            ctx.fillStyle = "#ffd06a";
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, 1.6 + pulse, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObs.disconnect();
    };
  }, [moroccoSites]);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background", className)}
    >
      {/* intensité */}
      <div
        className="absolute inset-0 opacity-[var(--tc-bg-i)]"
        style={{ "--tc-bg-i": opacity } as React.CSSProperties}
      >
        {/* ciel clair en light mode, espace profond en dark */}
        <div
          className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,oklch(0.99_0.012_85)_0%,oklch(0.96_0.03_70)_55%,oklch(0.93_0.045_55)_100%)] dark:bg-[radial-gradient(120%_90%_at_50%_45%,oklch(0.20_0.03_250_/_55%)_0%,oklch(0.12_0.02_260_/_75%)_55%,oklch(0.08_0.01_265_/_92%)_100%)]"
        />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {/* champ de logos Texas Chicken — même direction, même vitesse */}
        <div className="absolute inset-0 [mask-image:radial-gradient(85%_75%_at_50%_45%,black,transparent)]">
          <div className="animate-logo-march absolute -inset-y-1/2 -left-1/2 grid h-[200%] w-[200%] grid-cols-8 place-items-center gap-y-16">
            {logoField.map((l, i) => (
              <img
                key={i}
                src={texasLogo}
                alt=""
                aria-hidden="true"
                className="object-contain dark:[filter:drop-shadow(0_0_14px_oklch(0.86_0.17_82_/_35%))]"
                style={{
                  width: l.size,
                  height: l.size,
                  opacity: l.opacity,
                  transform: `translateX(${l.shift}px)`,
                }}
              />
            ))}
          </div>
        </div>



        {/* logo officiel formé par les particules */}
        <div ref={logoRef} className="absolute inset-0 grid place-items-center" style={{ opacity: 0 }}>
          <img
            src={texasLogo}
            alt=""
            className="w-[62vmin] max-w-[620px] object-contain [filter:drop-shadow(0_0_40px_oklch(0.86_0.17_82_/_45%))_drop-shadow(0_0_10px_oklch(0.98_0_0_/_35%))]"
          />
        </div>

        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(100%_100%_at_50%_50%,transparent_55%,oklch(0.85_0.03_75_/_45%)_100%)] dark:bg-[radial-gradient(100%_100%_at_50%_50%,transparent_45%,oklch(0.08_0.01_260_/_55%)_100%)]" />
      </div>


    </div>
  );
}
