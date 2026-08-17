import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Guard } from "@/components/tc/guard";
import { ManagerShell } from "@/components/tc/shells";

export const Route = createFileRoute("/app")({
  component: () => (
    <Guard space="manager">
      <ManagerShell>
        <Outlet />
      </ManagerShell>
    </Guard>
  ),
});
