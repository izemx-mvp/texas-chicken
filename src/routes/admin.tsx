import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Guard } from "@/components/tc/guard";
import { AdminShell } from "@/components/tc/shells";

export const Route = createFileRoute("/admin")({
  component: () => (
    <Guard space="admin">
      <AdminShell>
        <Outlet />
      </AdminShell>
    </Guard>
  ),
});
