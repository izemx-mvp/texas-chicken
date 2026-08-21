/**
 * Chat global Texas Chicken — couche de communication accessible depuis toute
 * la plateforme. Bouton flottant style Instagram Direct + fenêtre flottante
 * (liste des conversations → conversation → composer). L'ouverture contextuelle
 * se fait via openChatDock(groupId | { restaurantId } | { search }).
 */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  Image as ImageIcon,
  MessagesSquare,
  Paperclip,
  Search,
  Send,
  Smile,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  currentUser,
  groupsForUser,
  markGroupRead,
  messagesOf,
  sendMessage,
  totalUnread,
  unreadCount,
  useStore,
} from "@/lib/tc/store";
import type { ChatAttachment } from "@/lib/tc/ops";
import { GroupAvatar, UserAvatar } from "./avatar";

/* ------------------------ état global du dock ------------------------ */
type DockState = { open: boolean; groupId: string | null };
let dockState: DockState = { open: false, groupId: null };
const listeners = new Set<() => void>();
const setDock = (next: Partial<DockState>) => {
  dockState = { ...dockState, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const useDock = () =>
  useSyncExternalStore(
    subscribe,
    () => dockState,
    () => dockState,
  );

/** Ouvre le chat global. Accepte un id de groupe, un restaurant ou une recherche par nom. */
export function openChatDock(target?: string | { restaurantId?: string; match?: string }) {
  if (!target) return setDock({ open: true });
  if (typeof target === "string") return setDock({ open: true, groupId: target });
  const groups = groupsForUser(currentUser()?.id);
  let g = target.restaurantId ? groups.find((x) => x.restaurantId === target.restaurantId) : undefined;
  if (!g && target.match) {
    const t = target.match.toLowerCase();
    g = groups.find((x) => x.name.toLowerCase().includes(t));
  }
  setDock({ open: true, groupId: g?.id ?? null });
}

export function closeChatDock() {
  setDock({ open: false });
}

/* ------------------------ bouton contextuel ------------------------ */
export function ChatContextButton({
  label,
  target,
  className,
}: {
  label: string;
  target?: string | { restaurantId?: string; match?: string };
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => openChatDock(target)}
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-gold/50 hover:text-gold",
        className,
      )}
    >
      <MessagesSquare className="h-4 w-4 text-gold" />
      {label}
    </button>
  );
}

const EMOJIS = ["👍", "✅", "🔥", "🍗", "⚠️", "🙏", "📸", "🕒", "❄️", "🧼", "💪", "😀", "🚚", "📦"];

const dayLabel = (d: string) => {
  const today = new Date().toISOString().slice(0, 10);
  if (d === today) return "Aujourd'hui";
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
};

