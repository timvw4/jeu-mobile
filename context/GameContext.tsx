"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { levelsByDomain } from "@/lib/levels";
import { computeRank, Rank } from "@/lib/rank";
import { Domain, LevelProgress, MapStatus } from "@/lib/types";

type GameContextType = {
  levelProgress: LevelProgress[];
  domainScores: Record<Domain, number>;
  totalScore: number;
  mapStates: Record<string, MapStatus>;
  rank: Rank;
  updateMapState: (iso: string, status: MapStatus) => void;
  completeLevel: (domain: Domain, levelId: number, score: number) => void;
  resetLevel: (domain: Domain, levelId: number) => void;
};

const GameContext = createContext<GameContextType | null>(null);

const initialProgress: LevelProgress[] = levelsByDomain.map((level, index) => ({
  levelId: level.id,
  domain: level.domain ?? "Monde",
  unlocked: index % 5 === 0, // premier niveau de chaque domaine
  completed: false,
  bestScore: 0,
  lastScore: 0,
}));

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [levelProgress, setLevelProgress] =
    useState<LevelProgress[]>(initialProgress);
  const [mapStates, setMapStates] = useState<Record<string, MapStatus>>({});

  const domainScores = useMemo(() => {
    const scores: Record<Domain, number> = {
      Monde: 0,
      Europe: 0,
      Afrique: 0,
      Asie: 0,
      Amériques: 0,
      Océanie: 0,
    };
    levelProgress.forEach((lvl) => {
      scores[lvl.domain] = (scores[lvl.domain] ?? 0) + lvl.bestScore;
    });
    return scores;
  }, [levelProgress]);

  const totalScore = useMemo(
    () => Object.values(domainScores).reduce((s, v) => s + v, 0),
    [domainScores]
  );

  const rank = useMemo(() => computeRank(levelProgress), [levelProgress]);

  const updateMapState = (iso: string, status: MapStatus) => {
    setMapStates((prev) => ({
      ...prev,
      [iso]: status,
    }));
  };

  const completeLevel = (domain: Domain, levelId: number, score: number) => {
    setLevelProgress((prev) => {
      const updated = prev.map((lvl) => {
        if (lvl.levelId !== levelId || lvl.domain !== domain) return lvl;
        const bestScore = Math.max(lvl.bestScore, score);
        const completed = score >= 7;
        return {
          ...lvl,
          completed: completed || lvl.completed,
          lastScore: score,
          bestScore,
        };
      });

      const domainLevels = updated
        .filter((l) => l.domain === domain)
        .sort((a, b) => a.levelId - b.levelId);
      const currentIndex = domainLevels.findIndex((lvl) => lvl.levelId === levelId);
      if (score >= 7 && currentIndex !== -1 && domainLevels[currentIndex + 1]) {
        const next = domainLevels[currentIndex + 1];
        const idxGlobal = updated.findIndex(
          (l) => l.levelId === next.levelId && l.domain === next.domain
        );
        if (idxGlobal !== -1) {
          updated[idxGlobal] = { ...updated[idxGlobal], unlocked: true };
        }
      }
      return updated;
    });
  };

  const resetLevel = (domain: Domain, levelId: number) => {
    setLevelProgress((prev) =>
      prev.map((lvl) =>
        lvl.levelId === levelId && lvl.domain === domain
          ? { ...lvl, lastScore: 0, completed: false }
          : lvl
      )
    );
  };

  const value: GameContextType = {
    levelProgress,
    domainScores,
    totalScore,
    mapStates,
    rank,
    updateMapState,
    completeLevel,
    resetLevel,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame doit être utilisé dans GameProvider");
  }
  return ctx;
}
