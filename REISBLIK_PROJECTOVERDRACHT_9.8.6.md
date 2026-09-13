# REISBLIK — PROJECTOVERDRACHT / STARTPUNT NIEUWE CHAT
## Stand per 11 september 2026 — versie 9.8.6

### Nieuwe functie in 9.8.6: 📝 Aantekeningen
- De knop **📝 Aantekeningen** staat bij de gebruikersfuncties en werkt voor de actieve vakantie/context.
- Losse aantekeningen worden lokaal opgeslagen onder `reisblik_aantekeningen_v1__<vakantie-id>`.
- Een aantekening krijgt automatisch datum en tijd en kan later worden verwijderd.
- Aantekeningen zijn bewust niet gekoppeld aan locaties of evenementen.
- **Backup content** neemt de aantekeningen mee per vakantie.
- **Backup terugzetten** herstelt de aantekeningen per vakantie.
- De Help in `index.html` beschrijft de nieuwe functie.
- `js/aantekeningen.js` is toegevoegd en aan de service-worker app-shell toegevoegd.

### Nieuwe functie in 9.8.6: Aantekeningen
- **📝 Aantekeningen** is een aparte plek voor losse teksten die niet aan een locatie of evenement gekoppeld zijn.
- De aantekeningen worden lokaal per actieve vakantie/context opgeslagen.
- Ze worden opgenomen in **Backup content** en kunnen per vakantie worden teruggezet met **Backup terugzetten**.
- De Help in `index.html` is aangepast.

Gebruik dit document als overdracht wanneer dit project later in een nieuwe ChatGPT-chat wordt voortgezet.

De actuele softwarebasis is **Reisblik 9.8.6 – VOLLEDIGE MASTER**.

---

# 1. HUIDIGE STATUS

Reisblik is een locatie-/reisinfo-webapp die op GitHub Pages draait.

De actuele veilige software-master is:

**Reisblik 9.8.6 – VOLLEDIGE MASTER**

De versie 9.7.21 is opgebouwd vanuit de eerder werkende 9.3.1-basis en bevat daarna de gerichte Mijn reisdag/HTML-ontwikkelingen van 9.7.4 t/m 9.7.21.

**9.8.6 is het huidige veilige referentiepunt.**

Niet rechtstreeks terugvallen op 9.3.1, 9.2.6 of oudere versies als bouwbasis. Die blijven historische/stabiele backups.

Belangrijk uitgangspunt:
- bestaande werkende functies behouden;
- kleine, gerichte wijzigingen;
- versie bij iedere wijziging verhogen;
- eerst de actuele master/code controleren;
- alleen werkelijk gewijzigde bestanden vervangen;
- na iedere wijziging live testen op desktop én Android wanneer de wijziging mobiel relevant is;
- altijd de volledige master kunnen terugvinden.

---

# 2. VEILIG BEWAREN

Bewaar samen:

1. **Reisblik_9.8.6_VOLLEDIGE_MASTER.zip**
   - actuele volledige software-master;
   - veilige basis voor vervolgontwikkeling.

2. De daadwerkelijke inhoudsmappen van de GitHub-app, waaronder:
   - `trekvogelpad/`
   - `argentinie-chili/`
   - `evenement-2026/`

3. Een eventuele browserbackup van lokale gegevens via de ingebouwde Backup-functie.

BELANGRIJK:
De software-master en persoonlijke localStorage-gegevens zijn twee verschillende zaken. Een nieuwe master vervangt niet automatisch persoonlijke gegevens.

---

## 2A. ACTUELE VEILIGE SOFTWAREMASTER

De actuele volledige master is:

`Reisblik_9.8.6_VOLLEDIGE_MASTER.zip`

Deze master bevat alle huidige wijzigingen tot en met 9.7.21.

**De volgende ontwikkeling moet vanaf 9.7.21 beginnen**, met een nieuw versienummer, bijvoorbeeld 9.7.22.

---

# 3. GITHUB / APP

De app staat op GitHub Pages:

https://rwillemse73.github.io/ruinekerk-app/

De gebruiker werkt rechtstreeks met GitHub Pages en test meestal direct op Android/telefoon en desktop.

