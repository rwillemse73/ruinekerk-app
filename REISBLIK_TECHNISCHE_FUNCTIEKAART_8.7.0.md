# Reisblik — technische functiekaart 8.7.0

## Doel
Deze kaart beschrijft de functionele bouwstenen van Reisblik en vormt de basis voor toekomstige uitbreidingen en onderhoud.

## Actieve gebruikersfuncties

| Functie | Bestand(en) | Status |
|---|---|---|
| Locaties laden en tonen | `app.js` | Actief |
| GPS / Mijn locatie | `app.js` | Actief |
| Afstand en 500 m / 250 m verhaalzone | `app.js` | Actief |
| Locatie openen en verhaal laden | `app.js` | Actief |
| Bezocht + bezoekdatum/tijd | `visited.js`, `app.js` | Actief |
| Geselecteerde locaties / kaart | `app.js` | Actief |
| Eigen locatie toevoegen/verwijderen | `app.js` | Actief |
| Navigatie | `navigation.js` | Actief |
| Extra informatie toevoegen | `extra-info.js` | Actief |
| Extra informatie bewerken | `extra-info.js` | Actief |
| Spraak naar tekst voor Extra informatie | `extra-info.js` | Actief |
| Mijn reisdag met datumrange | `mijn-reisdag.js` | Actief |
| Mijn reisdag op kaart | `mijn-reisdag.js` | Actief |
| Mijn reisdag DOC-export | `mijn-reisdag.js` | Actief |
| Zoeken | `search.js` | Actief |
| Backup persoonlijke gegevens | `backup.js` | Actief |
| Backup terugzetten | `restore.js` | Actief |
| Lokale gegevens wissen | `clear-local-storage.js` | Actief / testfunctie |
| Naar boven | `ui.js` | Actief |

## Testfuncties — voorlopig behouden

De volgende functies blijven bewust onderdeel van Reisblik:

- Testpositie
- Adres zoeken voor testpositie
- Test-/diagnostiekmogelijkheden
- Alle bestaande ontwikkelgerichte testknoppen

Ze worden niet verwijderd tijdens de schoonmaak zolang ze nodig zijn voor verdere ontwikkeling.

## Persoonlijke opslag

| LocalStorage-key | Betekenis | Beleid 8.7.0 |
|---|---|---|
| `reisblik_visited_v1` | Bezocht + bezoekdatum/tijd | Actief |
| `ruinekerk_extra_simple_v1` | Huidige Extra informatie | Actief |
| `ruinekerk_extra_info_v1` | Oud Extra informatie-formaat | Legacy behouden |
| `ruinekerk_notes_v1` | Oud notitie-/persoonlijk tekstformaat | Legacy behouden |
| `ruinekerk_user_locations_v1` | Eigen locaties | Actief |
| `reisblik_mijn_reisdag_datum` | Oude enkele datum | Compatibiliteit |
| `reisblik_mijn_reisdag_datum_van` | Startdatum reisdag | Actief |
| `reisblik_mijn_reisdag_datum_tm` | Einddatum reisdag | Actief |

## Legacy-opruiming in 8.7.0

### Verwijderd uit de actieve gebruikersinterface
- Oude `extraModal`.
- Oude Note-modal.
- Oude functies `openExtraInfo`, `saveExtraInfo`, `closeExtraInfo` en bijbehorende renderfuncties.
- Oude functies `openNote`, `saveNote`, `closeNote` en bijbehorende renderfuncties.
- Aanroepen van de oude renderfuncties uit `app.js`.
- Niet geladen `js/visited-fixed.js`.
- Niet gebruikte `displayDate()` en `makeTxt()` uit Mijn reisdag.

### Bewust behouden
Oude opslag wordt niet gewist. Backup, restore en zoeken blijven legacy-opslag herkennen. Oude Extra informatie kan bij gebruik van de huidige Extra informatie worden overgenomen naar het huidige opslagformaat zonder dubbele items te maken.

## Ontwerpregel voor volgende versies

Nieuwe functionaliteit wordt toegevoegd aan de bestaande actieve module. Oude code wordt pas verwijderd nadat is vastgesteld dat geen actieve functie er nog van afhankelijk is.

**8.6.9 blijft de referentieversie; 8.7.0 is de schoonmaakversie.**
