# Reisblik 10.0.18

- Praag → Kunst omgezet naar `praag/kunst/kunst.json` op basis van 35 aangeleverde HTML-locaties.
- Praag → Winkels omgezet naar `praag/winkels/winkels.json` op basis van 42 aangeleverde HTML-locaties.
- Tekstparagrafen en locatiegegevens uit `#location-data` behouden in JSON.
- Oorspronkelijke HTML-bestanden blijven staan als reserve.
- Beide JSON-bestanden toegevoegd aan de service-worker app shell.
- Versie bijgewerkt naar 10.0.18.
- `js/app.js` is niet gewijzigd: de bestaande generieke categorie-loader zoekt al naar `<categorie>/<categorie>.json`.