Werkwijze:
- kleine, gerichte wijzigingen
- elke wijziging krijgt een nieuw versienummer
- werkende functionaliteit mag niet verdwijnen
- eerst de actuele master/code controleren voordat een nieuwe versie wordt gebouwd
- bij voorkeur slechts de werkelijk gewijzigde bestanden vervangen
- alleen gewijzigde bestanden vervangen
- oude stabiele versies bewaren
- na iedere wijziging daadwerkelijk testen in de live app
- niet alleen controleren of code statisch aanwezig is

---

# 4. BELANGRIJKE ARCHITECTUUR

Reisblik werkt met een centrale vakantie-/contextarchitectuur.

De actieve context wordt gekozen via een dropdown bovenaan.

Huidige contexten:

## Trekvogelpad
ID:
`trekvogelpad`

Zichtbare naam:
`Trekvogelpad`

## Argentinië & Chili
ID:
`argentinie-chili`

Zichtbare naam:
`Argentinië & Chili`

## Evenementen 2026
ID:
`evenement-2026`

Zichtbare naam:
`Evenementen 2026`

---

# 5. EVENEMENTEN 2026

Dit is bewust een bijzondere context.

Het is géén gewone vakantie met vaste HTML-locaties.

De structuur is uitsluitend:

```text
evenement-2026/
└── agenda/
    └── agenda.json
```

Dus:
- geen vaste HTML-locaties
- geen kunst-map
- geen winkels-map
- geen horeca-map
- geen locaties-map nodig

Evenementen 2026 gebruikt wel dezelfde centrale contextarchitectuur en dezelfde lokale gegevensscheiding als de andere contexten.

De bedoeling is dat hierin losse evenementen voor 2026 worden verzameld.

---

# 6. AGENDA.JSON — VASTE AFSPRAAK

Voor alle contexten wordt hetzelfde JSON-formaat gebruikt.

Alleen de doelmap verschilt.

Trekvogelpad:
```text
trekvogelpad/agenda/agenda.json
```

Evenementen 2026:
```text
evenement-2026/agenda/agenda.json
```

## Vast formaat

```json
{
  "formatVersion": "1.0",
  "sourceFile": "agenda.json",
  "createdAt": "YYYY-MM-DD",
  "description": "Evenementen voor Reisblik",
  "events": [
    {
      "id": "unieke-id",
      "name": "Naam van het evenement",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "endTime": "HH:MM",
      "location": "Naam evenementlocatie",
      "lat": 0.000000,
      "lon": 0.000000,
      "type": "Type evenement",
      "organizer": "Organisator",
      "price": "Prijsinformatie",
      "description": "Korte feitelijke beschrijving",
      "source": "Bron",
      "eventUrl": "",
      "sourceUrl": "",
      "image": "",
      "reisblikMatch": true,
      "matchReasons": []
    }
  ]
}
```

CRUCIAAL:
De array heet **`events`**, niet `evenementen`.

## Werkwijze Weekagenda

1. Eerst onderzoek doen.
2. Eerst een leesbare kandidatenlijst maken.
3. De gebruiker controleert/corrigeert die lijst.
4. Pas na expliciete goedkeuring de definitieve `agenda.json` maken.
5. Alleen definitief goedgekeurde evenementen komen in `agenda.json`.
6. Geen gegevens verzinnen.
7. GPS zo betrouwbaar mogelijk bepalen.
8. Bij twijfel over GPS niet gokken.
9. `source` / `sourceUrl` en eventueel `eventUrl` correct vastleggen.

Dit geldt voor zowel Trekvogelpad als Evenementen 2026.

---

# 7. AGENDA IN DE APP

Agenda is lokaal gescheiden per actieve context.

De agenda-import leest voor de actieve context:

```text
<actieve-context>/agenda/agenda.json
```

Er is verschil tussen:
- geïmporteerde kandidaten
- evenementen die de gebruiker permanent heeft opgeslagen in Mijn agenda

Importeren verandert niet automatisch de permanente agenda.

De agenda heeft onder andere:
- nieuwe evenementen importeren
- bewaren in Mijn agenda
- verwijderen uit Mijn agenda
- deduplicatie
- stabiele IDs
- archiveren van afgelopen evenementen
- bescherming tegen verwijderen van bezochte evenementen
- evenementen zichtbaar als categorie op de kaart

De oude Ticketmaster-koppeling is verwijderd.

---

# 8. LOKALE GEGEVENS

Persoonlijke gegevens worden in localStorage bewaard.

Belangrijke oorspronkelijke keys waren onder andere:

