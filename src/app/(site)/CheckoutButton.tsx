// Bestelknop: een formulier naar /api/checkout, zodat de knop ook zonder
// JavaScript werkt. De route stuurt door naar Stripe Checkout.
export function CheckoutButton({ className, style, children = "Maak mijn boek" }: { className?: string; style?: React.CSSProperties; children?: React.ReactNode }) {
  return (
    <form action="/api/checkout" method="POST" style={{ display: "contents" }}>
      <button type="submit" className={className} style={style}>
        {children}
      </button>
    </form>
  );
}
