"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import WorldMap from "@/components/WorldMap";
import { countries, continents } from "@/data/countries";
import { generateQuestion } from "@/lib/questions";
import { Question, QuestionType, Theme, Zone } from "@/lib/types";
import { useGame } from "@/context/GameContext";

const themes: Theme[] = ["pays", "capitales", "drapeaux"];

export default function LibrePage() {
  const [theme, setTheme] = useState<Theme>("pays");
  const [zone, setZone] = useState<Zone>("Monde");
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const { updateMapState } = useGame();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pickType = useCallback(
    (prev?: QuestionType): QuestionType => {
      if (theme === "capitales") {
        return prev === "capitalToCountry"
          ? "countryToCapital"
          : "capitalToCountry";
      }
      if (theme === "drapeaux") {
        return prev === "flagToCountry" ? "countryToFlag" : "flagToCountry";
      }
      // pays : alterne map et QCM pays -> capitale
      const sequence: QuestionType[] = ["mapClick", "countryToCapital"];
      return sequence[prev === sequence[0] ? 1 : 0];
    },
    [theme]
  );

  const ask = useCallback(
    (prevType?: QuestionType) => {
      const type = pickType(prevType);
      const next = generateQuestion(type, zone);
      setQuestion(next);
      setFeedback(null);
      setIsCorrect(null);
      updateMapState(next.correctIso, "en-cours");
    },
    [pickType, zone, updateMapState]
  );

  useEffect(() => {
    ask(question?.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, zone]);

  const handleChoice = (iso: string | boolean) => {
    if (!question) return;
    let good = false;
    if (question.type === "trueFalse" && typeof iso === "boolean") {
      good = iso === question.isTrueAnswer;
    } else if (typeof iso === "string") {
      good = iso === question.correctIso;
    }
    setIsCorrect(good);
    const country = countries.find((c) => c.iso === question.correctIso);
    const fact = question.explanation;
    setFeedback(
      good
        ? `Bravo ! ${fact}`
        : `Mauvaise réponse, la bonne était ${country?.name ?? question.correctIso}. ${fact}`
    );
    updateMapState(question.correctIso, good ? "reussi" : "erreur");

    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const renderOptionLabel = (iso: string) => {
    const country = countries.find((c) => c.iso === iso);
    if (!country || !question) return iso;
    switch (question.type) {
      case "capitalToCountry":
      case "flagToCountry":
      case "mapClick":
        return country.name;
      case "countryToCapital":
        return country.capital;
      case "countryToFlag":
        return country.name;
      default:
        return country.name;
    }
  };

  const questionTypeLabel = useMemo(() => {
    if (!question) return "";
    switch (question.type) {
      case "capitalToCountry":
        return "QCM capitale → pays";
      case "countryToCapital":
        return "QCM pays → capitale";
      case "flagToCountry":
        return "Drapeau → pays";
      case "countryToFlag":
        return "Pays → drapeau";
      case "mapClick":
        return "Carte : clique le pays ciblé";
      case "trueFalse":
        return "Vrai ou Faux";
      default:
        return "";
    }
  }, [question]);

  return (
    <main className="min-h-screen px-5 py-8 md:px-10 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Button
            asLink="/"
            variant="ghost"
            className="!w-10 !h-10 rounded-full p-0 flex items-center justify-center"
            aria-label="Retour à l'accueil"
          >
            ←
          </Button>
          <p className="text-sm text-slate-300">Mode Libre</p>
        </div>
        <h1 className="text-3xl font-bold">Entraîne-toi sans limite</h1>
        <p className="text-slate-200">
          Choisis un thème, une zone, réponds et obtiens un feedback immédiat.
        </p>
      </header>

      <section className="card rounded-3xl p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex gap-2">
            {themes.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  theme === t
                    ? "bg-cyan-500 text-white"
                    : "bg-white/5 text-slate-200"
                }`}
              >
                {t === "pays" && "Pays"}
                {t === "capitales" && "Capitales"}
                {t === "drapeaux" && "Drapeaux"}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {["Monde", ...continents].map((z) => (
              <button
                key={z}
                onClick={() => setZone(z as Zone)}
                className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  zone === z ? "bg-blue-500 text-white" : "bg-white/5 text-slate-200"
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card rounded-3xl p-4 flex flex-col gap-4">
        {question && (
          <>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-400 uppercase">
                  {questionTypeLabel}
                </p>
                <h2 className="text-xl font-semibold">{question.prompt}</h2>
                {question.statement && (
                  <p className="text-sm text-slate-200 mt-1">
                    {question.statement}
                  </p>
                )}
            {(question.type === "flagToCountry" ||
              question.type === "countryToFlag") && (
              <div
                className="text-7xl flex items-center justify-center mt-2"
                aria-label="Drapeau à identifier"
              >
                {question.targetFlag}
              </div>
            )}
              </div>
              <Button onClick={() => ask(question.type)} variant="ghost" className="w-fit">
                Nouvelle question
              </Button>
            </div>

            {question.type !== "mapClick" && question.type !== "trueFalse" && question.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {question.options.map((iso) => (
                  <button
                    key={iso}
                    onClick={() => handleChoice(iso)}
                    className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 hover:bg-white/10 transition text-xl sm:text-2xl flex items-center justify-center"
                  >
                    {renderOptionLabel(iso)}
                  </button>
                ))}
              </div>
            )}

            {question.type === "trueFalse" && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleChoice(true)}
                  className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-center hover:bg-white/10 transition"
                >
                  Vrai
                </button>
                <button
                  onClick={() => handleChoice(false)}
                  className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-center hover:bg-white/10 transition"
                >
                  Faux
                </button>
              </div>
            )}

            {question.type === "mapClick" && (
              <div className="flex flex-col gap-2">
                <WorldMap
                  targetIso={question.correctIso}
                  onSelect={(iso) => handleChoice(iso)}
                  height={260}
                />
              </div>
            )}

            {feedback ? (
              <div
                className={`rounded-2xl px-4 py-3 border ${
                  isCorrect
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-amber-500/50 bg-amber-500/10"
                }`}
              >
                <p className="text-sm">{feedback}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-300">
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
