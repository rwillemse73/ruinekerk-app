# Reisblik 8.7.2 — functionele diagnose

Basis: 8.6.9 / 8.7.1. Doel: reparatie van Nieuwe locatie → Opslaan zonder andere functies te wijzigen.

## Gecontroleerd
- JavaScript syntax: alle JS-bestanden
- `saveNewLocation()` aanwezig
- `pendingGeocode` validatie aanwezig
- fallback voor ontbrekende foto-helper aanwezig
- LocalStorage opslag via `getUserLocations()` / `setUserLocations()`
- toevoeging aan runtime `locations`
- marker redraw
- render en kaartfocus
- testfuncties behouden
- UI cacheversies op 8.7.2

## Belangrijke reparatie
Opslaan is niet langer afhankelijk van het bestaan van `window.__locationPhoto`. Als de optionele foto-helper niet geladen is, wordt zonder foto opgeslagen.

Daarnaast geeft Opslaan een duidelijke melding wanneer nog geen GPS/adrespositie is gekozen.

8.6.9 blijft de referentieversie.
