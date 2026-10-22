// De prompt waarmee OpenAI een foto omzet naar een tekenplaat (aangeleverd door Tante Kleur).
// "Image 1" is de foto van de klant, "image 2" de goedgekeurde stijlreferentie
// (de selfie op het treinperron). Pas de tekst hier aan; na een deploy wordt hij gebruikt.
// Een eventuele extra instructie per pagina (uit de beheerpagina) komt erachter.

export const tekenplaatPrompt = `Before generating the colouring page, assess whether the source photograph in image 1 provides enough reliable visual information for a recognisable illustration. Assess the source photograph independently of the style reference.
Check:
Sharpness and usable resolution, especially around faces and defining features.
Exposure and contrast: can important forms be distinguished in bright and dark areas?
Motion blur, compression artefacts or noise that obscure essential features.
Visibility of the main subjects, including faces, expressions and poses.
Obstructions or cropping that remove information essential to the intended composition.
Judge suitability for a simplified colouring page, not for a flawless photographic print. Minor noise, an imperfect background or slightly uneven lighting are acceptable when the essential features remain clear. Do not reject a photograph solely because of its pixel dimensions.
If the photograph is suitable, proceed directly with the colouring page instructions below. Keep this assessment internal and return only the finished colouring page.
If essential features are too unclear to preserve likeness reliably, stop before generating. Briefly identify the specific issue and describe the replacement photograph needed. Do not invent facial features, expressions or essential details hidden by blur, darkness, obstruction or cropping. This rejection response overrides the instruction to return only the finished colouring page.
Turn the photograph in image 1 into a clean, recognisable colouring page. Use image 2—the approved colouring page of the selfie on the railway platform—as the primary reference for the drawing style, line quality and balance between detail and open colouring areas. Apply that style to the photograph; do not copy the people or setting from the reference.
Create a portrait A4 composition with an exact width-to-height ratio of 210:297. Preserve the people’s likeness, expressions, poses, proportions and relationships, together with the key elements that make the original setting recognisable. Adapt the framing gently where necessary without distorting people or cropping important features.
Use pure black linework on a pure white background. All drawn lines must be clearly black and strong enough to remain visible when printed at A4 size. Avoid grey or pale lines, faint hairline strokes, shading, gradients, cross-hatching and texture used to represent light or shadow. Keep areas intended for colouring white.
Keep the linework calm, clean and deliberate. Use only subtle variation in line thickness: outer contours may be slightly stronger than internal details, but the overall drawing should feel consistent. Avoid dramatic differences between thick outlines and very thin detail lines.
Simplify details selectively while preserving recognisability:
Faces and skin: retain the essential features that convey likeness and expression. Keep cheeks, foreheads, necks and other skin areas mostly open. Do not trace every wrinkle, crease, skin texture or photographic shadow into a line. Preserve age and character without excessive facial detail.
Hair: describe the hairstyle with flowing locks and larger sections. Avoid drawing every individual strand or creating dense tangles of small lines.
Clothing: retain the silhouette, important seams and a few defining folds. Simplify intricate patterns, fabric textures and minor creases.
Background: retain the main shapes and distinctive elements of the location. Reduce small objects and repetitive details so the people remain the focus.
Create generous, comfortable colouring areas. Avoid excessive tiny enclosed shapes, crowded linework and large solid-black areas. Simplification should come from removing unnecessary lines, not from making them lighter or thinner.
The finished page should feel like a carefully drawn illustration of the original photograph, with natural, recognisable people and a clear sense of the moment. Match the reference’s overall visual character while applying the calmer detail treatment described above.
Return only the finished colouring page, without text, captions, borders, watermarks or a mockup.`;

// Korte prompt voor methode B (rechtstreeks naar het beeldmodel, geen regisseur).
// Beeldmodellen volgen een korte opdracht met een duidelijke rangorde beter dan
// een lange lijst gelijkwaardige regels; daarom staan de belangrijkste eisen bovenaan.
export const tekenplaatPromptDirect = `Create a colouring page from image 1 (a photograph), drawn in the style of image 2 (an approved colouring page).

MOST IMPORTANT
1. Clean black outlines on a pure white background. No shading, hatching, stippling, cross-hatching, texture, grey tones, gradients or solid black areas.
2. The people (and animals) are the clear focus and must stay recognisable: same faces, expressions, hairstyles, clothing, poses and positions as in the photograph.
3. Radically simplify everything else. Suggest the setting with a few large, simple shapes only. Leave ground, paths, sky, walls and water mostly empty white. Draw trees as simple outlines without bark texture, and foliage as a few large leaf shapes, never hundreds of small ones.
4. Large, closed colouring areas: close all contours and avoid tiny enclosed shapes.

STYLE (from image 2)
Calm, confident lines of even medium weight, outer contours slightly bolder. Faces and hair with the same level of detail as image 2; nothing in the picture more detailed than image 2. Do not copy the people or setting from image 2.

FORMAT
Portrait page. Keep faces, hands and other important features well away from every edge; only background may run off the page. No text, border, signature or watermark.`;