```text
reisblik_visited_v1
ruinekerk_extra_info_v1
ruinekerk_extra_simple_v1
ruinekerk_notes_v1
ruinekerk_user_locations_v1
reisblik_mijn_reisdag_datum
reisblik_mijn_reisdag_datum_van
reisblik_mijn_reisdag_datum_tm
reisblik_agenda_evenementen_v1
```

In de huidige architectuur worden deze waar nodig per vakantie/context gescheiden met:

```text
__<context-id>
```

Voorbeeld:

```text
reisblik_visited_v1__trekvogelpad
reisblik_visited_v1__argentinie-chili
```

Daardoor kunnen gegevens van verschillende contexten naast elkaar bestaan.

Bij wisselen van context hoort alleen de actieve context gebruikt te worden.

---

# 9. BEZOCHT

Bezocht is contextgebonden.

De gebruiker heeft getest dat een locatie die in de ene context bezocht is niet zomaar als bezocht in een andere context verschijnt.

---

# 10. MIJN REISDAG

Mijn reisdag werkt contextgebonden.

De functie bevat nu meerdere export-/weergavemogelijkheden. De huidige knoppen zijn:

```text
📄 Download DOC
📖 Maak-reis-HTML
👁️ Toon reisdag
🗺️ Toon op kaart
```

## 10A. Download DOC

- `📄 Download DOC` blijft de bewezen werkende browser-/Word-compatibele `.doc`-export.
- De bestaande Word-export is behouden.
- Eigen locatie-foto's kunnen worden meegenomen.
- De bestaande exportlogica is niet verwijderd tijdens de latere HTML-ontwikkelingen.

## 10B. Maak-reis-HTML

`📖 Maak-reis-HTML` is de nieuwe naam van de Japan-stijl HTML-export.

De oudere knop `HTML maken` is verwijderd.

De export maakt een zelfstandige HTML-pagina op basis van de geselecteerde bezochte locaties en gebruikt daarbij de **oorspronkelijke Japan HTML als structureel voorbeeld**.

Belangrijke kenmerken:

- locaties chronologisch;
- de locatie krijgt als eerste `<h2>` de naam van de bezochte locatie;
- bestaande tekst blijft behouden;
- foto's zelf worden niet gekopieerd;
- iedere oorspronkelijke foto wordt vervangen door een zichtbare `FOTO-PLAATS`;
- de foto-plaats blijft zoveel mogelijk op de oorspronkelijke plek staan;
- breedte, hoogte, float en relevante inline-opmaak worden zoveel mogelijk behouden;
- foto's die midden in een `tekst-normaal`-blok of zelfs midden in een `<p>` staan, worden ook meegenomen;
- foto-indelingen zoals links/rechts, naast elkaar, onder elkaar en rechterkolommen blijven behouden;
- de broncode van de gegenereerde HTML is leesbaar en ingesprongen.

### Japan-template

De Japan-export volgt zoveel mogelijk de oorspronkelijke structuur met onder andere:

```text
hoofdtekst
top-fotobalk
indeling-kolommen
tekst-bij-elkaar
tekst-normaal
foto-naast
rechter-kolom
foto-onder
slideshow-container
slide
text-slide
```

De bedoeling is nadrukkelijk **niet** om een geheel nieuwe HTML-layout te verzinnen, maar om de oorspronkelijke Japan-indeling als vaste template te gebruiken.

### Foto 1 / kaart

In de eerste fotoplaats bovenaan wordt de interactieve kaart opgenomen met de bezochte locaties.

De overige fotoplaatsen bovenaan blijven beschikbaar voor foto's.

### Diavoorstellingen

Onderaan **kolom 1** en onderaan **kolom 3** staan de twee diavoorstellingen.

Deze gebruiken de oorspronkelijke Japanse opzet met:

- `ochtend-middag`
- `middag-avond`
- vorige/volgende knoppen
- sluitknop
- tekst-dia's
- meerdere foto-indelingen
- zichtbare `FOTO-PLAATS`-velden

De foto's zelf worden niet opgenomen. Er worden wel meerdere schermen/dia's met fotoplaatsen gegenereerd, zodat later foto's kunnen worden ingevoegd.

## 10C. Toon reisdag

`👁️ Toon reisdag` blijft inhoudelijk een **andere functie** dan `Maak-reis-HTML`.

