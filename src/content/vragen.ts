// Veelgestelde vragen. De echte vragen staan in Sanity (type "vraag");
// deze lijst geldt alleen als Sanity leeg of onbereikbaar is.
// Placeholders als {levertijd} worden ingevuld vanuit src/config.ts.

export const themas = [
  { id: "boek", titel: "Het boek" },
  { id: "fotos", titel: "Foto's en tekenen" },
  { id: "privacy", titel: "Privacy" },
  { id: "bestellen", titel: "Bestellen en betalen" },
  { id: "levering", titel: "Levering en retour" },
] as const;

export type ThemaId = (typeof themas)[number]["id"];

export type Vraag = { _id: string; vraag: string; antwoord: string; thema: ThemaId; opHomepage?: boolean };

export const standaardVragen: Vraag[] = [
  { _id: "boek-1", thema: "boek", vraag: "Hoe ziet het boek eruit?", antwoord: "Een stevige hardcover op A4-formaat met {kleurplaten} kleurplaten van jouw eigen foto's. Op de cover staat je eigen titel, in de kleur die jij kiest." },
  { _id: "boek-2", thema: "boek", vraag: "Waarmee kan ik erin kleuren?", antwoord: "Kleurpotloden werken het mooist. Stiften en fineliners kunnen ook; leg bij natte stiften voor de zekerheid een vel papier onder de pagina." },
  { _id: "boek-3", thema: "boek", vraag: "Kan ik een eigen titel op de cover zetten?", antwoord: "Ja, die vul je in bij het afrekenen. Denk aan een naam, een plek of een jaartal, bijvoorbeeld Spanje 2025 of Henk & Ingrid." },
  { _id: "fotos-1", thema: "fotos", vraag: "Hoeveel foto's heb ik nodig?", antwoord: "Voor elke kleurplaat één foto, dus {kleurplaten}. Heb je er minder? Laat het Tante weten, dan denken we mee." },
  { _id: "fotos-2", thema: "fotos", opHomepage: true, vraag: "Welke foto's werken het best?", antwoord: "Scherpe foto's met goed licht, waarop gezichten goed te zien zijn. Selfies, portretten, huisdieren en vakantiekiekjes werken prima. Grote groepsfoto's en donkere of wazige foto's minder." },
  { _id: "fotos-3", thema: "fotos", vraag: "Hoe worden de kleurplaten gemaakt?", antwoord: "Tante maakt de kleurplaten met hulp van AI en bekijkt elke plaat voordat je de proef krijgt. Zo blijven de gezichten herkenbaar en de lijnen rustig." },
  { _id: "fotos-4", thema: "fotos", opHomepage: true, vraag: "Kan ik iets laten aanpassen?", antwoord: "Ja. Je krijgt eerst een digitale proef. Is een plaat niet goed gelukt, dan maken we hem opnieuw of kies je een andere foto. Pas na jouw akkoord gaat het boek naar de drukker." },
  { _id: "privacy-1", thema: "privacy", opHomepage: true, vraag: "Wat gebeurt er met mijn foto's?", antwoord: "We gebruiken je foto's alleen om jouw boek te maken. Zodra je boek naar de drukker gaat, verwijderen we ze direct. Zonder jouw toestemming laten we ze nooit aan iemand anders zien." },
  { _id: "privacy-2", thema: "privacy", vraag: "Worden mijn foto's gebruikt om AI te trainen?", antwoord: "Nee. Je foto's worden alleen gebruikt om jouw kleurplaten te maken, niet om AI-modellen te trainen." },
  { _id: "bestellen-1", thema: "bestellen", vraag: "Hoe bestel ik?", antwoord: "Klik op Maak mijn boek, reken af en vul je covertitel in. Daarna stuur je Tante je foto's via de uploadpagina. Binnen een paar dagen krijg je een digitale proef." },
  { _id: "bestellen-2", thema: "bestellen", vraag: "Hoe kan ik betalen?", antwoord: "Het afrekenen loopt via Stripe. Je kiest daar uit de beschikbare betaalmethoden, zoals creditcard en Bancontact. Je betaalgegevens komen niet bij ons terecht." },
  { _id: "bestellen-3", thema: "bestellen", vraag: "Kan ik meerdere boeken bestellen?", antwoord: "Ja, bijvoorbeeld voor beide opa's en oma's. Wil je meer dan tien boeken, bijvoorbeeld voor je team? Kijk dan bij Zakelijk." },
  { _id: "levering-1", thema: "levering", opHomepage: true, vraag: "Hoe lang duurt het?", antwoord: "Na je akkoord op de proef ligt je boek binnen {levertijd} werkdagen bij je thuis. Wil je het voor een verjaardag of feestdag? Bestel dan op tijd." },
  { _id: "levering-2", thema: "levering", vraag: "Tot wanneer kan ik bestellen voor Sinterklaas en kerst?", antwoord: "{deadlines}. Dan heb je tijd voor uploaden, de proef en het drukken." },
  { _id: "levering-3", thema: "levering", vraag: "Bezorgen jullie ook in België?", antwoord: "Ja, we bezorgen in Nederland en België." },
  { _id: "levering-4", thema: "levering", vraag: "Kan ik mijn boek retourneren?", antwoord: "Omdat elk boek speciaal voor jou wordt gemaakt, geldt het herroepingsrecht niet. Komt je boek beschadigd aan of is er iets misgegaan bij het drukken? Dan lossen we het op." },
];