/* ------------------------ composant principal ------------------------ */
export function ChatDock() {
  const { open, groupId } = useDock();
  const state = useStore((s) => s);
  const me = currentUser();
  const groups = useMemo(() => groupsForUser(me?.id, state), [state, me?.id]);
  const unread = totalUnread(me?.id, state);

  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState<ChatAttachment[]>([]);
  const [emoji, setEmoji] = useState(false);
  const [members, setMembers] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = groups.find((g) => g.id === groupId) ?? null;
  const msgs = active ? messagesOf(active.id, state) : [];

  useEffect(() => {
    if (open && active && me) markGroupRead(active.id, me.id);
  }, [open, active?.id, me?.id, msgs.length]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, msgs.length, active?.id]);

  const userOf = (id: string) => state.users.find((u) => u.id === id);
  const nameOf = (id: string) => {
    const u = userOf(id);
    return u ? `${u.firstName} ${u.lastName}` : "Utilisateur";
  };
  const initials = (id: string) => {
    const u = userOf(id);
    return `${u?.firstName?.[0] ?? "?"}${u?.lastName?.[0] ?? ""}`;
  };

  const filtered = groups.filter((g) =>
    `${g.name} ${g.description}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const mentionCandidates = active
    ? [{ id: "all", label: "all", role: "Tout le groupe" }].concat(
        active.memberIds.slice(0, 8).map((id) => ({
          id,
          label: userOf(id)?.firstName ?? "user",
          role: userOf(id)?.role ?? "",
        })),
      )
    : [];

  const submit = () => {
    if (!me || !active || (!text.trim() && pending.length === 0)) return;
    sendMessage(active.id, me.id, text.trim() || "(pièce jointe)", pending);
    setText("");
    setPending([]);
    setEmoji(false);
    setMentionOpen(false);
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        type="button"
        onClick={() => setDock({ open: !open })}
        aria-label="Chat Texas Chicken"
        className={cn(
          "fixed bottom-24 right-4 z-[100] grid h-14 w-14 place-items-center rounded-full bg-brand-gradient text-brand-foreground shadow-xl shadow-black/30 transition-transform duration-200 hover:scale-105 active:scale-95 lg:bottom-6 lg:right-6",
          open && "scale-95",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessagesSquare className="h-6 w-6" />}
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-gold px-1 text-[10px] font-bold text-background">
            {unread}
          </span>
        )}
      </button>

      {/* Fenêtre flottante */}
      {open && (
        <div
          className="glass fixed bottom-40 right-4 z-[100] flex h-[68vh] w-[min(24rem,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-border shadow-2xl shadow-black/40 lg:bottom-24 lg:right-6 lg:h-[34rem]"
          style={{ animation: "chat-pop .22s cubic-bezier(.2,.9,.3,1.2)" }}
        >
          <style>{`@keyframes chat-pop{from{opacity:0;transform:translateY(12px) scale(.94)}to{opacity:1;transform:none}}`}</style>

          {/* Header */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            {active ? (
              <>
                <button onClick={() => setDock({ groupId: null })} aria-label="Retour" className="text-gold">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <GroupAvatar avatar={active.avatar} name={active.name} size={32} rounded="rounded-lg" />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-sm font-semibold">{active.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {active.memberIds.length} membres · {active.type}
                  </div>
                </div>
                <button onClick={() => setMembers((m) => !m)} aria-label="Membres" className="text-muted-foreground hover:text-gold">
                  <Users className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <MessagesSquare className="h-4 w-4 text-gold" />
                <div className="flex-1 font-display text-sm font-bold uppercase tracking-wide">Messages</div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{groups.length} groupes</span>
              </>
            )}
            <button onClick={() => setDock({ open: false })} aria-label="Fermer" className="text-muted-foreground hover:text-brand">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Liste des conversations */}
          {!active && (
            <>
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher une conversation…"
                  className="h-6 w-full bg-transparent text-sm outline-none"
                />
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto p-2">
                {filtered.map((g) => {
                  const last = messagesOf(g.id, state).slice(-1)[0];
                  const n = unreadCount(g.id, me?.id, state);
                  return (
                    <button
                      key={g.id}
                      onClick={() => setDock({ groupId: g.id })}
                      className="flex w-full items-center gap-2.5 rounded-2xl p-2 text-left transition-colors hover:bg-secondary/60"
                    >
                      <span className="relative shrink-0">
                        <GroupAvatar avatar={g.avatar} name={g.name} size={44} />
                        {n > 0 && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-gold" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn("truncate text-sm", n > 0 ? "font-bold" : "font-medium")}>{g.name}</span>
                          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{last?.at.slice(11) ?? ""}</span>
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {last ? `${userOf(last.userId)?.firstName ?? ""}: ${last.text}` : g.description}
                        </span>
                      </span>
                      {n > 0 && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
                          {n}
                        </span>
                      )}
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="p-8 text-center text-xs text-muted-foreground">Aucune conversation.</p>
                )}
              </div>
            </>
          )}

          {/* Conversation */}
          {active && (
            <>
              {members && (
                <div className="max-h-32 overflow-y-auto border-b border-border p-2">
                  {active.memberIds.map((id) => (
                    <div key={id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs">
                      <UserAvatar user={userOf(id)} size={24} presence rounded="rounded-md" />
                      <span className="truncate">{nameOf(id)}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{userOf(id)?.role}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                <p className="rounded-xl bg-secondary/40 p-2 text-center text-[11px] text-muted-foreground">
                  {active.description}
                </p>
                {msgs.map((m, i) => {
                  const mine = m.userId === me?.id;
                  const prev = msgs[i - 1];
                  const showDay = !prev || prev.at.slice(0, 10) !== m.at.slice(0, 10);
                  return (
                    <div key={m.id}>
                      {showDay && (
                        <div className="my-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
                          {dayLabel(m.at.slice(0, 10))}
                        </div>
                      )}
                      <div className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
                        {!mine && (
                          <UserAvatar user={userOf(m.userId)} size={28} rounded="rounded-full" />
                        )}
                        <div
                          className={cn(
                            "max-w-[78%] rounded-2xl px-3 py-2 text-sm",
                            mine ? "rounded-br-md bg-brand/20" : "rounded-bl-md bg-secondary/70",
                          )}
                        >
                          {!mine && (
                            <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">
                              {nameOf(m.userId)} · {userOf(m.userId)?.role}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap break-words">
                            {m.text.split(/(@[\p{L}\-']+)/gu).map((part, k) =>
                              part.startsWith("@") ? (
                                <span key={k} className="font-semibold text-gold">
                                  {part}
                                </span>
                              ) : (
                                <span key={k}>{part}</span>
                              ),
                            )}
                          </p>
                          {m.attachments?.map((a) => (
                            <span
                              key={a.name}
                              className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-border bg-background/40 px-2 py-1 text-[11px]"
                            >
                              {a.kind === "Image" ? <ImageIcon className="h-3.5 w-3.5 text-gold" /> : <Paperclip className="h-3.5 w-3.5 text-gold" />}
                              <span className="truncate">{a.name}</span>
                            </span>
                          ))}
                          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                            {m.at.slice(11)}
                            {mine && <span className="text-gold">{m.readBy.length > 1 ? "Lu" : "Envoyé"}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {/* Composer */}
              <div className="border-t border-border p-2">
                {pending.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    {pending.map((a) => (
                      <span
                        key={a.name}
                        className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px]"
                      >
                        {a.name}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setPending((p) => p.filter((x) => x.name !== a.name))}
                        />
                      </span>
                    ))}
                  </div>
                )}
                {emoji && (
                  <div className="mb-1.5 flex flex-wrap gap-1 rounded-xl border border-border bg-secondary/40 p-2">
                    {EMOJIS.map((e) => (
                      <button key={e} type="button" className="text-lg" onClick={() => setText((t) => t + e)}>
                        {e}
                      </button>
                    ))}
                  </div>
                )}
                {mentionOpen && (
                  <div className="mb-1.5 max-h-32 overflow-y-auto rounded-xl border border-border bg-secondary/40 p-1">
                    {mentionCandidates.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setText((t) => t.replace(/@[\p{L}\-']*$/u, `@${c.label} `));
                          setMentionOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs hover:bg-background/60"
                      >
                        <span className="font-semibold text-gold">@{c.label}</span>
                        <span className="truncate text-[10px] text-muted-foreground">{c.role}</span>
                      </button>
                    ))}
                  </div>
                )}
                <form
                  className="flex items-center gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                >
                  <button type="button" onClick={() => setEmoji((v) => !v)} aria-label="Emoji" className="text-muted-foreground hover:text-gold">
                    <Smile className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label="Pièce jointe" className="text-muted-foreground hover:text-gold">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      setPending((p) => [
                        ...p,
                        ...files.map((f) => ({
                          name: f.name,
                          kind: (f.type.startsWith("image/") ? "Image" : "Document") as ChatAttachment["kind"],
                        })),
                      ]);
                      e.target.value = "";
                    }}
                  />
                  <input
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setMentionOpen(/@[\p{L}\-']*$/u.test(e.target.value));
                    }}
                    placeholder="Message… (@ pour mentionner)"
                    className="h-9 min-w-0 flex-1 rounded-full border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-gold/50"
                  />
                  <button
                    type="submit"
                    aria-label="Envoyer"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gradient text-brand-foreground"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