De gebruiker heeft expliciet aangegeven dat de functie achter `Toon reisdag` moet blijven zoals deze werkt.

Op mobiel is het openen aangepast zodat de reisdag niet meer als een smalle popup links op het scherm verschijnt. Op Android wordt de inhoud als volledige pagina in het huidige tabblad geopend; desktopgedrag blijft passend bij desktopgebruik.

De standaard gegenereerde reisdag-HTML gebruikt op mobiel de beschikbare schermbreedte en schaalt inhoud naar het scherm.

## 10D. Toon op kaart

`🗺️ Toon op kaart` blijft bestaan en toont de geselecteerde bezochte locaties op de kaart.

---

# 11. EIGEN LOCATIES

Eigen locaties zijn contextgebonden.

Er was een probleem waarbij een eigen locatie in Argentinië & Chili niet altijd kon worden opgeslagen en waarbij het formulier na een fout kon blijven hangen.

9.0.10 is gemaakt om het opslaan robuuster te maken:
- actieve context verplicht
- fouten worden afgevangen
- formulier hoort niet vast te lopen
- bestaande contexten worden niet overschreven
- foto-/formulierreset is verbeterd
- bestaande lokaal opgeslagen locaties kunnen volledig worden bewerkt

Daarna bleek dat foto's als Base64 in localStorage werden opgeslagen en daardoor de opslaglimiet snel kon bereiken.

In 9.3 is het bewerken van lokaal opgeslagen eigen locaties toegevoegd.

9.0.11 heeft daarom foto-compressie toegevoegd:
- maximaal ongeveer 1600 px aan langste zijde
- JPEG
- ongeveer 80% kwaliteit

9.0.12 heeft vervolgens de automatische GPS-start gerepareerd.

De gebruiker heeft 9.0.12 getest en bevestigd:

**"het werkt weer!"**

---

# 11A. EIGEN LOCATIE BEWERKEN — 9.3

Voor iedere lokaal opgeslagen eigen locatie staat naast de naam een **✏️ potloodknop**.

Bij klikken opent een bewerkscherm dat dezelfde opzet gebruikt als **Locatie toevoegen**, maar met de bestaande gegevens al ingevuld.

Aanpasbaar:
- naam
- adres
- type
- omschrijving
- foto
- mijn verhaal / extra tekst
- GPS via **Huidige locatie gebruiken**
- GPS via **Adres zoeken**

Bij opslaan:
- het bestaande locatie-ID blijft behouden
- de actieve context blijft behouden
- bestaande gegevens blijven behouden als ze niet worden gewijzigd
- een bestaande foto kan worden vervangen of verwijderd
- kaart en locatiekaart worden direct bijgewerkt

Het oude aparte veld **Type wijzigen** onderaan de locatiekaart is verwijderd. Het type wordt voortaan uitsluitend in het volledige bewerkscherm aangepast.

Deze functie is door de gebruiker in 9.3 getest en als werkend bevestigd.

# 12. EXTRA INFORMATIE / SPRAAK

Er is een functie:

`➕ Extra informatie`

Deze kan persoonlijke extra informatie opslaan.

De gebruiker heeft spraakinvoer getest en bevestigd dat dit werkt op laptop en Android/Samsung.

De huidige zichtbare Extra Info is de eenvoudige/currente variant. Oudere opslagstructuren blijven bestaan voor gegevensbehoud, backup en zoekfunctie.

---

# 13. ZOEKEN

De zoekfunctie zoekt onder andere in:
- locatienamen
- type/adres/metadata
- vaste HTML-teksten
- categoriegegevens
- persoonlijke extra informatie
- notities/legacy data
- eigen locaties

Resultaten:
- scrollbaar
- korte snippet
- zoekterm gemarkeerd
- klikbaar
- Enter voert zoekactie uit

Er was een belangrijke bug in 9.0.6:
`renderResults()` gebruikte `activeVacation` buiten de scope.

9.0.7/9.0.9 repareerden dit.

BELANGRIJK:
Er is eerder per ongeluk een volledige 9.0.6 JS-bundel over de nieuwere search.js heen gezet. Daardoor kwam de bug terug.

Bij toekomstige wijzigingen altijd controleren dat de zoekfunctie uit de nieuwste stabiele versie behouden blijft.

---

# 14. GPS

De app gebruikt GPS om locaties binnen 500 meter te bepalen.

