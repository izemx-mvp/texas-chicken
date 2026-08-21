import { createFileRoute } from "@tanstack/react-router";
import { Building2, GraduationCap, Mail, MessagesSquare, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { SectionTitle, KpiCard } from "@/components/tc/bits";
import { UserAvatar } from "@/components/tc/avatar";
import { currentUser, useStore } from "@/lib/tc/store";
import { PERMISSIONS } from "@/lib/tc/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({
    meta: [
      { title: "Mon profil administrateur — Texas Chicken Administration" },
      {
        name: "description",
        content:
          "Profil administrateur Texas Chicken : périmètre réseau, matrice de permissions par module, restaurants supervisés et activité de pilotage.",
      },
      { property: "og:title", content: "Mon profil administrateur — Texas Chicken Administration" },
      { property: "og:description", content: "Périmètre, permissions et supervision du réseau Texas Chicken." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminProfilePage,
});

function AdminProfilePage() {
  const state = useStore((s) => s);
  const me = currentUser();
  if (!me) return <div className="glass rounded-3xl p-10 text-center text-sm">Session expirée.</div>;

  const role = state.roles.find((r) => r.id === me.roleId);
  const scope = me.restaurantIds?.length
    ? state.restaurants.filter((r) => me.restaurantIds!.includes(r.id))
    : state.restaurants;

  return (
    <div className="space-y-4">
      <SectionTitle title="Mon profil" subtitle="Identité, périmètre de supervision et matrice de permissions" />

      <div className="glass rounded-3xl p-5">
        <div className="flex flex-wrap items-center gap-4">
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Restaurants supervisés" value={scope.length} icon={<Building2 className="h-4 w-4" />} />
        <KpiCard label="Collaborateurs" value={state.users.length} icon={<UsersIcon className="h-4 w-4" />} />
        <KpiCard label="Formations pilotées" value={state.trainings.length} icon={<GraduationCap className="h-4 w-4" />} />
        <KpiCard label="Groupes de communication" value={state.chatGroups.length} icon={<MessagesSquare className="h-4 w-4" />} />

      </div>

      <div className="glass overflow-hidden rounded-3xl p-5">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold">
          <ShieldCheck className="h-4 w-4" /> Matrice de permissions — {role?.name ?? me.role}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="py-2 text-left">Module</th>
                {PERMISSIONS.map((p) => (
                  <th key={p} className="px-2 py-2 text-center">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(role?.permissions ?? {}).map(([module, perms]) => (
                <tr key={module} className="border-t border-border/60">
                  <td className="py-2 pr-3">{module}</td>
                  {PERMISSIONS.map((p) => (
                    <td key={p} className="px-2 py-2 text-center">
                      <span
                        className={cn(
                          "inline-block h-2.5 w-2.5 rounded-full",
                          perms.includes(p) ? "bg-success" : "bg-muted-foreground/30",
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold">
          <Building2 className="h-4 w-4" /> Périmètre
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {scope.map((r) => (
            <div key={r.id} className="rounded-xl border border-border px-3 py-2 text-xs">
              <div className="truncate font-semibold">{r.name}</div>
              <div className="text-muted-foreground">{r.city}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
