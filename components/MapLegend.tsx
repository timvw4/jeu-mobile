import { MapStatus } from "@/lib/types";

const legend: { label: string; status: MapStatus }[] = [
  { label: "Non vu", status: "non-vu" },
  { label: "En cours", status: "en-cours" },
  { label: "Réussi", status: "reussi" },
  { label: "Erreur", status: "erreur" },
];

const color: Record<MapStatus, string> = {
  "non-vu": "#94a3b8",
  "en-cours": "#fbbf24",
  reussi: "#22c55e",
  erreur: "#ef4444",
};

export default function MapLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-sm text-slate-200">
      {legend.map((item) => (
        <span key={item.status} className="inline-flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full border border-slate-700"
            style={{ backgroundColor: color[item.status] }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
