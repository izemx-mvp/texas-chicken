import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MessageSquare, Search, Send, Users } from "lucide-react";
import { SectionTitle } from "@/components/tc/bits";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  currentUser,
  groupsForUser,
  markGroupRead,
  messagesOf,
  sendMessage,
  unreadCount,
  useStore,
} from "@/lib/tc/store";

export const Route = createFileRoute("/app/chat")({
  head: () => ({
    meta: [
      { title: "Communication d'équipe — Texas Chicken Operations" },
      {
        name: "description",
        content:
          "Messagerie interne Texas Chicken : groupes restaurant, managers et opérations, messages en temps réel et notifications de non-lus.",
      },
      { property: "og:title", content: "Communication d'équipe — Texas Chicken Operations" },
      { property: "og:description", content: "Groupes, messages, membres et notifications pour les équipes en restaurant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const state = useStore((s) => s);
  const me = currentUser();
  const groups = useMemo(() => groupsForUser(me?.id, state), [state, me?.id]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [members, setMembers] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const active = groups.find((g) => g.id === activeId) ?? null;
  const msgs = active ? messagesOf(active.id, state) : [];

  useEffect(() => {
    if (active && me) markGroupRead(active.id, me.id);
  }, [active?.id, me?.id, msgs.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length, active?.id]);

  const filtered = groups.filter((g) => `${g.name} ${g.description}`.toLowerCase().includes(q.toLowerCase()));
  const userName = (id: string) => {
    const u = state.users.find((x) => x.id === id);
    return u ? `${u.firstName} ${u.lastName}` : "Utilisateur";
  };

  if (active) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setActiveId(null)}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold"
        >
          <ArrowLeft className="h-4 w-4" /> Conversations
        </button>

        <div className="glass flex items-center gap-3 rounded-2xl p-3">
          <span className="h-11 w-11 shrink-0 rounded-xl" style={{ background: active.avatar }} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm font-bold uppercase">{active.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {active.memberIds.length} membres · {active.type}
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setMembers((m) => !m)}>
            <Users className="mr-1.5 h-4 w-4" /> Membres
          </Button>
        </div>

        {members && (
          <div className="glass grid gap-1 rounded-2xl p-3 sm:grid-cols-2">
            {active.memberIds.map((id) => {
              const u = state.users.find((x) => x.id === id);
              return (
                <div key={id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-gradient text-[10px] font-bold text-brand-foreground">
                    {u?.firstName?.[0]}
                    {u?.lastName?.[0]}
                  </span>
                  <span className="truncate">
                    {userName(id)}
                    {id === active.adminId && <span className="ml-1 text-[10px] uppercase text-gold">admin</span>}
                  </span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{u?.role}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="glass max-h-[52vh] space-y-3 overflow-y-auto rounded-2xl p-3">
          {msgs.map((m) => {
            const mine = m.userId === me?.id;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    mine ? "bg-brand/20" : "bg-secondary/60",
                  )}
                >
                  {!mine && (
                    <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">
                      {userName(m.userId)}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div className="mt-1 text-right text-[10px] text-muted-foreground">{m.at}</div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim() || !me) return;
            sendMessage(active.id, me.id, text);
            setText("");
          }}
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message…" />
          <Button type="submit" size="icon" aria-label="Envoyer">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionTitle title="Communication" subtitle={`${groups.length} groupes actifs`} />
      <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un groupe…"
          className="h-10 w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((g) => {
          const last = messagesOf(g.id, state).slice(-1)[0];
          const unread = unreadCount(g.id, me?.id, state);
          return (
            <button
              key={g.id}
              onClick={() => setActiveId(g.id)}
              className="glass flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:border-gold/40"
            >
              <span className="h-11 w-11 shrink-0 rounded-xl" style={{ background: g.avatar }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{g.name}</span>
                  {unread > 0 && (
                    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {last ? `${last.text}` : g.description}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-gold">{last?.at ?? g.createdAt}</div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass grid place-items-center gap-2 rounded-2xl p-10 text-center text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8 text-gold" />
            Aucun groupe ne correspond à votre recherche.
          </div>
        )}
      </div>
    </div>
  );
}
