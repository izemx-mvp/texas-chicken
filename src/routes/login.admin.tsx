import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/tc/login-form";

export const Route = createFileRoute("/login/admin")({
  head: () => ({
    meta: [
      { title: "Connexion Administration — Texas Chicken" },
      { name: "description", content: "Accès back-office Texas Chicken : restaurants, processus, contrôles, preuves et analytics du réseau." },
      { property: "og:title", content: "Connexion Administration — Texas Chicken" },
      { property: "og:description", content: "Pilotez le réseau Texas Chicken depuis l'Operations Command Center." },
    ],
  }),
  component: () => (
    <LoginForm
      space="admin"
      accent="Back-office réseau"
      title="Administration"
      subtitle="Pilotez restaurants, processus, standards, contrôles et performances."
      defaultEmail="admin@texaschicken-demo.com"
      defaultPassword="Admin123!"
      redirect="/admin"
    />
  ),
});