Er is ook een knop voor Mijn locatie en er zijn test-/adresfuncties voor ontwikkeling.

In 9.0.12 was er een probleem waarbij de tekst:

`Je locatie wordt nog bepaald...`

kon blijven staan omdat de GPS-watch niet automatisch werd gestart.

9.0.12 start de bestaande GPS-watch automatisch nadat de actieve context is geladen.

De gebruiker heeft dit getest en bevestigd dat het weer werkt.

---

# 15. BACKUP / RESTORE

Backup/restore is per context opgezet.

De huidige backuparchitectuur:
- bevat meerdere geconfigureerde contexten;
- bewaart per context de lokale gegevens;
- bewaart actieve context;
- bewaart legacygegevens;
- neemt vaste HTML/appbestanden niet op;
- neemt `config/vakanties.json` niet als gewone gebruikersdata op;
- ondersteunt oudere backupformaten.

**BELANGRIJK VOOR 9.7.21:**
De recente Mijn reisdag-, HTML-, foto- en slideshow-wijzigingen veranderen de opslagstructuur van persoonlijke gegevens niet.

Daarom zijn `backup.js` en `restore.js` in 9.7.21 niet aangepast.

Bij een toekomstige wijziging aan de opgeslagen gegevensstructuur moet opnieuw worden gecontroleerd of backup/restore moet worden aangepast.

Een volledige backup/restore-eindtest blijft verstandig als algemene onderhoudstest.

---

# 16. HELP

De Help-tekst staat in de huidige app in `index.html`.

`help.js` regelt de werking van het Help-venster en is voor de recente Help-wijziging **niet aangepast**.

De Help beschrijft inmiddels onder andere:
- vakantiekeuze;
- Agenda;
- Bezocht;
- Mijn reisdag;
- `📄 Download DOC`;
- `📖 Maak-reis-HTML`;
- het verschil tussen `Maak-reis-HTML` en `👁️ Toon reisdag`;
- de Japan-stijl HTML-export;
- behoud van foto-plaatsen;
- foto-plaatsen midden in tekst;
- diavoorstellingen onder kolom 1 en kolom 3;
- kaart in de eerste fotoplaats;
- zoeken;
- kaart;
- onderhoud/testfuncties;
- backup/restore;
- contextscheiding;
- Evenementen 2026.

Bij wijzigingen aan de gebruikersinterface moet de Help inhoudelijk worden bijgewerkt in `index.html`.

**Niet automatisch `help.js` wijzigen:** alleen wanneer de werking van het Help-venster zelf verandert.

---

# 17. HUIDIGE BESTANDEN IN DE SOFTWARE-MASTER

De actuele master bevat onder andere:

```text
index.html
css/reisblik.css
config/vakanties.json

js/
├── help.js
├── backup.js
├── vakantie.js
├── app.js
├── search.js
├── clear-local-storage.js
├── agenda.js
├── visited.js
├── vakantie-keuze.js
├── extra-info.js
├── ui.js
├── navigation.js
├── mijn-reisdag.js
└── restore.js
```

De master bevat daarnaast de historische changelogs/readme's en de documentatie van de recente 9.7.x-versies.

### Belangrijkste actuele bestanden voor Mijn reisdag

```text
index.html
js/mijn-reisdag.js
```

Bij de wijzigingen 9.7.5 t/m 9.7.21 zijn dit de belangrijkste functionele bestanden geweest.

`help.js` is niet gewijzigd voor de recente Help-tekst.

`backup.js` en `restore.js` zijn niet gewijzigd voor de recente Mijn reisdag-ontwikkelingen.

---

# 18. VERSIEGESCHIEDENIS — BELANGRIJKSTE STAPPEN

De oudere historie 9.0.0 t/m 9.3.1 blijft relevant als historische achtergrond. De belangrijke recente ontwikkelingen zijn:

### 9.3.1
Laatste eerdere stabiele basis vóór de 9.7.x Mijn reisdag-ontwikkelingen.

### 9.7.4
- nieuwe fase voor Mijn reisdag;
- ingebouwde Mijn Reisdag-editor wordt verwijderd;
- bestaande Word-export en overige functies moeten behouden blijven;
- gebruiker bewerkt de uiteindelijke HTML buiten de app.

### 9.7.5
- editor volledig verwijderd;
- standaard HTML-download toegevoegd;
- bestaande Mijn reisdag-selectie blijft gebruikt.

