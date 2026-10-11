# Reisblik 10.0 – ontwikkelomgeving

Dit is een aparte ontwikkelkopie op basis van de master 9.9.52. De huidige productieomgeving hoort niet te worden overschreven.

## GitHub-inrichting
Maak een nieuwe repository, bijvoorbeeld `reisblik-json-proef`, en plaats de **inhoud van deze map** in de hoofdmap van die repository (dus `index.html` direct in de repository-root, niet verstopt in een extra submap).

Activeer daarna GitHub Pages via **Settings → Pages → Deploy from a branch → main → /(root)**.

## Let op: localStorage
GitHub Pages-projectsites van dezelfde gebruiker gebruiken dezelfde origin (`gebruikersnaam.github.io`). Gebruik de testversie daarom in een aparte browser-/privéomgeving of regel een aparte origin voordat je persoonlijke gegevens invoert. De app mag niet worden gebruikt om localStorage leeg te maken als testmethode.

## Eerste doel
Eerst één kleine testvakantie omzetten en valideren. De huidige HTML-bestanden blijven voorlopig bestaan als bron en backup.
