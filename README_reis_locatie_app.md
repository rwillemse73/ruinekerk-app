# Reis locatie app – README

## Versies
- **App: versie 5.1.5**
- **TXT → HTML converter: versie 1.5**

## 1. App – versie 5.1.5

### Alle locaties
Toont de beschikbare locaties en hun locatiegegevens, omschrijving en verhaal.

### Locatie toevoegen
Maakt een nieuwe lokale locatie aan. Je kunt onder andere naam, type, adres, GPS, omschrijving en mijn verhaal invoeren.

Met **📷 Foto toevoegen** kun je ook een foto vanaf de telefoon kiezen. De foto wordt lokaal aan de locatie gekoppeld en passend in de app weergegeven.

### Mijn locatie
Gebruikt de huidige locatie van de telefoon om de positie ten opzichte van de locaties te tonen.

## 2. Onderhouds- en testfuncties

### Nieuwe-lok inlezen
Leest nieuwe locatiebestanden uit de daarvoor bestemde map in.

### Lokale locaties exporteren
Exporteert lokaal aangemaakte locaties naar een TXT-bestand.

Bij een locatie met foto wordt **niet de foto zelf** geëxporteerd. Alleen de bestandsnaam wordt opgenomen, bijvoorbeeld:

```text
photo=huis-ouders.jpg
```

### Testpositie
Voor het testen kan een andere positie worden ingesteld.

Onderdeel hiervan zijn:
- **Testpositie**
- **Adres voor testpositie**
- **Adres zoeken**
- het zoekresultaat
- **📍 Deze locatie gebruiken**

## 3. Foto's

Foto's van lokale locaties worden lokaal aan de locatie gekoppeld.

Bij export wordt alleen de bestandsnaam meegenomen. Hierdoor blijft het TXT-bestand klein.

## 4. TXT → HTML converter – versie 1.5

De converter leest locatieblokken uit een TXT-bestand:

```text
[LOCATION]
...
[/LOCATION]
```

Voor iedere locatie wordt een HTML-bestand gemaakt met onder andere:
- naam
- type
- adres
- GPS-coördinaten
- coördinatenstatus
- omschrijving
- mijn verhaal
- datum van toevoegen

### Foto's in de converter

Als het TXT-bestand bijvoorbeeld bevat:

```text
photo=huis-ouders.jpg
```

dan wordt deze naam in de HTML opgenomen:

```html
<img class="location-photo" src="huis-ouders.jpg">
```

De converter maakt daarnaast een kleine lege JPG-placeholder met exact dezelfde naam:

```text
huis-ouders.html
huis-ouders.jpg
```

De lege JPG kan daarna handmatig worden vervangen door de echte foto. De HTML hoeft dan niet opnieuw gemaakt te worden.

De gegenereerde HTML gebruikt een responsive fotoweergave zodat de foto binnen het beschikbare scherm blijft.

## 5. Workflow

```text
Telefoon
  ↓
Locatie toevoegen
  ↓
eventueel foto kiezen
  ↓
Lokale locatie
  ↓
Lokale locaties exporteren
  ↓
TXT-bestand
  ↓
TXT → HTML converter
  ↓
HTML + lege JPG
  ↓
lege JPG vervangen door echte foto
```

**App en converter zijn afzonderlijke onderdelen.**
