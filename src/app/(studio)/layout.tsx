// Eigen root-layout voor de Studio: zonder de site-styling, live-updates en JSON-LD.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
