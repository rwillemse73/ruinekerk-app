# REISBLIK — PROJECTOVERDRACHT 9.8.10

## Stand per 14 september 2026

Actuele ontwikkelversie: **Reisblik 9.8.10**.

Veilige terugvalbasis: **Reisblik 9.8.6**.

## 1. Automatische slideshow-layout

De Japan-stijl HTML-export gebruikt automatische foto-indeling. De oriëntatie wordt per foto bepaald. Waar mogelijk wordt EXIF-oriëntatie verwerkt via `createImageBitmap`; anders gebruikt de code `naturalWidth`/`naturalHeight`.

Ondersteund:

- 1 foto: één grote foto.
- 2 foto's: naast elkaar.
- 3 portretfoto's: drie naast elkaar.
- 3 landschapsfoto's: twee boven en één grote onder.
- 1 portret + 2 landschappen: portret links en twee landschappen rechts.
- 4 foto's: twee boven en twee onder.

De twee slideshows gebruiken dezelfde `slide-fotos` / `slide-foto` structuur en dezelfde navigatie.

## 2. HTML per dag

`📚 HTML per dag` gebruikt de gekozen `van`- en `tot`-periode als zoekvenster, maar maakt uitsluitend bestanden voor kalenderdagen waarop minimaal één locatie of evenement als **Bezocht** is geregistreerd.

Dagen zonder bezoek worden overgeslagen.

Voorbeeld: 1 t/m 3 augustus, met bezoek op 1 en 3 augustus → twee losse HTML-bestanden.

## 3. Mobiele knoppen

Rij 1: `📅 Mijn reisdag` en `📝 Aantekeningen`.

Rij 2: `📅 Agenda`, `🔎 Zoeken` en `❓ Help`.

## 4. Niet gewijzigd

- `👁️ Toon reisdag`
- `📄 Download DOC`
- Backup/restore
- bestaande lokale opslagstructuur

## 5. Testen

Test minimaal:

1. drie echte portretfoto's → drie naast elkaar;
2. drie echte landschapsfoto's → twee boven + één groot onder;
3. één portret + twee landschappen → portret links + twee rechts;
4. vier foto's → 2 × 2;
5. vorige/volgende/sluiten;
6. HTML per dag met een periode waarin sommige dagen geen bezoek hebben.
