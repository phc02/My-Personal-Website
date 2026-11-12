# Resume envelope assets

- `body.svg` and `flap.svg`: exact SVG artwork extracted from the public server-rendered demo at https://reverseui.com/components/interactive-envelope (Reverse UI).
- `stamp.png`: original https://cdn.reverseui.com/images/stamp.png.
- `collapse.svg`: reused from the existing M7 digital-twin close control in `src/projects/m7-digital-twin/experience.js`, with its fill set to black for the white cursor disc.
- Animation reference: https://rsvp.labs.trlibrary.com/demo/.

The local interaction is implemented in vanilla JavaScript with the site's bundled GSAP. All artwork and the user-supplied resume load locally. No remote embeds, external tracking, or React runtime are used.
