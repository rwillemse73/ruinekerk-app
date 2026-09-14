# REISBLIK — PROJECTOVERDRACHT 9.8.11

## Stand per 14 september 2026

Actuele ontwikkelversie: **Reisblik 9.8.11**.

Veilige terugvalbasis: **Reisblik 9.8.6**.

## 1. Belangrijkste correctie

In 9.8.10 bleek dat de HTML-export nog zichtbaar en technisch naar Japan verwees. Dat was niet de bedoeling: de oorspronkelijke Japan-HTML mocht alleen als structureel voorbeeld worden gebruikt.

9.8.11 maakt de export generiek. Japan-specifieke teksten, voorbeeldlocaties en technische `japan-*` namen zijn uit de actieve HTML-generator verwijderd.

## 2. HTML-opmaak die behouden blijft

De leesbare reisboek-/tijdschriftopmaak blijft behouden, inclusief:

- chronologische bezochte locaties;
- locatiekoppen en bestaande teksten;
- zichtbare FOTO-PLAATSEN op oorspronkelijke fotoposities;
- twee standaard-slideshowtegels;
- twee slideshow-dialogen;
- `slide` / `slide-fotos` / `slide-foto` structuur;
- vorige, volgende en sluiten;
- interactieve kaart bovenaan;
- vorige/volgende pagina-knoppen onderaan;
- knop Naar boven.

## 3. Automatische slideshow-layout

De oriëntatie wordt per foto bepaald. Waar mogelijk wordt EXIF-oriëntatie gelezen via `createImageBitmap(..., { imageOrientation: "from-image" })`; anders gebruikt de code `naturalWidth` en `naturalHeight`.

Ondersteund:

- 1 foto: één grote foto;
- 2 foto's: naast elkaar;
- 3 portretfoto's: drie naast elkaar;
- 3 landschapsfoto's: twee boven + één grote onder;
- 1 portret + 2 landschappen: portret links + twee landschappen rechts;
- 4 foto's: 2 × 2.

De slideshow-navigatie is niet gewijzigd.

## 4. HTML per dag

`📚 HTML per dag` gebruikt de gekozen periode als zoekvenster, maar maakt alleen bestanden voor kalenderdagen waarop minimaal één item als **Bezocht** is geregistreerd. Dagen zonder bezoek worden overgeslagen.

## 5. Mobiele knoppen

De huidige indeling blijft behouden:

- rij 1: `📅 Mijn reisdag` en `📝 Aantekeningen`;
- rij 2: `📅 Agenda`, `🔎 Zoeken` en `❓ Help`.

## 6. Niet gewijzigd

- `👁️ Toon reisdag`
- `📄 Download DOC`
- Backup/restore
- bestaande localStorage-structuur
- Eigen locatie bewerken

## 7. Testplan

1. Maak een reis-HTML met echte bezochte locaties.
2. Controleer dat de gegenereerde broncode nergens Japan-specifieke inhoud of namen bevat.
3. Controleer de twee slideshow-dialogen.
4. Test 1, 2, 3 en 4 foto's.
5. Test 3 portretten, 3 landschappen en 1 portret + 2 landschappen.
6. Test vorige/volgende/sluiten.
7. Test HTML per dag met lege dagen tussen bezochte dagen.
8. Test `👁️ Toon reisdag` en `📄 Download DOC`.
9. Controleer backup/restore.
