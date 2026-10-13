import { site } from "@/config";

// Veelgestelde vragen voor /vragen, per thema.
// De homepage toont de korte selectie uit Sanity (type "vraag").
export type Thema = { thema: string; vragen: { q: string; a: string }[] };

export const vragenPerThema: Thema[] = [
  {
    thema: "Het boek",
    vragen: [
      {
        q: "Hoe ziet het boek eruit?",
        a: `Een stevige hardcover op A4-formaat met ${site.plates} kleurplaten van jouw eigen foto's. Op de cover staat je eigen titel, in de kleur die jij kiest.`,
      },
      {
        q: "Waarmee kan ik erin kleuren?",
        a: "Kleurpotloden werken het mooist. Stiften en fineliners kunnen ook; leg bij natte stiften voor de zekerheid een vel papier onder de pagina.",
      },
      {
        q: "Kan ik een eigen titel op de cover zetten?",
        a: "Ja, die vul je in bij het afrekenen. Denk aan een naam, een plek of een jaartal, bijvoorbeeld Spanje 2025 of Henk & Ingrid.",
      },
    ],
  },
  {
    thema: "Foto's en tekenen",
    vragen: [
      {
        q: "Hoeveel foto's heb ik nodig?",
        a: `Voor elke kleurplaat één foto, dus ${site.plates}. Heb je er minder? Laat het Tante weten, dan denken we mee.`,
      },
      {
        q: "Welke foto's werken het best?",
        a: "Scherpe foto's met goed licht, waarop gezichten goed te zien zijn. Selfies, portretten, huisdieren en vakantiekiekjes werken prima. Grote groepsfoto's en donkere of wazige foto's minder.",
      },
      {
        q: "Hoe worden de kleurplaten gemaakt?",
        a: "Tante maakt de kleurplaten met hulp van AI en bekijkt elke plaat voordat je de proef krijgt. Zo blijven de gezichten herkenbaar en de lijnen rustig.",
      },
      {
        q: "Wat als een plaat niet goed gelukt is?",
        a: "Je krijgt eerst een digitale proef. Is een plaat niet goed gelukt, dan maken we hem opnieuw of kies je een andere foto. Pas na jouw akkoord gaat het boek naar de drukker.",
      },
    ],
  },
  {
    thema: "Privacy",
    vragen: [
      {
        q: "Wat gebeurt er met mijn foto's?",
        a: "We gebruiken je foto's alleen om jouw boek te maken. Zodra je boek naar de drukker gaat, verwijderen we ze direct. Zonder jouw toestemming laten we ze nooit aan iemand anders zien.",
      },
      {
        q: "Worden mijn foto's gebruikt om AI te trainen?",
        a: "Nee. Je foto's worden alleen gebruikt om jouw kleurplaten te maken, niet om AI-modellen te trainen.",
      },
    ],
  },
  {
    thema: "Bestellen en betalen",
    vragen: [
      {
        q: "Hoe bestel ik?",
        a: "Klik op Maak mijn boek, reken af en vul je covertitel in. Daarna stuur je Tante je foto's via de uploadpagina. Binnen een paar dagen krijg je een digitale proef.",
      },
      {
        q: "Hoe kan ik betalen?",
        a: "Het afrekenen loopt via Stripe. Je kiest daar uit de beschikbare betaalmethoden, zoals creditcard en Bancontact. Je betaalgegevens komen niet bij ons terecht.",
      },
      {
        q: "Kan ik meerdere boeken bestellen?",
        a: "Ja, bijvoorbeeld voor beide opa's en oma's. Wil je meer dan tien boeken, bijvoorbeeld voor je team? Kijk dan bij Zakelijk.",
      },
    ],
  },
  {
    thema: "Levering en retour",
    vragen: [
      {
        q: "Hoe lang duurt het?",
        a: `Na je akkoord op de proef ligt je boek binnen ${site.leadTimeDays} werkdagen bij je thuis.`,
      },
      {
        q: "Tot wanneer kan ik bestellen voor Sinterklaas en kerst?",
        a: site.deadlines.map((d) => `Voor ${d.feest} uiterlijk ${d.datum}`).join(", ") + ". Dan heb je tijd voor uploaden, de proef en het drukken.",
      },
      {
        q: "Bezorgen jullie ook in België?",
        a: "Ja, we bezorgen in Nederland en België.",
      },
      {
        q: "Kan ik mijn boek retourneren?",
        a: "Omdat elk boek speciaal voor jou wordt gemaakt, geldt het herroepingsrecht niet. Komt je boek beschadigd aan of is er iets misgegaan bij het drukken? Dan lossen we het op.",
      },
    ],
  },
];
