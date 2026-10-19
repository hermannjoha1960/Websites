# trading-am-see.de

Website des Live-Trading-Retreats **Trading am See** (Krüpelsee, Zernsdorf – 30 km vor Berlin).
Die Seiten laufen auf **Timbaly** (Connector „trading-am-see_de“); dieses Verzeichnis ist die Quelle.

| Pfad | Inhalt |
|---|---|
| `docs/PLAN.md` | Website-Plan: Ziel, Zielgruppe, Struktur, Design, Formular, Recht, Launch (Rumänisch) |
| `site/pages/*.html` | Seiteninhalt (inneres HTML, so wie es in Timbaly gespeichert wird) |
| `site/pages/pages.json` | URL, Titel, Meta-Description, OG-Daten je Seite |
| `site/blocks/*.html` | Wiederverwendbare Blöcke (`[[BLOCK:anmeldung-formular]]`, `[[BLOCK:cta-vormerken]]`) |
| `site/src/input.css` | Design-System (Tailwind + `t-*`-Komponenten) → `site/dist/site.css` = Custom-CSS der Website |
| `site/src/scripts.js` | Footer-Script (Animationen, Hero-Slideshow, Live-Chart, Formular) |
| `site/src/head.html`, `nav.html`, `footer.html` | Head-Tags, Navigation, Footer |
| `assets/` | Logo, Favicon, Kursiv-Schrift, optimierte Fotos (in der Mediathek unter `/uploads/site-87/…`) |
| `tools/` | Bild-Konvertierung, Vorschau-Build, Screenshots, Publish-Payloads, Live-Prüfung |

## Lokal bauen und prüfen

```bash
cd site && npm install && npm run build      # CSS + preview/*.html
cd .. && node tools/screenshots.mjs shots preview/home.html
node tools/build-publish.mjs                  # publish/: exakt die Strings, die in Timbaly gespeichert werden
```

Die Vorschau lädt Medien und Schriften von der Live-Domain.

## Live prüfen

```bash
python3 tools/verify-live.py     # Live-Seiten, Custom-CSS, Footer-Script, Nav/Footer == publish/?
node tools/check-live.mjs        # Layout-Sonde 390/768/1440, Konsole, Menü, FAQ, Cookie-Banner, Formular
```

`check-live.mjs` fängt das Absenden des Formulars ab – es entsteht kein Lead und keine E-Mail.

Hinweise zu Timbaly:
- Interne Links auf Seiten, die es noch nicht gibt, ersetzt Timbaly beim Speichern durch
  `<span class="ai-removed-link">` und verliert dabei die Klassen. Neue Seiten deshalb vor den Seiten
  anlegen, die auf sie verlinken – oder danach mit `verify-live.py` prüfen und zurücksetzen.
- Kleine CSS-Änderungen lassen sich gezielt mit `replace_in_site_content` (`include_advanced_fields`)
  im Custom-CSS ersetzen; danach `verify-live.py` laufen lassen.

## Design-Regeln für neue Inhalte

- Abschnitte: `<section class="t-section t-bg-ink|t-bg-night|t-bg-deep|t-bg-paper|t-bg-paper2">` + `<div class="t-wrap">`.
- Überschriften `t-h2`/`t-h3`, Hervorhebung mit `<em>` (Kursiv-Verlauf), Kicker `t-eyebrow`, Fließtext `t-lead`/`t-text`.
- Buttons `t-btn t-btn--gold` (Hauptaktion, mit Klasse `convert`), `t-btn--ghost`; Einblenden beim Scrollen: Klasse `rv`.
- Nur Bilder aus der Mediathek verwenden; KI-Bilder immer mit `<span class="t-chip t-chip--ai">Symbolbild (KI)</span>` kennzeichnen.
- Nach CSS-Änderungen `npm run build:css` und `dist/site.css` als Custom-CSS in Timbaly speichern.
- Der Cookie-Banner wird von Timbaly gerendert (`#cc-banner`); Farben kommen über die `--cc-*`-Variablen
  in `input.css`, die Klassen stehen in der `safelist` von `tailwind.config.js`.
