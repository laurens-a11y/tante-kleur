// Bestelknop: een formulier naar /api/checkout, zodat de knop ook zonder
// JavaScript werkt. De route stuurt door naar Stripe Checkout.
export function CheckoutButton({ className, children = "Maak mijn boek" }: { className?: string; children?: React.ReactNode }) {
  return (
    <form action="/api/checkout" method="POST" style={{ display: "contents" }}>
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
