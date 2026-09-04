# Reisblik 8.7.0 — technische schoonmaak

8.7.0 is een opruimversie op basis van de stabiele 8.6.9-referentie. Er is geen nieuwe gebruikersfunctionaliteit toegevoegd.

## Opgeruimd
- Oude actieve UI voor het vroegere Extra informatie-systeem verwijderd.
- Oude Notitie/Belevenis-modal en bijbehorende actieve functies verwijderd uit de app.
- Aanroepen van de oude renderfuncties uit `app.js` verwijderd.
- Niet geladen `js/visited-fixed.js` verwijderd.
- Niet gebruikte `displayDate()` en `makeTxt()` uit Mijn reisdag verwijderd.

## Behouden
- Huidige `➕ Extra informatie` met meerdere items per locatie.
- Bewerken van bestaande extra informatie.
- Microfoon/spraak naar tekst.
- Bezocht + datum/tijd.
- Mijn reisdag met datumrange, kaart en DOC.
- Zoeken.
- Eigen locaties.
- Backup en restore.
- Testfuncties.

## Gegevensbehoud
Bestaande LocalStorage-gegevens worden niet gewist. Oude `ruinekerk_extra_info_v1`-gegevens worden bij gebruik van Extra informatie eenmalig naar `ruinekerk_extra_simple_v1` overgenomen als dezelfde informatie daar nog niet staat. De oude opslag blijft aanwezig zodat backup/restore deze niet verliest.

## Referentie
8.6.9 blijft de onaangetaste terugvalversie.
