import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { AnimatedBackground } from "./background";
import { currentUser, hydrateSession, useStore } from "@/lib/tc/store";
import { Button } from "@/components/ui/button";

export function Unauthorized({ reason }: { reason?: string }) {
  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <AnimatedBackground />
      <div className="glass animate-rise max-w-md rounded-3xl p-10 text-center">
        <ShieldAlert className="mx-auto h-14 w-14 text-destructive" />
        <h1 className="mt-4 font-display text-3xl font-bold uppercase">Accès non autorisé</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {reason ?? "Votre compte ne dispose pas des permissions nécessaires pour accéder à cette interface."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Guard({ space, children }: { space: "manager" | "admin"; children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const session = useStore((s) => s.session);
  const user = useStore(() => currentUser());

  useEffect(() => {
    hydrateSession();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="relative grid min-h-screen place-items-center">
        <AnimatedBackground intensity="soft" />
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-gold" />
          <span className="text-xs uppercase tracking-[0.3em]">Chargement de la session</span>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return (
      <div className="relative grid min-h-screen place-items-center px-4">
        <AnimatedBackground />
        <div className="glass animate-rise max-w-md rounded-3xl p-10 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-gold" />
          <h1 className="mt-4 font-display text-2xl font-bold uppercase">Session expirée</h1>
          <p className="mt-2 text-sm text-muted-foreground">Veuillez vous reconnecter pour continuer.</p>
          <Button asChild className="mt-6">
            <Link to={space === "manager" ? "/login/manager" : "/login/admin"}>Se connecter</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (session.space !== space) {
    return (
      <Unauthorized
        reason={
          space === "admin"
            ? "Les comptes Restaurant Operations ne peuvent pas accéder au back-office."
            : "Les comptes Administration doivent utiliser le back-office."
        }
      />
    );
  }

  return <>{children}</>;
}
