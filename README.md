# GeoQuest — Apprendre la géographie en jouant

Application Next.js (App Router) mobile-first en TypeScript + Tailwind. Deux modes : Mode Libre et Mode Progression, avec carte SVG interactive et système de rangs.

## Installation

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000

## Structure

- `app/page.tsx` : accueil avec CTA vers les deux modes et aperçu carte.
- `app/libre/page.tsx` : Mode Libre (thème pays/capitales/drapeaux, zone monde ou continent, questions infinies, feedback immédiat).
- `app/progression/page.tsx` : Mode Progression (niveaux de 10 questions, chrono sur niveaux avancés, déblocage si ≥7/10, rangs).
- `context/GameContext.tsx` : état global (progression, rang, couleurs carte).
- `data/countries.ts` + `data/world-geo.json` : jeu de données géographiques + géométries simplifiées.
- `lib/levels.ts`, `lib/questions.ts`, `lib/rank.ts` : logique de niveaux, génération de questions, calcul du rang.
- `components/WorldMap.tsx` + `MapLegend.tsx` : carte interactive et légende.
- `components/ui/*` : boutons, badge, barre de progression.

## Jeux et règles

- Mode Libre : aucune limite, chaque réponse colore la carte (non vu / en cours / réussi / erreur) et affiche une explication courte.
- Mode Progression : 5 niveaux croissants, 10 questions chacun. Chrono sur niveaux 3 et 5. Score ≥7/10 pour débloquer le suivant. Pièges via options proches.
- Rangs : Explorateur → Voyageur → Géographe → Cartographe → Expert mondial selon niveaux complétés et moyenne des meilleurs scores.

## Notes techniques

- Pas de backend : tout en local dans React.
- Données minimales pour démo (pays, capitale, continent, ISO, drapeau + fait marquant).
- Carte SVG simplifiée projetée avec d3-geo, entièrement cliquable.
