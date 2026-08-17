import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/tc/login-form";

export const Route = createFileRoute("/login/manager")({
  head: () => ({
    meta: [
      { title: "Connexion Restaurant Operations — Texas Chicken" },
      { name: "description", content: "Connectez-vous à Restaurant Operations pour exécuter les standards Texas Chicken pendant votre shift." },
      { property: "og:title", content: "Connexion Restaurant Operations — Texas Chicken" },
      { property: "og:description", content: "Accès manager à la plateforme d'excellence opérationnelle Texas Chicken." },
    ],
  }),
  component: () => (
    <LoginForm
      space="manager"
      accent="Interface Restaurant"
      title="Restaurant Operations"
      subtitle="Connectez-vous pour démarrer votre shift et exécuter les standards."
      defaultEmail="manager@texaschicken-demo.com"
      defaultPassword="Manager123!"
      redirect="/app"
    />
  ),
});
