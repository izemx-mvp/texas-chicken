import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { AnimatedBackground } from "./background";
import { TCLogo } from "./logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/tc/store";

export function LoginForm({
  space,
  title,
  subtitle,
  defaultEmail,
  defaultPassword,
  redirect,
  accent,
}: {
  space: "manager" | "admin";
  title: string;
  subtitle: string;
  defaultEmail: string;
  defaultPassword: string;
  redirect: string;
  accent: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState(defaultPassword);
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    setTimeout(() => {
      const res = login(email, password, space);
      if (!res.ok) {
        setStatus("error");
        setError(res.error);
        return;
      }
      setStatus("success");
      setTimeout(() => navigate({ to: redirect as "/" }), 700);
    }, 850);
  };

  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <AnimatedBackground />
      <Link
        to="/"
        className="absolute left-6 top-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      <div className="glass panel-glow animate-rise w-full max-w-md overflow-hidden rounded-3xl">
        <div className="h-1 w-full bg-brand-gradient" />
        <div className="p-8">
          <TCLogo />
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.32em] text-gold">{accent}</p>
          <h1 className="mt-2 font-display text-3xl font-bold uppercase">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-border bg-secondary/40 pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-border bg-secondary/40 pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-gold"
                  aria-label={show ? "Masquer" : "Afficher"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 accent-[oklch(0.62_0.23_28)]"
              />
              Se souvenir de moi
            </label>

            {status === "error" && (
              <div className="animate-rise rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {status === "success" && (
              <div className="animate-rise flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" /> Connexion réussie — redirection...
              </div>
            )}

            <Button type="submit" className="h-12 w-full text-sm font-bold uppercase tracking-widest" disabled={status === "loading"}>
              {status === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-gold">Compte de démonstration</span>
            <div className="mt-1 tabular">{defaultEmail}</div>
            <div className="tabular">{defaultPassword}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
