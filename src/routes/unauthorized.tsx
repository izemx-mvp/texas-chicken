import { createFileRoute } from "@tanstack/react-router";
import { Unauthorized } from "@/components/tc/guard";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({
    meta: [
      { title: "Accès non autorisé — Texas Chicken OEP" },
      { name: "description", content: "Vous ne disposez pas des permissions requises pour accéder à cette section de la plateforme." },
      { property: "og:title", content: "Accès non autorisé — Texas Chicken OEP" },
      { property: "og:description", content: "Permissions insuffisantes sur la plateforme d'excellence opérationnelle." },
    ],
  }),
  component: () => <Unauthorized />,
});
