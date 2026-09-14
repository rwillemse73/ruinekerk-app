# Reisblik 9.8.9 — MASTER

## Status

Reisblik 9.8.9 is de actuele werkende versie na de correctie van 14 september 2026.

De veilige terugvalbasis blijft Reisblik 9.8.6.

## Wijziging 9.8.9

### HTML per dag
Via Mijn reisdag → `📚 HTML per dag` worden alleen dagen geëxporteerd waarop binnen de gekozen periode daadwerkelijk minimaal één locatie of evenement als **Bezocht** is geregistreerd.

Dagen zonder bezoek worden overgeslagen.

Voorbeeld:
- Datum van: 1 augustus 2026
- Datum t/m: 3 augustus 2026
- Bezocht op 1 en 3 augustus
- resultaat: 2 losse HTML-bestanden, voor 1 en 3 augustus

Er wordt dus nooit meer een leeg HTML-bestand gemaakt voor een dag zonder bezochte inhoud.

## Overgenomen uit 9.8.8

- automatische slideshow-layout voor 1 t/m 4 foto's;
- beide slideshows gebruiken dezelfde nieuwe foto-structuur;
- mobiele hoofdknoppen overzichtelijk verdeeld;
- `📚 HTML per dag`;
- Help en projectoverdracht;
- backup/restore ongewijzigd.

## Veilige basis

`Reisblik_9.8.6_VOLLEDIGE_MASTER.zip` blijft de ongewijzigde terugvalbasis.
