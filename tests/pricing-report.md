# Vierwekenprijzen — 24 september 2026

Scope: uitsluitend Yourizorge/fitmetzorge-website (www.fitmetzorge.com).
Gecontroleerde uitgangsversie: a978c627e80d795e7858af55d61f838fcaa90f4e.
Geen nieuwere remote wijzigingen bij aanvang; geen projectinstructies aangetroffen.

## Definitieve prijzen

| Pakket | Per training | Per 4 weken | Trainingen per 4 weken |
| --- | --- | --- | --- |
| Basis, 1 persoon | €50 | €200 | 4 |
| Progressie, 1 persoon | €47,50 | €380 | 8 |
| Transformatie, 1 persoon | €40 | €480 | 12 |
| Duo Basis | €32,50 per persoon | €260 totaal voor 2 personen | 4 |
| Duo Progressie | €31,25 per persoon | €500 totaal voor 2 personen | 8 |
| Duo Transformatie | €27,50 per persoon | €660 totaal voor 2 personen | 12 |
| Online coaching | Niet van toepassing | €200 | Geen aantal PT-sessies toegezegd |

De drie individuele pakketten blijven 60 minuten per training. De bedragen zijn
ongewijzigd. Losse training: €55 voor 60 minuten. Strippenkaart: 10 × 60 minuten,
€52 per training, €520 totaal. Hiervoor geldt geen vierwekelijkse betaalperiode.

## Zichtbare afspraken

Alle prijzen zijn inclusief btw. Voor de terugkerende pakketten vindt betaling
en facturatie iedere vier weken plaats: één betaalperiode duurt 28 dagen.
Er zijn 13 betaalperiodes per jaar.

De overeenkomst is opzegbaar met een opzegtermijn van vier weken. Trainingen
binnen het pakket horen bij de betreffende vierwekenperiode.

Minimaal 24 uur vooraf afzeggen is kosteloos. Daarna wordt de training in
rekening gebracht.

Deze afspraken gelden voor nieuwe overeenkomsten. Bestaande klantafspraken en
contracten blijven ongewijzigd. Er is geen klantbericht verstuurd of contract
bijgewerkt; ook geen contract-, facturatie- of klantensysteem benaderd.

## Bevindingen

- Oude maandlabels zaten in HTML-prijskaarten, de standaard pakketbeschrijving,
  JavaScript-pakketdetails en de verzonden radio-opties. Alle zijn vervangen.
- Duo-trainingsprijzen zijn per persoon, de periodebedragen per duo. Dit is ook
  expliciet gemaakt in de verzonden pakketoptie. De bedragen zijn consistent:
  sessieprijs × 2 personen × aantal sessies = periodebedrag.
- De voorwaardenpagina bevatte een placeholder. Nu staan daar uitsluitend de
  door de eigenaar aangeleverde afspraken; dezelfde kerntekst staat prominent
  boven de prijzen en in het tarievenvenster.
- De opgegeven bestaande 24-uursregel stond niet in de bronbestanden; deze is
  nu zichtbaar opgenomen volgens de instructie van de eigenaar.
- Geen andere prijsdragende FAQ's of gestructureerde prijsgegevens aangetroffen.
  De tarievenmetadata is bijgewerkt. De generieke intake geeft expliciet aan dat
  nog geen pakket is gekozen en verzendt de nieuwe periode-informatie.
- Het raster en het 'Meest gekozen'-label zijn aangepast zodat lange prijsregels
  en 200% tekstvergroting niet buiten de kaart vallen.
- Regels over vakantie, ziekte, bevriezen en meenemen van trainingen ontbreken
  in de websitebron. Er zijn geen aanvullende regels hierover verzonnen. Dit
  blijven afzonderlijke keuzes voor de eigenaar.

## Verificatie

Lokale resultaten: 70 prijskaart-/pakketrequestcontroles en 32 formulier-/
layoutscenario's geslaagd, plus alle zeven pakketopties en de toetsenbordsimulatie.
Screenshots op mobiel en desktop visueel gecontroleerd. JavaScript-syntax en
git diff --check geslaagd. Geen achtergebleven oude periodevermeldingen in de
publieke HTML, JavaScript of CSS.

`node tests/pricing.cjs`: zeven pakketten op 320×568, 375×280, 768×1024,
1440×900 en 1920×1080, ieder met 100% en 200% tekst. Controleert bedragen,
komma's, prijsvolgorde, btw/13 periodes, duo-betekenis, horizontale overflow,
toetsenbordbediening, bereikbaarheid verzendknop, pakketnaam en requestinhoud.
Alle FormSubmit-requests worden onderschept en afgewezen door de testfixture.

`node tests/forms.cjs`: beide formulieren; geldig/ongeldig, succes,
provider-/netwerkfouten, time-out, dubbel verzenden, bedankroute, gegevensbehoud,
scrollen, sluiten/heropenen, pakketwissel, focus, paginapositie en gesimuleerd
mobiel toetsenbord via visualViewport. Ook de nieuwe intakeperiodevelden worden
in de requestinhoud gecontroleerd. Geen echte formulierinzending of e-mail.

Met `LIVE_BASE=https://www.fitmetzorge.com` draaien dezelfde tests tegen de live
website, nog steeds met alle externe verzending onderschept. Een fysieke
iOS-/Android-toesteltest is niet uitgevoerd; het toetsenbord is gesimuleerd.
De gepubliceerde HTML/CSS/JS-bestanden worden apart byte voor byte met Git vergeleken.

## Bestanden

- tarieven.html: prijskaarten, uitleg, metadata, pakketvenster en periodevelden.
- script.js: pakketdetails, formulieropties en venstertitel.
- contact.html: toelichting en periodevelden bij vrijblijvende intake.
- voorwaarden.html: opgegeven afspraken voor nieuwe overeenkomsten.
- styles.css: leesbare periodeprijzen en kaarten bij vergrote tekst.
- tests/forms.cjs: bijgewerkte assertions en optionele live testbasis.
- tests/pricing.cjs: controles van alle kaarten en pakketrequests.
- tests/pricing-report.md: dit verslag.

APPFMZ, staging, Supabase, AI-ontwikkeling en bestaande klantgegevens vallen
buiten deze repository en zijn niet gewijzigd.
