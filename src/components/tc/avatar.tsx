/**
 * Avatars premium Texas Chicken : photos réelles pour les utilisateurs et les
 * groupes, avec repli sur les initiales et indicateur de présence.
 */
import { cn } from "@/lib/utils";
import { initialsOf, isOnline, userPhoto } from "@/lib/tc/people";

export interface AvatarUser {
  id: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
}

export function UserAvatar({
  user,
  size = 36,
  presence = false,
  className,
  rounded = "rounded-xl",
}: {
  user: AvatarUser | undefined | null;
  size?: number;
  presence?: boolean;
  className?: string;
  rounded?: string;
}) {
  const online = user ? isOnline(user.id) && user.status !== "Inactif" : false;
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }}>
      <span
        className={cn(
          "grid h-full w-full place-items-center overflow-hidden border border-border/70 bg-brand-gradient font-display font-bold text-brand-foreground",
          rounded,
        )}
        style={{ fontSize: Math.max(10, size * 0.34) }}
      >
        {user ? (
          <img
            src={userPhoto(user)}
            alt={`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Utilisateur"}
            loading="lazy"
            width={size}
            height={size}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          initialsOf(user)
        )}
      </span>
      {presence && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background",
            online ? "bg-success" : "bg-muted-foreground",
          )}
          style={{ width: Math.max(8, size * 0.28), height: Math.max(8, size * 0.28) }}
          aria-label={online ? "En ligne" : "Hors ligne"}
        />
      )}
    </span>
  );
}

/** Avatar de groupe : photo réaliste ou dégradé hérité. */
export function GroupAvatar({
  avatar,
  name,
  size = 44,
  className,
  rounded = "rounded-xl",
}: {
  avatar?: string;
  name?: string;
  size?: number;
  className?: string;
  rounded?: string;
}) {
  const isGradient = !avatar || avatar.startsWith("linear-gradient");
  return (
    <span
      className={cn("relative inline-block shrink-0 overflow-hidden border border-border/70", rounded, className)}
      style={{ width: size, height: size, background: isGradient ? avatar : undefined }}
    >
      {!isGradient && (
        <img
          src={avatar}
          alt={name ?? "Groupe"}
          loading="lazy"
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      )}
    </span>
  );
}
