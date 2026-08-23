import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { SectionTitle, KpiCard } from "@/components/tc/bits";
import { TCSelect } from "@/components/tc/select";
import { ShiftTeamCard, ShiftTimeline } from "@/components/tc/shift-planner";
import { ShiftManager } from "@/components/tc/shift-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assignmentsFor,
  conflictMessage,
  dayReport,
  restaurantShifts,
  shiftDate,
  useActiveDate,
  useStore,
} from "@/lib/tc/store";
import { TODAY } from "@/lib/tc/data";

export const Route = createFileRoute("/admin/shifts")({
  head: () => ({
    meta: [
      { title: "Planification des shifts — Texas Chicken Administration" },
      {
        name: "description",
        content:
          "Planifiez les shifts du réseau : équipes affectées, rôles, remplacements, conflits d'horaire et progression des tâches par shift.",
      },
      { property: "og:title", content: "Planification des shifts — Texas Chicken Administration" },
      { property: "og:description", content: "Affectation des équipes, remplacements et analytics par shift." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminShiftsPage,
});

function AdminShiftsPage() {
  const state = useStore((s) => s);
  const [date, setDate] = useActiveDate();
  const [restaurantId, setRestaurantId] = useState(state.restaurants[0]?.id ?? "r1");
  const [tab, setTab] = useState<"planning" | "config">("planning");
  const [search, setSearch] = useState("");
  const [activeShift, setActiveShift] = useState<string | null>(null);

  const shifts = useMemo(() => restaurantShifts(restaurantId, state), [restaurantId, state]);
  const reports = useMemo(() => dayReport(date, TODAY, state, restaurantId), [date, state, restaurantId]);
  const assignments = useMemo(() => assignmentsFor(restaurantId, date, undefined, state), [restaurantId, date, state]);

  const conflicts = useMemo(
    () =>
      assignments
        .map((a) => ({ a, msg: conflictMessage(a.userId, a.date, a.shiftId, a.id) }))
        .filter((x) => x.msg),
    [assignments],
  );

  const filteredShifts = useMemo(() => {
    if (!search.trim()) return shifts;
    const q = search.toLowerCase();
    const ids = new Set(
      assignments
        .filter((a) => {
          const u = state.users.find((x) => x.id === (a.replacementUserId ?? a.userId));
          return u && `${u.firstName} ${u.lastName} ${u.role}`.toLowerCase().includes(q);
        })
        .map((a) => a.shiftId),
    );
    return shifts.filter((sh) => ids.has(sh.id) || sh.name.toLowerCase().includes(q));
  }, [shifts, search, assignments, state.users]);

  const present = assignments.filter((a) => a.status === "Présent" || a.status === "En retard").length;
  const absent = assignments.filter((a) => a.status === "Absent").length;
  const replaced = assignments.filter((a) => !!a.replacementUserId).length;

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Planification des shifts"
        subtitle="Équipes, rôles, remplacements et progression — Restaurant → Shift → Équipe → Tâches"
      />

      <div className="glass rounded-3xl p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Restaurant</span>
            <TCSelect
              value={restaurantId}
              onChange={setRestaurantId}
              searchable
              options={state.restaurants.map((r) => ({ value: r.id, label: r.name, description: r.city }))}
            />
          </label>

          <div className="flex items-end gap-1">
            <Button variant="ghost" size="icon" aria-label="Jour précédent" onClick={() => setDate(shiftDate(date, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Date</span>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
            </div>
            <Button variant="ghost" size="icon" aria-label="Jour suivant" onClick={() => setDate(shiftDate(date, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDate(TODAY)}>
              <CalendarDays className="mr-1.5 h-4 w-4" /> Aujourd'hui
            </Button>
          </div>

          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
              Rechercher un employé / shift
            </span>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, rôle, shift…" />
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Affectations" value={assignments.length} icon={<Users className="h-4 w-4" />} />
          <KpiCard label="Présents" value={present} tone="success" />
          <KpiCard label="Absents" value={absent} tone="danger" />
          <KpiCard label="Remplacements" value={replaced} tone="warning" />
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border border-border p-1">
        {(["planning", "config"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "flex-1 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-colors " +
              (tab === t ? "bg-brand/20 text-foreground" : "text-muted-foreground")
            }
          >
            {t === "planning" ? "Planning & équipes" : "Configuration des shifts"}
          </button>
        ))}
      </div>

      {tab === "config" ? (
        <div className="glass rounded-3xl p-5">
          <ShiftManager restaurantId={restaurantId} />
        </div>
      ) : (
        <div className="space-y-4">
          {conflicts.length > 0 && (
            <div className="glass rounded-3xl border border-destructive/40 p-4">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-destructive">
                <AlertTriangle className="h-4 w-4" /> Conflits d'horaire ({conflicts.length})
              </h3>
              <div className="mt-2 space-y-1">
                {conflicts.slice(0, 6).map(({ a, msg }) => {
                  const u = state.users.find((x) => x.id === a.userId);
                  return (
                    <p key={a.id} className="text-xs text-muted-foreground">
                      <strong className="text-foreground">
                        {u?.firstName} {u?.lastName}
                      </strong>{" "}
                      — {msg}
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          <div className="glass rounded-3xl p-4">
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">Timeline 24 h</h3>
            <ShiftTimeline shifts={shifts} activeId={activeShift} onSelect={(id) => setActiveShift(id === activeShift ? null : id)} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {filteredShifts
              .filter((sh) => !activeShift || sh.id === activeShift)
              .map((sh) => (
                <ShiftTeamCard
                  key={sh.id}
                  shift={sh}
                  date={date}
                  restaurantId={restaurantId}
                  reports={reports}
                  editable
                />
              ))}
          </div>

          {filteredShifts.length === 0 && (
            <p className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">
              Aucun shift ne correspond à cette recherche.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
