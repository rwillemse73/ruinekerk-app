# Reisblik 9.8.8

## 14 september 2026

### Nieuwe / aangepaste functies
- De Japan-stijl HTML-export gebruikt nu de nieuwe automatische slideshow-foto-indeling als standaard voor beide voorbeeld-slideshows.
- Slideshow-indelingen:
  - 1 foto: één grote foto.
  - 2 foto's: naast elkaar.
  - 3 portretfoto's: drie naast elkaar.
  - 3 landschapsfoto's: twee boven en één grote onder.
  - 1 portret + 2 landschappen: portret links en twee landschappen rechts.
  - 4 foto's: twee boven en twee onder.
- De automatische herkenning telt de oriëntatie van alle foto's; de indeling hangt dus niet meer alleen af van de eerste foto.
- Bestaande slideshow-dia's uit een oorspronkelijke Japan-HTML worden bij de export omgezet naar de nieuwe `slide-fotos` / `slide-foto` structuur, zodat de gebruiker daarna alleen nog foto's hoeft te vullen.
- `📚 HTML per dag` blijft beschikbaar en maakt bij een gekozen periode één afzonderlijk HTML-bestand per kalenderdag. Bijvoorbeeld 3 geselecteerde dagen = 3 losse HTML-bestanden.
- De knoppen op het hoofdscherm zijn opgedeeld in twee rijen:
  - rij 1: `📅 Mijn reisdag` en `📝 Aantekeningen`;
  - rij 2: `📅 Agenda`, `🔎 Zoeken` en `❓ Help`.
- Help is bijgewerkt met de werking van `📚 HTML per dag` en de nieuwe knopindeling.
- Projectoverdracht is bijgewerkt met alle wijzigingen van 9.8.8.

### Niet gewijzigd
- Backup/restore en de bestaande persoonlijke localStorage-structuur.
- De bestaande `👁️ Toon reisdag` functie.
- De bestaande `📄 Download DOC` functie.
- De bestaande onderhouds- en testfuncties.
