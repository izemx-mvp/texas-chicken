import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Award, Building2, CalendarClock, GraduationCap, Mail, MessagesSquare, ShieldCheck, Star } from "lucide-react";
import { SectionTitle, ProgressBar } from "@/components/tc/bits";
import { UserAvatar, GroupAvatar } from "@/components/tc/avatar";
import { currentUser, trainingsForUser, useStore } from "@/lib/tc/store";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Mon profil — Texas Chicken Operations" },
      {
        name: "description",
        content:
          "Profil collaborateur Texas Chicken : restaurant, rôle, score de conformité, formations validées, groupes de communication et activité du shift.",
      },
      { property: "og:title", content: "Mon profil — Texas Chicken Operations" },
      { property: "og:description", content: "Score, formations, groupes et activité opérationnelle du collaborateur." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const state = useStore((s) => s);
  const me = currentUser();
  const views = useMemo(() => trainingsForUser(me?.id, state), [state, me?.id]);

  if (!me) return <div className="glass rounded-3xl p-10 text-center text-sm">Session expirée.</div>;

  const restaurant = state.restaurants.find((r) => r.id === me.restaurantId);
  const groups = state.chatGroups.filter((g) => g.memberIds.includes(me.id));
  const role = state.roles.find((r) => r.id === me.roleId);
  const completed = views.filter((v) => v.completed);
  const avg = views.length ? Math.round(views.reduce((a, v) => a + v.percent, 0) / views.length) : 0;
  const myTasks = state.shiftTasks.filter((t) => t.date === state.activeDate);

  return (
    <div className="space-y-4">
      <SectionTitle title="Mon profil" subtitle="Identité, périmètre, formations et activité opérationnelle" />

      <div className="glass rounded-3xl p-5">
        <div className="flex items-center gap-4">
          <UserAvatar user={me} size={72} presence rounded="rounded-2xl" />
          <div className="min-w-0">
            <div className="font-display text-xl font-bold uppercase">
              {me.firstName} {me.lastName}
            </div>
            <div className="text-[11px] uppercase tracking-widest text-gold">{me.role}</div>
            <div className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {me.email}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          {[
            ["Score", `${me.score}%`, Star],
            ["Tâches", me.tasks, CalendarClock],
            ["Retards", me.late, ShieldCheck],
            ["Formations", completed.length, Award],
          ].map(([l, n, Icon]) => {
            const I = Icon as typeof Star;
            return (
              <div key={l as string} className="rounded-2xl border border-border p-3">
                <I className="mx-auto mb-1 h-4 w-4 text-gold" />
                <div className="font-display text-lg font-bold text-gold">{n as string}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l as string}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass rounded-3xl p-5">
          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold">
            <Building2 className="h-4 w-4" /> Restaurant
          </div>
          {restaurant ? (
            <div className="text-sm">
              <div className="font-semibold">{restaurant.name}</div>
              <div className="text-xs text-muted-foreground">
                {restaurant.city} · {restaurant.address}
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                Tâches planifiées aujourd'hui : <span className="text-gold">{myTasks.length}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Périmètre réseau (multi-restaurants)</div>
          )}
        </div>

        <div className="glass rounded-3xl p-5">
          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold">
            <ShieldCheck className="h-4 w-4" /> Permissions
          </div>
          <div className="text-sm font-semibold">{role?.name ?? me.role}</div>
          <p className="text-xs text-muted-foreground">{role?.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.keys(role?.permissions ?? {})
              .slice(0, 8)
              .map((m) => (
                <span key={m} className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                  {m}
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold">
          <GraduationCap className="h-4 w-4" /> Formations — progression globale {avg}%
        </div>
        <div className="space-y-2">
          {views.slice(0, 6).map((v) => (
            <Link
              key={v.training.id}
              to="/app/training/$id"
              params={{ id: v.training.id }}
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-secondary/50"
            >
              <span className="min-w-0 flex-1 truncate text-sm">{v.training.title}</span>
              <ProgressBar value={v.percent} className="w-24" />
              <span className="w-10 shrink-0 text-right text-xs font-semibold text-gold">{v.percent}%</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold">
          <MessagesSquare className="h-4 w-4" /> Mes groupes ({groups.length})
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
              <GroupAvatar avatar={g.avatar} name={g.name} size={36} />
              <div className="min-w-0">
                <div className="truncate text-sm">{g.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{g.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
