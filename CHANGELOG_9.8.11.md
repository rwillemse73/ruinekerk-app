# Reisblik 9.8.11 — CHANGELOG

## Correctie reis-HTML: geen Japan-specifieke inhoud meer

9.8.11 corrigeert de fout uit 9.8.10 waarbij de oorspronkelijke voorbeeld-HTML niet alleen als structurele inspiratie werd gebruikt, maar ook zichtbare en technische Japan-specifieke namen en voorbeeldteksten in de gegenereerde HTML terechtkwamen.

De gegenereerde `📖 Maak-reis-HTML` en `📚 HTML per dag` zijn vanaf deze versie generiek. De oorspronkelijke voorbeeld-HTML blijft uitsluitend de structurele/opmaakmatige leidraad.

### Wat is gecorrigeerd

- Japan-specifieke zichtbare teksten uit de gegenereerde HTML verwijderd.
- Japan-specifieke voorbeeldlocaties uit de twee standaard-slideshows verwijderd.
- Standaard slideshowteksten zijn nu generiek (`Overige foto's`).
- Technische CSS-klassen, IDs en `data-*`-namen in de gegenereerde HTML zijn generiek gemaakt.
- De interactieve kaart gebruikt generieke namen.
- De navigatie blijft behouden.
- De leesbare HTML-opmaak en inspringing blijven behouden.

## Alle wijzigingen uit de 9.8.7–9.8.10 HTML-reeks blijven behouden

- Automatische slideshow-indeling op basis van het aantal foto's en de oriëntatie.
- 1 foto: één grote foto.
- 2 foto's: naast elkaar.
- 3 portretfoto's: drie naast elkaar.
- 3 landschapsfoto's: twee boven + één grote onder.
- 1 portret + 2 landschappen: portret links + twee landschappen rechts.
- 4 foto's: 2 × 2.
- EXIF-georiënteerde positiebepaling waar mogelijk via `createImageBitmap`.
- Bestaande slideshow-navigatie blijft behouden.
- Bestaande slideshow-dia's worden genormaliseerd naar `slide-fotos` / `slide-foto`.
- Elke `tekst-normaal`-locatie blijft voorzien van de standaard FOTO-PLAATSEN.
- Foto's midden in tekst worden niet verloren.
- HTML per dag maakt alleen bestanden voor dagen waarop minimaal één item als Bezocht is geregistreerd.
- Mobiele knopindeling blijft behouden.
- `👁️ Toon reisdag` blijft behouden.
- `📄 Download DOC` blijft behouden.
- Backup/restore en de bestaande localStorage-structuur zijn niet gewijzigd.

## Belangrijke controle voor 9.8.11

Een gegenereerde reis-HTML mag nergens meer verwijzen naar Japan of Japanse voorbeeldlocaties. De HTML mag uitsluitend de reisgegevens van de geselecteerde bezochte locaties bevatten plus de generieke reisboek-opmaak.
