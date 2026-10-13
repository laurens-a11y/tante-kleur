import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/sanity/client";

// Wordt door Presentation in de Studio aangeroepen. Controleert dat het verzoek
// echt uit een ingelogde Studio-sessie komt en zet dan draft mode aan.
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN || "" }),
});
