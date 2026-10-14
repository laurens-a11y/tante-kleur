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
