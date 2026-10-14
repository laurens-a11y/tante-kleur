import { site } from "@/config";

// Tekst uit Sanity waarin {email} al is ingevuld: maakt het e-mailadres klikbaar.
export function MetMailLink({ tekst }: { tekst: string }) {
  const delen = tekst.split(site.email);
  return (
    <>
      {delen.map((deel, i) => (
        <span key={i}>
          {i > 0 && <a href={`mailto:${site.email}`}>{site.email}</a>}
          {deel}
        </span>
      ))}
    </>
  );
}
