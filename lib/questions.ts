import { countries, Country } from "@/data/countries";
import { levelsByDomain } from "./levels";
import { Domain, LevelConfig, Question, QuestionType, Zone } from "./types";

const continentsMap: Record<Zone, Country[]> = {
  Monde: countries,
  Europe: countries.filter((c) => c.continent === "Europe"),
  Afrique: countries.filter((c) => c.continent === "Afrique"),
  Asie: countries.filter((c) => c.continent === "Asie"),
  Amériques: countries.filter((c) => c.continent === "Amériques"),
  Océanie: countries.filter((c) => c.continent === "Océanie"),
};

const questionTypesOrder: QuestionType[] = [
  "capitalToCountry",
  "countryToCapital",
  "flagToCountry",
  "countryToFlag",
  "mapClick",
  "trueFalse",
  "populationToCountry",
  "countryToCurrency",
];

function pickRandom<T>(list: T[], count = 1): T | T[] {
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return count === 1 ? shuffled[0] : shuffled.slice(0, count);
}

function buildIsoOptions(correctIso: string, pool: Country[], traps = false) {
  const candidates = pool.filter((c) => c.iso !== correctIso);
  const distractors = (pickRandom(
    traps ? candidates : candidates.slice(0, candidates.length),
    3
  ) as Country[]).map((c) => c.iso);
  return [...distractors, correctIso].sort(() => Math.random() - 0.5);
}

function sanitizeSequence(types: QuestionType[], allowed: QuestionType[]) {
  const pool = types.filter((t) => allowed.includes(t));
  const result: QuestionType[] = [];
  let idx = 0;
  while (result.length < 10) {
    const candidate = pool[idx % pool.length] ?? allowed[idx % allowed.length];
    const last = result[result.length - 1];
    if (last && last === candidate) {
      const alt = allowed.find((t) => t !== last) ?? candidate;
      result.push(alt);
    } else {
      result.push(candidate);
    }
    idx++;
  }
  return result;
}

function asZone(zone: Zone | "Mix"): Zone {
  return zone === "Mix" ? "Monde" : zone;
}

function makeQuestion(type: QuestionType, target: Country, pool: Country[], traps: boolean): Question {
  const options = buildIsoOptions(target.iso, pool, traps);
  const base = {
    id: `${type}-${target.iso}-${Math.random().toString(36).slice(2, 6)}`,
    correctIso: target.iso,
    explanation: target.fact,
    targetName: target.name,
    targetCapital: target.capital,
    targetFlag: target.flag,
    type,
  };

  switch (type) {
    case "capitalToCountry":
      return {
        ...base,
        prompt: `À quel pays appartient la capitale ${target.capital} ?`,
        options,
      };
    case "countryToCapital":
      return {
        ...base,
        prompt: `Quelle est la capitale de ${target.name} ?`,
        options,
      };
    case "flagToCountry":
      return {
        ...base,
        prompt: `Quel pays possède ce drapeau ${target.flag} ?`,
        options,
      };
    case "countryToFlag":
      return {
        ...base,
        prompt: `Quel drapeau correspond à ${target.name} ?`,
        options,
      };
    case "mapClick":
      return {
        ...base,
        prompt: `Clique sur ${target.name} sur la carte.`,
      };
    case "trueFalse": {
      const other = pickRandom(pool.filter((c) => c.iso !== target.iso)) as Country;
      const isTrue = Math.random() > 0.5;
      const capital = isTrue ? target.capital : other.capital;
      return {
        ...base,
        prompt: `Vrai ou faux ?`,
        statement: `La capitale de ${target.name} est ${capital}.`,
        isTrueAnswer: isTrue,
      };
    }
    case "populationToCountry": {
      const approx = Math.round(target.population);
      return {
        ...base,
        prompt: `Quel pays compte environ ${approx} millions d'habitants ?`,
        options,
      };
    }
    case "countryToCurrency": {
      return {
        ...base,
        prompt: `Quelle est la monnaie utilisée par ${target.name} ?`,
        options,
        displayValue: options.map(
          (iso) => pool.find((c) => c.iso === iso)?.currency ?? iso
        ),
      };
    }
    default:
      return { ...base, prompt: "Question" };
  }
}

export function generateQuestion(theme: QuestionType, zone: Zone, traps = false): Question {
  const pool = zone === "Monde" ? countries : continentsMap[zone] ?? countries;
  const target = pickRandom(pool) as Country;
  return makeQuestion(theme, target, pool, traps);
}

export function generateLevelQuestions(levelId: number, domain: Domain): Question[] {
  const level = levelsByDomain.find(
    (l) => l.id === levelId && l.domain === domain
  ) as LevelConfig;
  const zone = asZone(level.zone);
  const pool = zone === "Monde" ? countries : continentsMap[zone] ?? countries;
  const seq = sanitizeSequence(
    shuffle(questionTypesOrder).concat(shuffle(questionTypesOrder)),
    level.allowedTypes
  );

  const questions: Question[] = [];
  let lastType: QuestionType | null = null;

  for (let i = 0; i < 10; i++) {
    let qType = seq[i % seq.length] ?? level.allowedTypes[0];
    if (lastType === qType) {
      const alternative = level.allowedTypes.find((t) => t !== lastType);
      qType = alternative ?? qType;
    }
    const target = pickRandom(pool) as Country;
    questions.push(makeQuestion(qType, target, pool, !!level.traps));
    lastType = qType;
  }
  return questions;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}
