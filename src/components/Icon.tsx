// Tante Kleur-iconen uit public/icons (merkset, Laag-namen en metadata verwijderd).
export type IconName =
  | "account" | "akkoord" | "boek" | "cadeau" | "chat" | "favoriet" | "filteren" | "hartje"
  | "home" | "kopen" | "label" | "links" | "menu" | "opslaan" | "rechts" | "sorteren"
  | "streepje" | "toevoegen" | "uitgelicht" | "uploaden" | "verwijderen" | "verzending" | "winkelmandje" | "zoeken";

export function Icon({ name, size = 24, className, style }: { name: IconName; size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/${name}.svg`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain", flex: "none", ...style }}
    />
  );
}