### 9.7.6
- schakelaars voor Testfuncties en Onderhoudsfuncties;
- onderhoudsfuncties onder Mijn reisdag;
- `👁️ Toon reisdag` teruggebracht.

### 9.7.7
- dubbele onderhoud/test-blokken opgeschoond.

### 9.7.8
- Help naast Search geplaatst.

### 9.7.9
- cacheversie geforceerd;
- `👁️ Toon reisdag` opnieuw correct meegenomen in `mijn-reisdag.js`.

### 9.7.10
- Help uitgebreid met de nieuwe Mijn reisdag-functionaliteit.

### 9.7.11
- mobiele breedte van de standaard gegenereerde HTML verbeterd;
- viewport en mobiele CSS toegevoegd.

### 9.7.12
- tweede HTML-export toegevoegd: `maak-html-reis`;
- Japan-stijl HTML;
- chronologische bezochte locaties;
- eerste `<h2>` is locatie-naam;
- tekst behouden;
- foto's vervangen door fotoplaatsen;
- eerste bovenste fotoplaats bevat interactieve kaart;
- overige bovenste fotoplaatsen blijven beschikbaar;
- slideshows voorbereid.

### 9.7.13
- gegenereerde Japan-HTML broncode leesbaar en ingesprongen gemaakt;
- niet meer als één lange/minimale regel opgebouwd.

### 9.7.14
- Japan-export nog dichter bij de oorspronkelijke Japan HTML/CSS-structuur gebracht;
- oorspronkelijke structuur als template;
- headerfoto's, top-fotobalk en overige fotoposities meegenomen;
- fotoformaten/float-indelingen zoveel mogelijk behouden.

### 9.7.15
- standaard gegenereerde HTML op mobiel volledig schermbreed gemaakt;
- desktopbreedte/min-width-problemen verwijderd.

### 9.7.16
- foto-plaatsen toegevoegd voor foto's die midden in `tekst-normaal` staan;
- ook foto's midden in tekst/paragrafen behouden;
- navigatie `vorige Pagina` / `Volgende Pagina` toegevoegd aan de Japan-export.

### 9.7.17
- twee diavoorstellingen toegevoegd;
- slideshow onderaan kolom 1;
- slideshow onderaan kolom 3;
- teksten zoals `overige foto's ...`;
- meerdere dia-indelingen;
- `FOTO-PLAATS` in plaats van werkelijke foto's;
- vorige/volgende/sluitknoppen.

### 9.7.18
- mobiele `👁️ Toon reisdag` aangepast;
- voorkomen dat Android de reisdag als smal popupvenster links toont;
- volledige mobiele paginaweergave.

### 9.7.19
- ontbrekende foto-plaatsen in locatieblokken verder gecorrigeerd;
- iedere oorspronkelijke `<img>` wordt als zichtbare fotoplaats meegenomen;
- ook foto's direct na `<h2>`, midden in tekst en in complexe indelingen.

### 9.7.20
- knop `HTML maken` verwijderd;
- knop `maak-html-reis` hernoemd naar **`Maak-reis-HTML`**;
- functie achter `👁️ Toon reisdag` behouden.

### 9.7.21
- Help bijgewerkt voor de actuele knoppen en HTML/Japan-export;
- Help beschrijft foto-plaatsen, slideshows en verschil tussen de functies;
- backup/restore gecontroleerd;
- geen wijziging nodig aan `backup.js` of `restore.js`.

**Huidige status: 9.8.6 is de actuele veilige master.**

---

# 19. TESTSTATUS

Door de gebruiker in de recente 9.7.x-ontwikkeling daadwerkelijk getest en als werkend bevestigd:

- Mijn reisdag;
- mobiele weergave van de standaard HTML;
- `📖 Maak-reis-HTML`;
- Japan-stijl HTML;
- leesbare broncode;
- foto-plaatsen;
- foto-plaatsen midden in tekst;
- foto-plaatsen met verschillende afmetingen/float-indelingen;
- kaart in de eerste bovenste fotoplaats;
- diavoorstellingen;
- meerdere slideshow-schermen;
- vorige/volgende knoppen in de slideshows;
- mobiele weergave;
- `👁️ Toon reisdag` op mobiel;
- bestaande `📄 Download DOC`;
- `🗺️ Toon op kaart`.

