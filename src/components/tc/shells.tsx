import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  Settings,
  User as UserIcon,
  Building2,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Users as UsersIcon,

  Search,
  ShieldCheck,
  Workflow,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedBackground } from "./background";
import { TCLogo, TCMark } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Input } from "@/components/ui/input";
import { can, currentUser, logout, useStore } from "@/lib/tc/store";
import { StatusPill } from "./bits";

export interface NavItem {
  to: string;
  label: string;
  module: string;
  icon: typeof Home;
  exact?: boolean;
}

export const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Command Center", module: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/restaurants", label: "Restaurants", module: "Restaurants", icon: Building2 },
  { to: "/admin/processes", label: "Processus & Contrôles", module: "Processus", icon: Workflow },
  { to: "/admin/users", label: "Utilisateurs", module: "Utilisateurs", icon: UsersIcon },
];


/* ---------------- global search ---------------- */
function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const s = useStore((st) => st);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const out: { label: string; kind: string; to: string; params?: Record<string, string> }[] = [];
    s.restaurants
      .filter((r) => `${r.name} ${r.code} ${r.city}`.toLowerCase().includes(t))
      .slice(0, 5)
      .forEach((r) => out.push({ label: r.name, kind: "Restaurant", to: `/admin/restaurants/${r.id}` }));
    s.users
      .filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(t))
      .slice(0, 5)
      .forEach((u) => out.push({ label: `${u.firstName} ${u.lastName}`, kind: "Utilisateur", to: `/admin/users` }));
    s.processes
      .filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(t))
      .slice(0, 5)
      .forEach((p) => out.push({ label: p.name, kind: "Processus", to: `/admin/builder/${p.id}` }));
    s.standards
      .filter((x) => x.name.toLowerCase().includes(t))
      .slice(0, 4)
      .forEach((x) => out.push({ label: x.name, kind: "Standard", to: "/admin/standards" }));
    s.controls
      .filter((c) => c.ref.toLowerCase().includes(t))
      .slice(0, 4)
      .forEach((c) => out.push({ label: c.ref, kind: "Contrôle", to: `/admin/controls/${c.id}` }));
    s.evidence
      .filter((e) => e.ref.toLowerCase().includes(t))
      .slice(0, 4)
      .forEach((e) => out.push({ label: e.ref, kind: "Preuve", to: "/admin/evidence" }));
    s.alerts
      .filter((a) => a.message.toLowerCase().includes(t))
      .slice(0, 4)
      .forEach((a) => out.push({ label: a.message, kind: "Alerte", to: "/admin/alerts" }));
    return out;
  }, [q, s]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-24 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass animate-rise w-full max-w-2xl overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search className="h-4 w-4 text-gold" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher restaurants, managers, processus, contrôles, preuves, alertes..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {q && results.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Aucun résultat pour « {q} »</p>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary/60"
              onClick={() => {
                onClose();
                setQ("");
                navigate({ to: r.to as "/" });
              }}
            >
              <span className="truncate text-sm">{r.label}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-widest text-gold">{r.kind}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- notifications ---------------- */
function NotificationBell() {
  const alerts = useStore((s) => s.alerts);
  const [open, setOpen] = useState(false);
  const unread = alerts.filter((a) => !a.read && !a.resolved).length;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-secondary/40 transition-colors hover:border-gold/40"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="animate-pulse-ring absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="glass animate-rise absolute right-0 z-50 mt-2 w-[340px] overflow-hidden rounded-2xl">
            <div className="border-b border-border px-4 py-3 font-display text-sm font-bold uppercase tracking-wider">
              Notifications
            </div>
            <div className="max-h-80 overflow-y-auto">
              {alerts.slice(0, 12).map((a) => (
                <div key={a.id} className="border-b border-border/60 px-4 py-3 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <StatusPill status={a.level} />
                    <span className="text-[10px] text-muted-foreground">{a.createdAt}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{a.message}</p>
                </div>
              ))}
            </div>
            <Link
              to="/admin/alerts"
              onClick={() => setOpen(false)}
              className="block bg-secondary/40 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-widest text-gold hover:bg-secondary/70"
            >
              Ouvrir l'Alert Center
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- user menu ---------------- */
function UserMenu({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = useStore(() => currentUser());
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-1 pr-2 transition-colors hover:border-gold/50"
        aria-label="Menu utilisateur"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient font-display text-sm font-bold text-brand-foreground">
          {initials}
        </span>
        {!compact && (
          <span className="hidden leading-tight sm:block">
            <span className="block text-xs font-semibold">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-gold">{user?.role}</span>
          </span>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="glass animate-rise absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl">
            <div className="border-b border-border px-4 py-3">
              <div className="font-display text-sm font-bold uppercase">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-gold">{user?.role}</div>
            </div>
            <div className="p-2">
              <MenuRow icon={<UserIcon className="h-4 w-4" />} label="Mon profil" onClick={() => { setOpen(false); toast.info("Profil utilisateur", { description: `${user?.firstName} ${user?.lastName} — score ${user?.score}%` }); }} />
              <MenuRow icon={<Settings className="h-4 w-4" />} label="Paramètres" onClick={() => { setOpen(false); toast.info("Paramètres du compte", { description: "Préférences, langue et notifications." }); }} />
              <MenuRow
                icon={<LogOut className="h-4 w-4 text-destructive" />}
                label="Déconnexion"
                onClick={() => {
                  setOpen(false);
                  logout();
                  navigate({ to: "/" });
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuRow({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary/60"
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------- admin shell ---------------- */
export function AdminShell({ children }: { children: ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState(false);
  const navigate = useNavigate();
  const user = useStore(() => currentUser());
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch(true);
      }
      if (e.key === "Escape") setSearch(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const nav = ADMIN_NAV.filter((n) => can(user, n.module, "Voir"));

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <GlobalSearch open={search} onClose={() => setSearch(false)} />

      <header className="sticky top-0 z-30 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-[1600px] items-center gap-4 px-4 lg:px-6">
          <Link to="/admin" className="shrink-0" aria-label="Texas Chicken">
            <TCLogo className="[&_img]:h-14" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to as "/"}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all",
                    active ? "bg-brand/15 text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <n.icon className={cn("h-4 w-4", active ? "text-gold" : "group-hover:text-gold")} />
                  <span className="whitespace-nowrap">{n.label}</span>
                  {active && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-gradient" />}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSearch(true)}
              className="hidden h-10 w-56 items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 text-sm text-muted-foreground transition-colors hover:border-gold/40 xl:flex"
            >
              <Search className="h-4 w-4" />
              Recherche
              <kbd className="ml-auto rounded border border-border px-1.5 text-[10px]">⌘K</kbd>
            </button>
            <button
              onClick={() => setSearch(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-secondary/40 xl:hidden"
              aria-label="Recherche globale"
            >
              <Search className="h-4 w-4" />
            </button>
            <NotificationBell />
            <ThemeToggle />
            <UserMenu />
            <button
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-secondary/40 lg:hidden"
              onClick={() => setMobileNav((o) => !o)}
              aria-label="Menu"
            >
              {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileNav && (
          <nav className="animate-rise grid gap-1 border-t border-border px-4 py-3 lg:hidden">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to as "/"}
                  onClick={() => setMobileNav(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                    active ? "bg-brand/15 text-foreground" : "text-muted-foreground",
                  )}
                >
                  <n.icon className={cn("h-4 w-4", active && "text-gold")} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="animate-rise mx-auto w-full max-w-[1600px] p-4 lg:p-6">{children}</main>
    </div>
  );

}

/* ---------------- manager shell ---------------- */
const MANAGER_NAV: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/app", label: "Shift", icon: Home, exact: true },
  { to: "/app/processes", label: "Processus", icon: Workflow },
  { to: "/app/tasks", label: "Tâches", icon: ListChecks },
  { to: "/app/calendar", label: "Calendrier", icon: CalendarDays },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
];

export function ManagerShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = useStore(() => currentUser());
  const restaurant = useStore((s) => s.restaurants.find((r) => r.id === user?.restaurantId));
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const alerts = useStore((s) => s.alerts.filter((a) => a.restaurantId === user?.restaurantId && !a.resolved).length);

  return (
    <div className="relative min-h-screen pb-24">
      <AnimatedBackground intensity="soft" />
      <header className="sticky top-0 z-30 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <TCMark className="h-10 w-10" />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate font-display text-sm font-bold uppercase tracking-wide">
              {restaurant?.name ?? "Restaurant Operations"}
            </div>
            <div className="truncate text-[10px] uppercase tracking-[0.2em] text-gold">
              {user?.firstName} {user?.lastName} — {user?.role}
            </div>
          </div>
          <ThemeToggle />
          <div className="relative">
            <Link
              to="/app/alerts"
              className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-secondary/40"
              aria-label="Alertes"
            >
              <Activity className="h-4 w-4" />
            </Link>
            {alerts > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-brand-foreground">
                {alerts}
              </span>
            )}
          </div>
          <UserMenu compact />
        </div>
      </header>
      <main className="animate-rise mx-auto w-full max-w-3xl px-4 py-4">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl">
          {MANAGER_NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to as "/"}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  active ? "text-gold" : "text-muted-foreground",
                )}
              >
                {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-brand-gradient" />}
                <n.icon className="h-5 w-5" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
