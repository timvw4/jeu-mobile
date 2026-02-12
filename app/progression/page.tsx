"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ProgressBar";
import WorldMap from "@/components/WorldMap";
import { domains, levelsByDomain } from "@/lib/levels";
import { generateLevelQuestions } from "@/lib/questions";
import { Domain, Question } from "@/lib/types";
import { countries } from "@/data/countries";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";

type StepState = "idle" | "running" | "ended";

export default function ProgressionPage() {
  const { levelProgress, updateMapState, completeLevel, rank, domainScores, totalScore } =
    useGame();
  const { user, profile } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<Domain>("Monde");
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [step, setStep] = useState<StepState>("idle");
  const [timer, setTimer] = useState<number | null>(null);
  const validateRef = useRef<(c: string | boolean | null) => void>(() => {});
  const levels = levelsByDomain.filter((l) => l.domain === selectedDomain);
  const active = levels.find((l) => l.id === selectedLevel)!;
  const progress = levelProgress.find(
    (l) => l.levelId === selectedLevel && l.domain === selectedDomain
  ) || { levelId: selectedLevel, domain: selectedDomain, unlocked: true, completed: false, bestScore: 0, lastScore: 0 };
  const currentQuestion = questions[currentIndex];
  const authLocked = !user;

  const startLevel = () => {
    const qs = generateLevelQuestions(selectedLevel, selectedDomain);
    setQuestions(qs);
    setCurrentIndex(0);
    setScore(0);
    setStep("running");
    setTimer(active.timer ?? null);
    const first = qs[0];
    if (first?.type === "mapClick") {
      updateMapState(first.correctIso, "en-cours");
    }
  };

  const validate = (choice: string | boolean | null) => {
    if (!currentQuestion) return;
    let good = false;
    if (currentQuestion.type === "trueFalse" && typeof choice === "boolean") {
      good = choice === currentQuestion.isTrueAnswer;
    } else if (typeof choice === "string") {
      good = choice === currentQuestion.correctIso;
    }

    if (good) {
      setScore((s) => s + 1);
      updateMapState(currentQuestion.correctIso, "reussi");
    } else {
      updateMapState(currentQuestion.correctIso, "erreur");
    }
    const nextIndex = currentIndex + 1;
    if (nextIndex >= 10) {
      setStep("ended");
      completeLevel(selectedDomain, selectedLevel, score + (good ? 1 : 0));
      setTimer(null);
    } else {
      setCurrentIndex(nextIndex);
      if (active.timer) setTimer(active.timer);
      const nextQ = questions[nextIndex];
      if (nextQ?.type === "mapClick") {
        updateMapState(nextQ.correctIso, "en-cours");
      }
    }
  };

  useEffect(() => {
    validateRef.current = validate;
    // dépend volontairement figée, validate est ré-évaluée par le setter précédent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (timer === null || step !== "running") return;
    const id = setTimeout(() => {
      setTimer((t) => {
        const next = (t ?? 1) - 1;
        if (next <= 0) {
          validateRef.current(null);
          return null;
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [timer, step]);

  useEffect(() => {
    if (step !== "running") return;
    if (currentQuestion?.type === "mapClick") {
      updateMapState(currentQuestion.correctIso, "en-cours");
    }
  }, [currentQuestion, step, updateMapState]);

  const currentOptions = useMemo(() => {
    if (!currentQuestion || !currentQuestion.options) return [];
    return currentQuestion.options.map((iso, idx) => ({
      iso,
      label: displayOption(currentQuestion, iso, currentQuestion.displayValue?.[idx]),
    }));
  }, [currentQuestion]);

  const progressValue = step === "ended" ? 10 : currentIndex;

  return (
    <main className="min-h-screen px-5 py-8 md:px-10 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Button
            asLink="/modes"
            variant="ghost"
            className="!w-10 !h-10 rounded-full p-0 flex items-center justify-center"
            aria-label="Retour au choix des modes"
          >
            ←
          </Button>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-300">Mode Progression</p>
            <Button
              asLink="/auth"
              variant="ghost"
              className="!w-auto !h-10 !px-4 !py-2 rounded-xl"
            >
              {user ? profile.pseudo ?? "Profil" : "Compte"}
            </Button>
          </div>
        </div>
        <h1 className="text-3xl font-bold">Gravis les niveaux</h1>
        <p className="text-slate-200">
          10 questions par niveau. Score minimum 7/10 pour débloquer le
          suivant.
        </p>
        <div className="flex flex-col items-start gap-2">
          <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-100 font-semibold">
            Score total : {totalScore}/300
          </span>
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-100 font-semibold">
            Rang : {rank}
          </span>
        </div>
        {authLocked && (
          <div className="mt-2 rounded-xl bg-amber-500/15 border border-amber-400/40 px-3 py-2 text-sm text-amber-100">
            Connecte-toi pour lancer les niveaux et sauvegarder ta progression.
          </div>
        )}
        <div className="border-b border-white/10 my-2" />
        <div className="flex flex-wrap gap-2 mt-2">
          {domains.map((d) => (
            <button
              key={d}
              onClick={() => {
                setSelectedDomain(d);
                setSelectedLevel(1);
                setStep("idle");
                setQuestions([]);
                setCurrentIndex(0);
                setScore(0);
              }}
              className={`rounded-full px-3 py-2 text-sm font-semibold ${
                selectedDomain === d
                  ? "bg-cyan-500 text-white"
                  : "bg-white/5 text-slate-200"
              }`}
            >
              {d} ({domainScores[d]}/50)
            </button>
          ))}
        </div>
      </header>

      <section className="card rounded-3xl p-4 space-y-3">
        <h2 className="text-lg font-semibold">Niveaux</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {levels.map((level) => {
            const prog =
              levelProgress.find(
                (p) => p.levelId === level.id && p.domain === selectedDomain
              ) ||
              { levelId: level.id, domain: selectedDomain, unlocked: level.id === 1, completed: false, bestScore: 0, lastScore: 0 };
            const locked = !prog.unlocked;
            return (
              <button
                key={level.id}
                disabled={locked}
              onClick={() => {
                setSelectedLevel(level.id);
                setStep("idle");
                setQuestions([]);
                setCurrentIndex(0);
                setScore(0);
                setTimer(null);
              }}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  selectedLevel === level.id
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-white/10 bg-white/5"
                } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">
                    Niv. {level.id} — {level.title}
                  </p>
                  <span className="text-xs text-slate-300">
                    {prog.bestScore}/10
                  </span>
                </div>
                <p className="text-sm text-slate-200">{level.description}</p>
                {level.timer && (
                  <p className="text-xs text-amber-300 mt-1">
                    Chrono {level.timer}s
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card rounded-3xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Niveau sélectionné</p>
            <h2 className="text-xl font-semibold">
              Niveau {active.id} — {active.title}
            </h2>
          </div>
          <Button
            onClick={startLevel}
            disabled={!progress.unlocked || authLocked}
            className="w-fit"
          >
            {step === "running" ? "Recommencer" : "Lancer"}
          </Button>
        </div>

        <ProgressBar value={progressValue} max={10} />
        {active.timer && step === "running" && (
          <p className="text-sm text-amber-200">
            Temps restant : {timer ?? active.timer}s
          </p>
        )}

        {step !== "running" && (
          <p className="text-sm text-slate-300">
            Appuie sur Lancer pour répondre à 10 questions. Les niveaux avancés
            ajoutent du chrono et des pièges.
          </p>
        )}

        {step === "running" && currentQuestion && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{currentQuestion.prompt}</h3>
            {currentQuestion.statement && (
              <p className="text-sm text-slate-200">{currentQuestion.statement}</p>
            )}
            {currentQuestion.type === "mapClick" ? (
              <div className="space-y-2">
                <WorldMap
                  targetIso={currentQuestion.correctIso}
                  onSelect={(iso) => validate(iso)}
                  height={230}
                />
              </div>
            ) : currentQuestion.type === "trueFalse" ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => validate(true)}
                  className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-center hover:bg-white/10 transition"
                >
                  Vrai
                </button>
                <button
                  onClick={() => validate(false)}
                  className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-center hover:bg-white/10 transition"
                >
                  Faux
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentOptions.map((opt) => (
                  <button
                    key={opt.iso}
                    onClick={() => validate(opt.iso)}
                    className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 hover:bg-white/10 transition text-3xl flex items-center justify-center"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "ended" && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-lg font-semibold">
              Score : {score}/10 {score >= 7 ? "✅ Niveau débloqué" : "❌ À refaire"}
            </p>
            <p className="text-sm text-slate-200">
              Rejoue pour améliorer ton meilleur score et monter de rang.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function displayOption(
  question: Question,
  iso: string,
  displayValue?: string
) {
  const country = countries.find((c) => c.iso === iso);
  if (!country) return iso;
  if (question.type === "countryToCurrency") {
    return displayValue ?? country.currency;
  }
  switch (question.type) {
    case "capitalToCountry":
    case "flagToCountry":
    case "mapClick":
    case "populationToCountry":
      return country.name;
    case "countryToCapital":
      return country.capital;
    case "countryToFlag":
      return country.flag;
    default:
      return country.name;
  }
}
