import { Domain, LevelConfig } from "./types";

// Niveaux du mode Progression : difficulté croissante
export const baseLevels: LevelConfig[] = [
  {
    id: 1,
    title: "Découverte",
    description: "Capitale ↔ pays simples.",
    zone: "Monde",
    allowedTypes: ["capitalToCountry", "countryToCapital"],
  },
  {
    id: 2,
    title: "Continents",
    description: "Capitale/pays + drapeaux, quelques pièges.",
    zone: "Monde",
    traps: true,
    allowedTypes: ["capitalToCountry", "countryToCapital", "flagToCountry"],
  },
  {
    id: 3,
    title: "Carto Express",
    description: "Carte + chrono 15s, mix.",
    zone: "Monde",
    usesMap: true,
    timer: 15,
    allowedTypes: [
      "capitalToCountry",
      "countryToCapital",
      "mapClick",
      "populationToCountry",
    ],
  },
  {
    id: 4,
    title: "Drapeaux & Monnaies",
    description: "Drapeaux, monnaies, vrai/faux.",
    zone: "Monde",
    traps: true,
    allowedTypes: [
      "flagToCountry",
      "countryToFlag",
      "countryToCurrency",
      "trueFalse",
    ],
  },
  {
    id: 5,
    title: "Expert domaine",
    description: "Mix total + chrono 12s.",
    zone: "Monde",
    usesMap: true,
    timer: 12,
    traps: true,
    allowedTypes: [
      "capitalToCountry",
      "countryToCapital",
      "flagToCountry",
      "countryToFlag",
      "mapClick",
      "trueFalse",
      "populationToCountry",
      "countryToCurrency",
    ],
  },
];

export const domains: Domain[] = [
  "Monde",
  "Europe",
  "Afrique",
  "Asie",
  "Amériques",
  "Océanie",
];

// Génère les niveaux pour chaque domaine (le zone = domaine pour filtrer)
export const levelsByDomain: LevelConfig[] = domains.flatMap((domain) =>
  baseLevels.map((lvl) => ({
    ...lvl,
    domain,
    zone: domain,
  }))
);
