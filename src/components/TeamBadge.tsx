import { pickTeamColor, initialsFor } from "@/lib/teamBadge";

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-12 w-12 text-lg",
} as const;

export function TeamBadge({
  name,
  crestUrl,
  size = "sm",
}: {
  name: string;
  crestUrl?: string | null;
  size?: keyof typeof sizeClasses;
}) {
  if (crestUrl) {
    // Decorative: every call site already shows the team name as visible
    // text right next to the badge, so an alt here would just repeat it.
    // Plain <img>, not next/image: crestUrl is an arbitrary user-supplied
    // host, not worth a remotePatterns allowlist for a small inline icon.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={crestUrl}
        alt=""
        className={`${sizeClasses[size]} shrink-0 rounded-full object-cover`}
      />
    );
  }

  const color = pickTeamColor(name);
  return (
    <span
      className={`flex ${sizeClasses[size]} shrink-0 items-center justify-center rounded-full font-bold`}
      style={{ backgroundColor: `${color}26`, color }}
      aria-hidden="true"
    >
      {initialsFor(name)}
    </span>
  );
}
