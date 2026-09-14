# Reisblik 9.8.8 — MASTER

## Status

Reisblik 9.8.8 is de actuele werkende versie na de wijzigingen van 14 september 2026.

De veilige terugvalbasis blijft Reisblik 9.8.6.

## Belangrijkste wijzigingen

### Hoofdscherm
De gebruikersknoppen zijn op mobiel overzichtelijk verdeeld:

- rij 1: Mijn reisdag + Aantekeningen
- rij 2: Agenda + Zoeken + Help

### Japan-stijl HTML
De gegenereerde Japan-stijl HTML bevat de nieuwe automatische slideshow-layout. De gebruiker hoeft bij een nieuwe dia alleen een `slide` te kopiëren en 1 t/m 4 foto's in `slide-fotos` te plaatsen.

Ondersteunde combinaties:

- 1 foto
- 2 foto's naast elkaar
- 3 portretten naast elkaar
- 3 landschappen: twee boven + één groot onder
- 1 portret + 2 landschappen: portret links + twee rechts
- 4 foto's: 2 × 2

Bestaande slideshow-dia's uit een oorspronkelijke Japan-HTML worden tijdens export naar deze structuur genormaliseerd.

### HTML per dag
Via Mijn reisdag → `📚 HTML per dag` wordt voor iedere kalenderdag binnen de gekozen periode een afzonderlijk HTML-bestand gemaakt.

Voorbeeld: 1 augustus t/m 3 augustus = 3 losse HTML-bestanden.

## Veilige basis

`Reisblik_9.8.6_VOLLEDIGE_MASTER.zip` blijft de ongewijzigde terugvalbasis.
