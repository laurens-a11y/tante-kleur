import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

// Stripe-webhook. Hier gebeurt de orderverwerking, niet op de bedankpagina:
// een klant kan betalen en de pagina nooit zien.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
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

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      // Bij uitgestelde betaalmethoden komt 'completed' binnen terwijl er nog
      // niet betaald is; dan wachten we op async_payment_succeeded.
      if (session.payment_status !== "unpaid") {
        await fulfillOrder(session);
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

async function fulfillOrder(session: Stripe.Checkout.Session) {
  const coverTitel = session.custom_fields?.find((f) => f.key === "cover_titel")?.text?.value;

  // TODO (fase 2): order opslaan in de database (idempotent op session.id),
  // bevestigingsmail met uploadlink sturen en de order klaarzetten voor productie.
  // Concierge-MVP: de order staat in het Stripe Dashboard; dit logregel helpt bij controle.
  console.info(
    `Nieuwe order ${session.id}: ${session.amount_total} ${session.currency}, ` +
      `titel "${coverTitel ?? "-"}", land ${session.collected_information?.shipping_details?.address?.country ?? "-"}`,
  );
}
