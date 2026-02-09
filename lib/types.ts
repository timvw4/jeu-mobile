import { Continent } from "@/data/countries";

export type Theme = "pays" | "capitales" | "drapeaux";
export type Zone = "Monde" | Continent;
export type Domain = Zone; // domaines de progression = continents + Monde

export type QuestionType =
  | "capitalToCountry" // QCM capitale -> pays
  | "countryToCapital" // QCM pays -> capitale
  | "flagToCountry" // Drapeau -> pays
  | "countryToFlag" // Pays -> drapeau
  | "mapClick" // Cliquer sur le pays
  | "trueFalse" // Vrai / Faux
  | "populationToCountry" // population -> pays
  | "countryToCurrency"; // pays -> monnaie

export type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  correctIso: string;
  options?: string[]; // ISO pour QCM
  statement?: string; // Pour Vrai/Faux
  isTrueAnswer?: boolean; // Pour Vrai/Faux
  displayValue?: string[]; // Optionnel pour afficher autre chose que l'ISO (monnaie)
  explanation: string;
  targetName: string;
  targetCapital: string;
  targetFlag: string;
};

export type MapStatus = "non-vu" | "en-cours" | "reussi" | "erreur";

export type LevelConfig = {
  id: number;
  title: string;
  description: string;
  zone: Zone | "Mix";
  domain?: Domain; // spécifie le domaine si besoin
  timer?: number;
  traps?: boolean;
  usesMap?: boolean;
  allowedTypes: QuestionType[];
};

export type LevelProgress = {
  domain: Domain;
  levelId: number;
  unlocked: boolean;
  completed: boolean;
  bestScore: number;
  lastScore: number;
};
