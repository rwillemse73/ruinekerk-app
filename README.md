# Reisblik 7.6.1

Bugfix voor Mijn reisdag DOC-export.

De export gebruikt nu de bestaande `resolveContentUrl()`-logica uit de app
om vaste HTML-bestanden in de juiste categorie-map te vinden. Daarna wordt
de zichtbare tekst uit `article`, `main` of `body` uitgelezen. Technische
elementen en bedieningsknoppen worden uitgesloten.

Daardoor wordt de vaste tekst uit het HTML-bestand opgenomen in het DOC-
document in plaats van `Geen tekst beschikbaar`.
