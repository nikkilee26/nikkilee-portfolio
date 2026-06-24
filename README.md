# Nikki Lee Portfolio

Static HTML/CSS/JavaScript portfolio site for GitHub Pages.

## What is included

- `index.html` — homepage with featured work, about, and contact sections
- `sorcea-labs/index.html` — Sorcea Labs case study
- `project-dialogue/index.html` — Project Dialogue case study
- `transit-pal/index.html` — Transit Pal case study
- `beli/index.html` — Beli case study
- `styles.css` — all desktop/mobile styling
- `script.js` — navigation, reveal animations, interactive cards, copy-email interaction, and current-year footer
- `assets/` — images, GIFs, SVGs, and thumbnails used across the site
- `.nojekyll` — keeps GitHub Pages from processing the site with Jekyll

## Preview in VS Code

1. Unzip the folder.
2. Open the full `nikki-lee-portfolio-complete` folder in VS Code.
3. Use the Live Server extension and click **Go Live** while viewing `index.html`.

You can also preview it with Python from the project folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## GitHub Pages

Upload the contents of this folder to a GitHub repository. In the repository settings, enable GitHub Pages from the root of the main branch.

## Editing notes

The site has no build step. You can edit the HTML, CSS, and JavaScript directly. Keep the same folder structure so links like `assets/portfolio/thumb-sorcea.png` and `sorcea-labs/index.html` continue to work.
