import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChefHat, Radar, ShieldCheck, Sparkles } from "lucide-react";
import { AnimatedBackground } from "@/components/tc/background";
import { TCLogo } from "@/components/tc/logo";
import { AnimatedNumber } from "@/components/tc/bits";
import { kpis, useStore } from "@/lib/tc/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Texas Chicken Operational Excellence Platform" },
      {
        name: "description",
        content:
          "Plateforme d'excellence opérationnelle Texas Chicken : standards, processus, contrôles terrain, preuves photo analysées par IA et analytics réseau.",
      },
      { property: "og:title", content: "Texas Chicken Operational Excellence Platform" },
      {
        property: "og:description",
        content:
          "Digitalisez l'exécution des standards Texas Chicken : Restaurant Operations et Administration en temps réel.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const k = useStore((s) => kpis(s));

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <TCLogo />
        <span className="hidden items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-gold sm:flex">
          <Sparkles className="h-3.5 w-3.5" /> AI Operations Control
        </span>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-24">
        <section className="pt-8 text-center lg:pt-16">
          <p className="animate-rise text-xs font-semibold uppercase tracking-[0.45em] text-gold">
            Enterprise Platform
          </p>
          <h1
            className="animate-rise mt-4 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            Welcome to Texas Chicken
            <span className="block text-brand-gradient">Operational Excellence</span>
          </h1>
          <p
            className="animate-rise mx-auto mt-5 max-w-2xl text-base text-muted-foreground"
            style={{ animationDelay: "160ms" }}
          >
            Standards, processus, exécution terrain, preuves analysées par IA, contrôle anti-fraude et
            pilotage du réseau — une seule plateforme, temps réel.
          </p>

          <div className="animate-rise mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: "240ms" }}>
            {[
              { l: "Restaurants", v: k.restaurants },
              { l: "Conformité", v: k.compliance, s: "%" },
              { l: "Contrôles", v: k.controls },
              { l: "Preuves IA", v: k.evidenceAnalyzed },
            ].map((x) => (
              <div key={x.l} className="glass rounded-2xl px-4 py-3">
                <div className="font-display text-2xl font-bold text-gold">
                  <AnimatedNumber value={x.v} suffix={x.s ?? ""} />
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{x.l}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-2">
          <PortalCard
            to="/login/manager"
            eyebrow="Interface 1"
            title="Restaurant Operations"
            description="Exécutez les standards et contrôles de votre restaurant en temps réel."
            cta="Accéder à Restaurant Operations"
            icon={<ChefHat className="h-6 w-6" />}
            bullets={["Shift Command Center", "Preuves photo anti-fraude IA", "Mobile-first, pensé pour le shift"]}
          />
          <PortalCard
            to="/login/admin"
            eyebrow="Interface 2"
            title="Administration"
            description="Pilotez les restaurants, processus, standards, contrôles et performances."
            cta="Accéder à Administration"
            icon={<Radar className="h-6 w-6" />}
            bullets={["Operations Command Center", "Process Builder visuel", "Analytics, rôles & permissions"]}
          />
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "Anti-fraude photo", d: "Chaque preuve est comparée à l'historique et bloquée si déjà utilisée." },
            { icon: Radar, t: "Contrôle temps réel", d: "Suivi des processus, étapes, retards et non-conformités du réseau." },
            { icon: Sparkles, t: "Analytics IA", d: "KPI de conformité par restaurant, processus, zone et manager." },
          ].map((f) => (
            <div key={f.t} className="glass hover-lift rounded-2xl p-5">
              <f.icon className="h-5 w-5 text-gold" />
              <h3 className="mt-3 font-display text-lg font-bold uppercase">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

function PortalCard({
  to,
  eyebrow,
  title,
  description,
  cta,
  icon,
  bullets,
}: {
  to: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  icon: React.ReactNode;
  bullets: string[];
}) {
  return (
    <Link
      to={to as "/"}
      className="glass hover-lift group relative block overflow-hidden rounded-3xl p-8 transition-transform"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-brand-gradient opacity-15 blur-3xl transition-opacity duration-500 group-hover:opacity-40" />
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-secondary/50 text-gold transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
          {icon}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {eyebrow}
        </span>
      </div>
      <h2 className="mt-6 font-display text-4xl font-bold uppercase tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <ul className="mt-5 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm text-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {b}
          </li>
        ))}
      </ul>
      <span className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-bold uppercase tracking-wider text-brand-foreground shadow-lg transition-transform duration-300 group-hover:translate-x-1">
        {cta} <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