De gebruiker heeft na 9.7.19 expliciet bevestigd dat:
- de mobiele HTML-weergave goed leesbaar is;
- de diavoorstellingen werken;
- de nieuwe mobiele oplossing goed werkt.

### Nog verstandig als eindcontrole

1. `📖 Maak-reis-HTML` testen met een locatie waarvan foto's direct na `<h2>` staan.
2. Testen met een foto midden in een `<p>`.
3. Testen met links/rechts gefloatte foto's.
4. Testen van alle dia's onder kolom 1 en kolom 3.
5. Testen van `👁️ Toon reisdag` op Android en desktop.
6. `📄 Download DOC` opnieuw controleren.
7. Backup maken en restore uitvoeren met meerdere contexten.
8. Controleren dat persoonlijke gegevens na een nieuwe master/installatie niet verloren gaan.
9. Volledige eindtest van de app.

---

# 20. BELANGRIJKE WERKAFSPRAKEN VOOR EEN NIEUWE CHAT

Wanneer dit project in een nieuwe chat wordt voortgezet:

- Begin vanuit **Reisblik 9.8.6 – VOLLEDIGE MASTER**.
- Beschouw 9.8.6 als de actuele stabiele referentie.
- Niet terugvallen op 9.3.1 als primaire bouwbasis.
- Niet meerdere oude versies blind samenvoegen.
- Bij iedere wijziging eerst de actuele `index.html` en relevante JS-bestanden controleren.
- Versie altijd verhogen.
- Werkende functies behouden.
- Alleen werkelijk gewijzigde bestanden vervangen.
- Geef altijd de volledige master als er een nieuwe versie wordt gemaakt.
- Geef daarnaast afzonderlijk aan welke bestanden daadwerkelijk gewijzigd zijn en welke op GitHub vervangen moeten worden.
- Niet-gewijzigde bestanden niet onnodig vervangen.
- Na iedere wijziging daadwerkelijk testen.
- Mobiele wijzigingen altijd op Android controleren.
- Bij problemen eerst de actuele versie en cacheversies controleren.
- `help.js` niet wijzigen wanneer alleen de Help-tekst verandert; de Help-tekst staat in `index.html`.
- `backup.js` en `restore.js` niet wijzigen tenzij de opslagstructuur daadwerkelijk verandert.
- De ingebouwde Mijn Reisdag-editor mag niet terugkomen.
- `👁️ Toon reisdag` en `📖 Maak-reis-HTML` zijn verschillende functies en moeten dat blijven.
- De knopnaam is **`Maak-reis-HTML`**; de oude naam `HTML maken` mag niet terugkomen.
- De oorspronkelijke Japan HTML blijft de structurele leidraad voor de Japan-export.
- Foto's zelf niet automatisch opnemen in de Japan-export; wel alle oorspronkelijke foto-posities als `FOTO-PLAATS`.
- Foto-plaatsen midden in tekst moeten behouden blijven.
- De twee Japan-slideshows horen onder kolom 1 en kolom 3.
- Bij agenda's blijft de vaste werkwijze gelden: kandidatenlijst → gebruiker controleert → pas daarna definitieve `agenda.json`.
- `agenda.json` gebruikt altijd `events`, nooit `evenementen`.
- Geen vaste HTML-mappen toevoegen aan `evenement-2026`.

---

# 20A. OFFLINE VAKANTIE — 9.8.x

Vanaf 9.8.0 is Reisblik voorbereid voor offline gebruik. De app kan zonder internet blijven functioneren voor de lokaal beschikbare content; GPS kan daarbij blijven werken.

### 9.8.1
- Offline laden van bestanden met versie-/querystrings is gerepareerd.
- Content die al online was geladen kan offline beschikbaar zijn.

### 9.8.2
- Onder Onderhoudsfuncties is **📥 Vakantie offline beschikbaar maken** toegevoegd.
- Hiermee kan een gekozen vakantie gericht offline worden voorbereid.

### 9.8.3
- Er kan maximaal één tijdelijke offline vakantie actief zijn.
- Bij het offline beschikbaar maken van een nieuwe vakantie wordt alleen de vorige tijdelijke offline vakantiecache verwijderd.
- Overige localStorage-gegevens blijven behouden.
- De algemene Reisblik-appcache blijft behouden.
- Backup/restore wordt niet aangepast en neemt de tijdelijke offline vakantie niet mee.
- Offline kaarten zijn nog niet onderdeel van deze versie.

