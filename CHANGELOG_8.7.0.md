# Reisblik 8.7.0

## Technische schoonmaak

8.7.0 is gebaseerd op de werkende 8.6.9 en bevat geen nieuwe gebruikersfunctionaliteit.

### Opgeruimd
- Oude Extra informatie-modal verwijderd.
- Oude notitie-/Belevenis-modal verwijderd.
- Oude render-aanroepen verwijderd uit `app.js`.
- Niet gebruikte `visited-fixed.js` verwijderd.
- Ongebruikte functies uit Mijn reisdag verwijderd.

### Behouden
- Huidige Extra informatie met meerdere items per locatie.
- Bewerken en opslaan.
- Spraak naar tekst.
- Bezocht, GPS, kaart en navigatie.
- Mijn reisdag, datumrange, kaart en DOC.
- Zoeken.
- Backup/restore.
- Eigen locaties.
- Alle testfuncties.

### Gegevensveiligheid
Geen LocalStorage-gegevens worden door deze schoonmaak verwijderd. Legacy-opslag blijft herkenbaar voor backup/restore en zoeken.
