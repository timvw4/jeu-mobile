"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { levelsByDomain } from "@/lib/levels";
import { computeRank, Rank } from "@/lib/rank";
import { Domain, LevelProgress, MapStatus } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

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
  const { user } = useAuth();
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

  const buildProgressFromRemote = (rows: { domain: Domain; level: number; score: number }[]) => {
    const base = initialProgress.map((lvl) => ({ ...lvl }));
    rows.forEach((row) => {
      const idx = base.findIndex(
        (l) => l.domain === row.domain && l.levelId === row.level
      );
      if (idx !== -1) {
        base[idx] = {
          ...base[idx],
          bestScore: row.score,
          lastScore: row.score,
          completed: row.score >= 7 || base[idx].completed,
        };
      }
    });
    // Déverrouille les niveaux suivants par domaine en fonction des scores
    const domains: Domain[] = ["Monde", "Europe", "Afrique", "Asie", "Amériques", "Océanie"];
    domains.forEach((d) => {
      const byDomain = base
        .filter((l) => l.domain === d)
        .sort((a, b) => a.levelId - b.levelId);
      byDomain.forEach((lvl, i) => {
        if (i === 0) return;
        const prev = byDomain[i - 1];
        if (prev.completed || prev.bestScore >= 7) {
          const idxGlobal = base.findIndex(
            (l) => l.levelId === lvl.levelId && l.domain === lvl.domain
          );
          if (idxGlobal !== -1) {
            base[idxGlobal] = { ...base[idxGlobal], unlocked: true };
          }
        }
      });
    });
    return base;
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) {
        if (!cancelled) setLevelProgress(initialProgress);
        return;
      }
      const { data, error } = await supabase
        .from("progress")
        .select("domain, level, score")
        .eq("user_id", user.id);
      if (error) {
        console.error("Erreur chargement progression", error);
        return;
      }
      if (cancelled) return;
      const merged = buildProgressFromRemote(data ?? []);
      setLevelProgress(merged);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

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

    // Sauvegarde distante si connecté et email confirmé
    if (user) {
      supabase
        .from("progress")
        .upsert({
          user_id: user.id,
          domain,
          level: levelId,
          score,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.error("Erreur sauvegarde progression", error);
        });
    }
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