### 9.8.6
- Help uitgebreid met uitleg over tijdelijke offline vakanties.
- Help legt expliciet uit dat de offline vakantie niet in Backup content wordt opgenomen.
- Projectoverdracht bijgewerkt naar 9.8.6 als actuele master.

# 21. PERSOONLIJKE BELEVENISSEN — TOEKOMSTIG ONDERDEEL

Er is een toekomstig concept besproken voor **Mijn Belevenissen**.

Doel:
- persoonlijke ervaringen archiveren
- gebeurtenis-/ervaringendagboek
- later patronen leren herkennen

Gedacht model:
A. stabiel persoonlijk interesseprofiel
B. persoonlijke ervaringen
C. afgeleide/geleerde voorkeuren

Belangrijke uitgangspunten:
- één ervaring verandert niet automatisch het vaste profiel
- patronen worden pas na meerdere ervaringen relevant
- gebruiker moet patronen kunnen bevestigen
- objectieve activiteit en persoonlijke ervaring onderscheiden
- vrije kwalitatieve tekst blijft belangrijk
- "knutterigheid" als aparte factor behouden
- uiteindelijk: persoonlijke ervaringenarchief + ervaringendagboek + leerlaag

Gewenste keten:

```text
Evenement gevonden
      ↓
lokaal opslaan
      ↓
Agenda
      ↓
Bezocht
      ↓
persoonlijke ervaring
      ↓
geleerde patronen
```

Dit is nog niet volledig gebouwd.

---

# 22. VOLGENDE LOGISCHE STAP

De actuele basis is **9.8.6**.

De eerstvolgende ontwikkeling moet daarom **9.8.6** worden.

Niet zomaar bestaande functies herschrijven. Eerst exact bepalen welke nieuwe functie of correctie nodig is.

Bij nieuwe wijzigingen aan de Japan-export:
- oorspronkelijke Japan-template als basis houden;
- foto-posities niet verliezen;
- tekst niet verliezen;
- slideshows niet verliezen;
- mobiele weergave niet terug laten vallen naar desktopbreedte;
- `Toon reisdag` niet vermengen met `Maak-reis-HTML`.

Bij nieuwe wijzigingen aan opslag:
- eerst controleren of backup/restore geraakt wordt;
- alleen `backup.js` / `restore.js` aanpassen wanneer de gegevensstructuur dit werkelijk vereist.

---

# 23. KERN IN ÉÉN ALINEA

Reisblik 9.8.6 is de actuele veilige software-master van de contextgestuurde reisapp. De oudere contextarchitectuur met Trekvogelpad, Argentinië & Chili en Evenementen 2026 blijft behouden, evenals Bezocht, Agenda, Eigen locaties, Extra informatie, zoeken, GPS en backup/restore. De belangrijke recente ontwikkeling is Mijn reisdag: de ingebouwde editor is verwijderd, `📄 Download DOC` blijft behouden, en er zijn twee aparte HTML-functies: `📖 Maak-reis-HTML` en `👁️ Toon reisdag`. `Maak-reis-HTML` gebruikt de oorspronkelijke Japan HTML als structurele leidraad, houdt locaties chronologisch, behoudt tekst en maakt voor alle oorspronkelijke foto's zichtbare `FOTO-PLAATS`-velden, ook wanneer foto's midden in tekst of paragrafen staan. De oorspronkelijke foto-indelingen worden zoveel mogelijk behouden. De eerste bovenste fotoplaats bevat de interactieve kaart. Onder kolom 1 en kolom 3 staan de twee diavoorstellingen met teksten, meerdere dia-indelingen, foto-plaatsen en vorige/volgende/sluitknoppen. De mobiele weergave is aangepast zodat zowel de gegenereerde HTML als `👁️ Toon reisdag` op Android schermbreed worden weergegeven. `HTML maken` is vervangen door **`Maak-reis-HTML`**. De Help is in 9.8.6 aangepast in `index.html`; `help.js` hoefde daarvoor niet te worden gewijzigd. De backupfunctie is in 9.8.6 aangepast: losse Aantekeningen worden per vakantie meegenomen in backup en restore. **9.8.6 is het huidige veilige masterpunt. De volgende ontwikkeling moet vanaf **9.8.6** beginnen, met behoud van alle huidige werkende functionaliteit.**