// Methode D: werkwijze van ChatGPT nagebootst in twee stappen. Eerst schrijft het
// taalmodel (met de regels van tekenplaatPrompt) één beeldopdracht specifiek voor
// déze foto, daarna gaat die opdracht letterlijk naar het beeldmodel.
// Het voorbeeld is de opdracht die ChatGPT zelf schreef voor de bosfoto (okt 2026).
// Hoe de regisseur een beeldopdracht voor één foto schrijft (gedeeld door methode D/E/F
// en de nieuwe analysestap).
const schrijfRegels = `How to write the prompt (this is what makes the result good):
- Start by describing in a few words what image 1 actually shows (who, what they do, the setting) and name the specific elements that must be preserved for recognisability (faces or rear views, poses, clothing, held objects, key landmarks).
- State that image 2 is ONLY the line-illustration style reference and must never be copied (no people, no setting from it).
- State the outcome of the suitability check in one sentence and what not to invent (e.g. hidden faces).
- Translate the house rules into concrete instructions for THIS photograph: say exactly which dense parts of this scene to simplify and how (e.g. "omit most tiny twigs and bark lines", "forest floor a few larger leaf shapes with ample white space, no carpet of tiny leaves"), and what to keep to preserve depth and the sense of place.
- Include the fixed requirements: portrait A4 exact aspect ratio 210:297; pure black clear printable lines on pure white; no shading, hatching, gradients, stippling, photographic texture or solid black areas; all colouring regions white; generous closed colouring shapes; keep important features away from the edges; return only the illustration, full bleed, no border, text, captions, watermark or mockup.

Example of an excellent prompt (for a different photograph, two girls walking in a wood):
"Turn image 1 (two young girls seen from behind walking hand in hand on a winding woodland path, left girl dragging a long forked branch) into a recognisable printable colouring page. Image 2 is ONLY the line illustration style reference, never copy its people or railway setting. Source photo is suitable: girls intentionally face away; preserve rear view, do not invent faces. Preserve their poses, silhouettes, joined hands, clothing, boots, hairstyles, long trailing branch, and the curved woodland path and prominent tree trunks. Portrait A4 exact aspect ratio 210:297. Pure black clear printable lines on pure white. Calm deliberate contours, subtle variation in line thickness, no faint thin grey details. No shading, hatching, gradients, stippling, photographic texture or solid black filled clothing. All colouring regions white. Hair in larger flowing locks, few defining clothing folds. Greatly simplify the very dense woodland: main trunks and selected branching shapes convey the original location, omit most tiny twigs and bark lines; forest floor a few larger leaf shapes and groups with ample white spaces, no carpet of tiny detailed leaves. Keep depth and recognisable natural scene. Retain original composition with girls in lower middle and tall trees above; adapt gently to A4 without distortion or losing shoes or trailing branch. Match reference's clean natural illustration character with calmer detail treatment and generous comfortable colouring shapes. Return only illustration, full bleed scene without border, text, captions, watermark or mockup."

`;

export const regieOpdracht = `You are preparing an image-generation request. Do NOT draw anything yourself; reply with text only.

Follow the house rules below (written for the illustrator) to do two things:
1. Assess whether the source photograph (image 1) is suitable, using the assessment rules. If it is not suitable, reply with exactly "AFGEKEURD:" followed by a short explanation of the specific problem and the replacement photograph needed. Nothing else.
2. If it is suitable, write ONE prompt for the image model that turns image 1 into a colouring page. Reply with only that prompt, in English, roughly 150–300 words, one paragraph.

` + schrijfRegels + `HOUSE RULES:
`;

// Analysestap (los van het tekenen): beoordeelt de foto en schrijft de tekenbriefing,
// als JSON zodat de code het resultaat kan opslaan. Daarna gaat de briefing met foto
// en stijlreferentie naar de tekenstap.
export const analyseOpdracht = `You are preparing an image-generation request. Do NOT draw anything yourself.

Follow the house rules below (written for the illustrator) to do two things:
1. Assess whether the source photograph (image 1) is suitable, using the assessment rules.
2. If it is suitable, write ONE prompt for the image model that turns image 1 into a colouring page, in English, roughly 150–300 words, one paragraph.

Reply as JSON with these fields:
- "geschikt": true if the photograph is suitable, otherwise false.
- "reden": if not suitable, a short explanation in Dutch of the specific problem and the replacement photograph needed; otherwise an empty string.
- "beeldprompt": the prompt for the image model if suitable; otherwise an empty string.

` + schrijfRegels + `HOUSE RULES:
`;

