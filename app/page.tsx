"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import WorldMap from "@/components/WorldMap";
import { useGame } from "@/context/GameContext";
import MapLegend from "@/components/MapLegend";

export default function Home() {
  const { rank } = useGame();

  return (
    <main className="min-h-screen px-5 py-10 flex flex-col gap-8 md:px-12">
      <header className="flex flex-col gap-4 text-center md:text-left">
        <Badge label={`Rang actuel : ${rank}`} tone="info" />
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          GeoLoulou — apprends la géographie en jouant
        </h1>
        <p className="text-slate-200 text-lg md:w-2/3">
          Deux parcours : Mode Libre pour explorer sans limite, Mode Progression
          pour gravir les niveaux, marquer des points et débloquer des rangs.
          Pensé mobile-first, avec carte interactive.
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
            <p className="text-sm text-slate-300">
              Carte simplifiée (tap pour tester)
            </p>
            <h2 className="text-xl font-semibold">Connaissance des Pays</h2>
          </div>
        </div>
        <WorldMap />
        <MapLegend />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Mode Libre",
            text: "Choisis le thème (pays, capitales, drapeaux) et la zone. Questions infinies, feedback immédiat.",
          },
          {
            title: "Mode Progression",
            text: "Niveaux de 10 questions, chrono sur les niveaux avancés, score minimum 7/10 pour débloquer.",
          },
          {
            title: "Rangs",
            text: "Explorateur → Voyageur → Géographe → Cartographe → Expert mondial selon tes scores moyens.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="card rounded-2xl p-4 flex flex-col gap-2"
          >
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-sm text-slate-200">{item.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
