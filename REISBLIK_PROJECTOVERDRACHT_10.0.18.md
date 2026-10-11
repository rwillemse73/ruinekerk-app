# Reisblik 10.0.18 — projectoverdracht

## Basis
Gebaseerd op de ontwikkelversie 10.0.17.

## JSON-datasets toegevoegd
- `praag/kunst/kunst.json`: 35 locaties, overgenomen uit de aangeleverde `kunst.zip`.
- `praag/winkels/winkels.json`: 42 locaties, overgenomen uit de aangeleverde `winkels.zip`.

Per locatie zijn de velden uit `#location-data` behouden en zijn de paragrafen uit `<article>` opgeslagen in `contentParagraphs`. De oorspronkelijke HTML-bestanden blijven beschikbaar als reserve.

## Code
`js/app.js` is niet gewijzigd. De bestaande categorie-loader zoekt generiek naar `<actieve-data-root>/<categorie>/<categorie>.json`. De service worker is bijgewerkt om beide JSON-bestanden in de app-shell te cachen.

## Let op
De bestaande exportfunctie `js/update-json-export.js` is nog steeds primair gericht op de horeca-pilot. Deze release zet Kunst en Winkels om voor het laden/weergeven; generieke bewerkings- en exportondersteuning voor alle categorieën moet afzonderlijk getest/uitgebreid worden.
