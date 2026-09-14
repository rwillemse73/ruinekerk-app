# Reisblik 9.8.10 — CHANGELOG

## Correctie automatische slideshow-indeling

De automatische slideshow-indeling is verder robuust gemaakt.

De oriëntatie wordt nu per afzonderlijke foto bepaald. Waar de browser dit ondersteunt, wordt de EXIF-oriëntatie meegenomen via `createImageBitmap(..., { imageOrientation: "from-image" })`. Als dat niet lukt, valt de code terug op `naturalWidth` en `naturalHeight`.

Ondersteunde indelingen blijven:

- 1 foto: één grote foto
- 2 foto's: naast elkaar
- 3 portretfoto's: drie naast elkaar
- 3 landschapsfoto's: twee boven + één grote onder
- 1 portret + 2 landschappen: portret links + twee rechts
- 4 foto's: 2 × 2

De slideshow-navigatie is niet gewijzigd.

De correctie geldt voor de HTML die via `📖 Maak-reis-HTML` wordt gegenereerd.

## Overgenomen

- HTML per dag: alleen dagen met minimaal één Bezocht-item worden geëxporteerd.
- Mobiele knopindeling.
- Help en projectoverdracht.
- Backup/restore ongewijzigd.
