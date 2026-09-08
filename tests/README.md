# Websiteformuliercontrole — 8 september 2026

Repository: Yourizorge/fitmetzorge-website, www.fitmetzorge.com.
Startpunt: actuele remote main/HEAD `4c9da13df494ba39ad30cc422901f1f5deca2552`.
De geopende map was een lege Git-initialisatie; origin is opgehaald en de
fixbranch `codex/fix-intake-signup-scroll` is daarop aangemaakt.
Geen AGENTS.md of hostingconfiguratie aangetroffen. Geen apprepository gewijzigd.

## Bevindingen en wijzigingen

- Bewezen scrolloorzaak: de latere `.signup-dialog { overflow: hidden; }`
  overschreef `overflow: auto`. Die override is verwijderd. De dialoog gebruikt
  de zichtbare viewporthoogte (ook bij resize/keyboard) en de achtergrond wordt
  vastgezet met herstel van scrollpositie en focus bij sluiten.
- De aanvullende intake-layouttest vond bij 200% tekst ook horizontale overflow
  door lange woorden in de intake en footer, en door de desktopnavigatie.
  Woordafbreking en het omvouwen van navigatielinks voorkomen deze overflow;
  vormgeving bij normale tekst en tarieven blijven behouden.
- Beide oorspronkelijke formulieren gebruikten een gewone POST naar FormSubmit.
  Het ontbreken van preventDefault was daarbij correct. De bestaande handler
  had geen responscontrole, foutafhandeling of bescherming tegen dubbel verzenden.
  Een concrete oorspronkelijke provider-, netwerk- of activatiefout is niet bewezen.
- Beide formulieren gebruiken nu FormSubmit AJAX met dezelfde dienst. Alleen
  HTTP-succes met expliciet `success: true` of `"true"`, zonder activatiebericht,
  leidt naar bedankt.html. HTTP-fouten, negatieve/misvormde antwoorden,
  activatieberichten, netwerkfouten en time-outs houden het formulier in beeld.
  Er is geen automatische retry: na een netwerkfout kan verwerking immers al
  hebben plaatsgevonden. Persoonsgegevens blijven uitsluitend in het formulier.
- Op uitdrukkelijk aanvullend verzoek is de ontvanger van beide formulieren
  gewijzigd naar info@fitmetzorge.com. Alle zichtbare adressen en mailto-links in
  de tien HTML-pagina's zijn eveneens aangepast. Er zijn geen andere
  contactformulieren in de repository aangetroffen.
- De bedankpagina onderscheidt provideracceptatie van inboxbezorging en claimt
  bij rechtstreeks openen geen ontvangst. Een kortlevend sessionStorage-tijdstip
  bevat geen formuliergegevens. De HTML behoudt een normale POST als JS-fallback,
  met een absolute productie-bedankroute; foutafhandeling op de eigen pagina
  vereist JavaScript. Een fallback of geblokkeerde sessionStorage geeft daarom
  voorzichtig geen ontvangstbevestiging op de bedankpagina.

## Herhaalbare tests

Voer `node tests/forms.cjs` uit met Playwright beschikbaar. Op deze computer is
de gebundelde Node-runtime gebruikt, met NODE_PATH naar de gebundelde node_modules.
De test gebruikt Edge headless, start zelf een lokale server en onderschept
**alle externe browserrequests**. Er wordt geen echte aanvraag of e-mail verzonden.

De matrix bevat beide formulieren, lege/ongeldige/geldige invoer, e-mail- en
leeftijdvalidatie, succes (boolean/string), netwerkfout, HTTP 503, negatieve
providerrespons, activatiebericht, ongeldige JSON en de 20-seconden-time-out.
Ook gecontroleerd: twee onmiddellijke submits geven één request, requestinhoud
en nieuwe ontvanger, bedankroute, gegevensbehoud, directe bedankpagina,
alle zeven pakketnamen en prijsopties, sluiten/heropenen/pakketwissel,
scrollpositie, geen horizontale overflow, JavaScript- en onverwachte consolefouten.

Viewportmatrix: 320×568, 375×280, 667×320 en 1440×900, met normale en 200% tekst.
Beide formulieren worden in deze matrix gecontroleerd. Met `LAYOUT_ONLY=1`
kan na een CSS-wijziging alleen de layoutmatrix opnieuw worden uitgevoerd.
Daarnaast wordt visualViewport op 270px hoogte/30px offset gezet als
toetsenbordsimulatie. Dit is browseremulatie, geen fysieke iOS/Android-toesteltest.
Verwachte netwerkconsolemeldingen bij opzettelijk afgebroken requests worden
uitgezonderd; de test meldt overige consolefouten.

## Externe controle die nog openstaat

Resultaat: 16 verzendscenario's geslaagd; na de laatste CSS-correcties alle
16 layoutcombinaties opnieuw geslaagd, evenals de zeven pakketten en de
visualViewport-toetsenbordsimulatie. JavaScript-syntax en git diff --check zijn
ook gecontroleerd. Lokale preview: http://127.0.0.1:8765/tarieven.html.

Provideracceptatie en inboxbezorging zijn uitsluitend gesimuleerd, niet live
bewezen. Er is geen echte POST gedaan en dus ook geen activatiemail uitgelokt.
Als FormSubmit voor het nieuwe adres activatie vraagt, moet de eigenaar in
info@fitmetzorge.com de knop **Activate Form** in de FormSubmit-bevestigingsmail
aanklikken (ook ongewenste e-mail controleren). Outlook-mailboxconfiguratie
alleen bewijst geen FormSubmit-activatie. Een echte verzend-/ontvangstcontrole
kan pas met toestemming; er is niets gepusht, gemerged of gepubliceerd.

Primaire providerdocumentatie:
- https://formsubmit.co/documentation
- https://formsubmit.co/ajax-documentation
