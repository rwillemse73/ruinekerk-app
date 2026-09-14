# REISBLIK — PROJECTOVERDRACHT 9.8.9

## Stand per 14 september 2026

De actuele ontwikkelversie is **Reisblik 9.8.9**.

De veilige terugvalbasis blijft **Reisblik 9.8.6**.

## Wijzigingen 9.8.9

### 1. Automatische slideshow-layout in Japan-stijl HTML
De Japan-stijl HTML-export gebruikt de nieuwe automatische foto-indeling voor slideshows.

Ondersteund:

- 1 foto: één grote foto.
- 2 foto's: naast elkaar.
- 3 portretfoto's: drie naast elkaar.
- 3 landschapsfoto's: twee boven en één grote onder.
- 1 portret + 2 landschappen: portret links en twee landschappen rechts.
- 4 foto's: twee boven en twee onder.

De oriëntatie wordt bepaald op basis van de echte afmetingen van alle geladen foto's. Hierdoor werkt ook de combinatie met drie portretten correct.

Bestaande slideshow-dia's uit een oorspronkelijke Japan-HTML worden tijdens de export genormaliseerd naar:

```html
<div class="slide-fotos">
    <div class="slide-foto">
        <img src="..." alt="Foto 1">
    </div>
</div>
```

De gebruiker kan daarna per dia eenvoudig foto's vervangen of toevoegen.

### 2. Beide slideshows
De gegenereerde Japan-HTML bevat twee voorbeeld-slideshows. Beide gebruiken de nieuwe `slide-fotos` / `slide-foto` structuur.

De bestaande vorige/volgende/sluit-navigatie blijft behouden.

### 3. HTML per dag
`📚 HTML per dag` maakt alleen voor kalenderdagen binnen de gekozen periode waarop daadwerkelijk minimaal één locatie of evenement als **Bezocht** is geregistreerd een afzonderlijk Japan-stijl HTML-bestand.

Voorbeeld:

- Datum van: 1 augustus 2026
- Datum t/m: 3 augustus 2026
- Bezocht op 1 en 3 augustus
- resultaat: 2 losse HTML-bestanden.

Dagen zonder bezoek worden overgeslagen en leveren geen leeg HTML-bestand op. De bestandsnamen bevatten de datum en de eerste naam uit die dag.

### 4. Hoofdscherm mobiele indeling
De gebruikersknoppen zijn verdeeld over twee rijen:

**Rij 1**
- 📅 Mijn reisdag
- 📝 Aantekeningen

**Rij 2**
- 📅 Agenda
- 🔎 Zoeken
- ❓ Help

Dit voorkomt dat de drie kleinere functies op een telefoon horizontaal buiten beeld lopen.

### 5. Help
De Help-pagina is bijgewerkt voor:

- de nieuwe mobiele knopindeling;
- `📚 HTML per dag`;
- het feit dat meerdere dagen meerdere losse HTML-bestanden opleveren;
- de automatische slideshow-foto-indeling.

## Gewijzigde bestanden

- `index.html`
- `css/reisblik.css`
- `js/mijn-reisdag.js`
- `sw.js`
- `CHANGELOG_9.8.9.md`
- `README_9.8.9_MASTER.md`
- `REISBLIK_PROJECTOVERDRACHT_9.8.9.md`

## Niet gewijzigd

- `js/backup.js`
- `js/restore.js`
- overige persoonlijke localStorage-structuur
- `👁️ Toon reisdag`
- `📄 Download DOC`

## Testpunten voor de nieuwe versie

1. Open Reisblik op een telefoon.
2. Controleer de twee rijen met gebruikersknoppen.
3. Open Mijn reisdag.
4. Selecteer één dag en controleer `📚 HTML per dag`.
5. Selecteer drie dagen en controleer dat drie losse HTML-bestanden worden gemaakt.
6. Open de gegenereerde Japan-HTML.
7. Controleer beide slideshows.
8. Test minimaal:
   - 3 portretten;
   - 3 landschappen;
   - 1 portret + 2 landschappen;
   - 4 landschappen.
9. Controleer Vorige, Volgende en Sluiten.

## Veilige terugvalbasis

`Reisblik_9.8.6_VOLLEDIGE_MASTER.zip` blijft ongewijzigd en is de terugvalbasis.
