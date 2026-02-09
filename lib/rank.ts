import { LevelProgress, Domain } from "./types";

export type Rank =
  | "Explorateur"
  | "Voyageur"
  | "Géographe"
  | "Cartographe"
  | "Expert mondial";

export const rankOrder: Rank[] = [
  "Explorateur",
  "Voyageur",
  "Géographe",
  "Cartographe",
  "Expert mondial",
];

export function computeRank(progress: LevelProgress[]): Rank {
  if (progress.length === 0) return "Explorateur";
  // Score domaine = somme des bestScore de ses 5 niveaux (max 50)
  const domains = new Map<Domain, number>();
  progress.forEach((p) => {
    const prev = domains.get(p.domain) ?? 0;
    domains.set(p.domain, prev + p.bestScore);
  });
  const total = Array.from(domains.values()).reduce((s, v) => s + v, 0);
  // Seuils arbitraires sur la somme (max 300 si 6 domaines)
  if (total >= 230) return "Expert mondial";
  if (total >= 180) return "Cartographe";
  if (total >= 130) return "Géographe";
  if (total >= 80) return "Voyageur";
  return "Explorateur";
}
