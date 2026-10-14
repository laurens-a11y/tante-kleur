import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { zorgVoorOrder } from "@/lib/orders";

// Stripe-webhook. Hier gebeurt de orderverwerking, niet op de bedankpagina:
// een klant kan betalen en de pagina nooit zien.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    console.error(`Webhook afgewezen: ${!secret ? "STRIPE_WEBHOOK_SECRET ontbreekt" : "geen stripe-signature header"}`);
    return new Response("Webhook niet geconfigureerd", { status: 400 });
  }

  // Ruwe body is nodig voor de handtekeningcontrole.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error("Ongeldige webhook-handtekening:", error instanceof Error ? error.message : error);
    return new Response("Ongeldige handtekening", { status: 400 });
  }

  console.info(`Webhook ontvangen: ${event.type} (${event.id})`);

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      // Bij uitgestelde betaalmethoden komt 'completed' binnen terwijl er nog
      // niet betaald is; dan wachten we op async_payment_succeeded.
      if (session.payment_status !== "unpaid") {
        try {
          // Maakt de order in Supabase aan en mailt de klant de link naar het boek.
          // Idempotent: dubbele events of de bedankpagina maken geen tweede order.
          const order = await zorgVoorOrder(session, new URL(request.url).origin);
          console.info(`Order klaar voor ${session.id}: ${order?.id ?? "-"}`);
        } catch (error) {
          console.error(`Order aanmaken mislukt voor ${session.id}:`, error instanceof Error ? error.message : error);
          // 500 zodat Stripe het later opnieuw probeert.
          return new Response("Order aanmaken mislukt", { status: 500 });
        }
      }
      break;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      console.warn(`Betaling mislukt voor ${session.id}`);
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
