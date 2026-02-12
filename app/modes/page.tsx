"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import WorldMap from "@/components/WorldMap";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";

export default function ModesPage() {
  const { rank } = useGame();
  const { user, profile } = useAuth();

  return (
    <main className="min-h-screen px-5 py-8 md:px-10 flex flex-col gap-6">
      <header className="flex flex-col gap-3 text-center md:text-left">
        <div className="flex items-center justify-between">
          <Badge label={`Rang actuel : ${rank}`} tone="info" />
          <Button
            asLink="/auth"
            variant="ghost"
            className="!w-auto !h-10 !px-4 !py-2 rounded-xl"
          >
            {user ? profile.pseudo ?? "Profil" : "Compte"}
          </Button>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          Choisis ton mode de jeu
        </h1>
        <p className="text-slate-200 text-lg md:w-2/3">
          Mode Libre pour explorer sans limite, Mode Progression pour enchaîner les niveaux.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <Button asLink="/libre">Mode Libre</Button>
          <Button asLink="/progression" variant="ghost">
            Mode Progression
          </Button>
        </div>
      </header>

      <section className="card rounded-3xl p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Carte interactive</p>
            <h2 className="text-xl font-semibold">Aperçu rapide</h2>
          </div>
        </div>
        <WorldMap />
      </section>
    </main>
  );
}
