"use client";

import { useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import {
  geoEquirectangular,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import { FeatureCollection, Feature } from "geojson";
import { useGame } from "@/context/GameContext";
import { countries } from "@/data/countries";
import { MapStatus } from "@/lib/types";
import worldData from "world-atlas/countries-50m.json";
import * as isoCountries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

isoCountries.registerLocale(enLocale);

type Props = {
  targetIso?: string;
  onSelect?: (iso: string) => void;
  height?: number;
  showDetails?: boolean;
};

const statusColor: Record<MapStatus, string> = {
  "non-vu": "#94a3b8",
  "en-cours": "#fbbf24",
  reussi: "#22c55e",
  erreur: "#ef4444",
};

export default function WorldMap({
  targetIso,
  onSelect,
  height = 260,
  showDetails = true,
}: Props) {
  const { mapStates } = useGame();
  const [hoverIso, setHoverIso] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const focusRef = useRef({ x: 450, y: 225 });
  const [selected, setSelected] = useState<{
    iso: string;
    name: string;
    capital?: string;
    flag?: string;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { collection, projection } = useMemo(() => {
    const topo = worldData as {
      type: "Topology";
      objects: { countries: object };
    };
    const fc = feature(topo, topo.objects.countries) as FeatureCollection;
    const proj = geoEquirectangular().fitSize(
      [900, 450],
      fc as unknown as GeoPermissibleObjects
    );
    return { collection: fc, projection: proj };
  }, []);

  const path = useMemo(() => geoPath(projection), [projection]);

  const vaticanCentroid = useMemo(() => {
    const match = collection.features.find((f) => normalizeIso(f) === "VA");
    if (!match) return null;
    const centroid = path.centroid(match as unknown as GeoPermissibleObjects);
    if (
      !centroid ||
      Number.isNaN(centroid[0]) ||
      Number.isNaN(centroid[1])
    ) {
      return null;
    }
    return centroid;
  }, [collection.features, path]);

  const handleClick = (iso: string) => {
    const match = collection.features.find((f) => normalizeIso(f) === iso);
    const countryData = countries.find((c) => c.iso === iso);
    if (match) {
      setSelected({
        iso,
        name:
          countryData?.name ??
          (match.properties as { name?: string })?.name ??
          iso,
        capital: countryData?.capital,
        flag: countryData?.flag,
      });
    }
    if (onSelect) onSelect(iso);
  };

  const pickColor = (iso: string) => {
    const state = mapStates[iso];
    if (iso === targetIso) return statusColor["en-cours"];
    return statusColor[state ?? "non-vu"];
  };

  const updateFocusFromEvent = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const modelX = (clientX - rect.left - offset.x) / zoom;
    const modelY = (clientY - rect.top - offset.y) / zoom;
    focusRef.current = { x: modelX, y: modelY };
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-2">
        <p className="text-xs text-slate-300 min-w-[72px]">Zoom: {zoom.toFixed(1)}x</p>
        <input
          type="range"
          min={1.1}
          max={50}
          step={0.1}
          value={zoom}
          onChange={(e) => {
            const nextZoom = parseFloat(e.target.value);
            const currentZoom = zoom;
            const model = focusRef.current;
            setOffset((prev) => ({
              x: prev.x + model.x * (currentZoom - nextZoom),
              y: prev.y + model.y * (currentZoom - nextZoom),
            }));
            setZoom(nextZoom);
          }}
          className="flex-1 accent-cyan-400"
          aria-label="Réglage du zoom"
        />
        <button
          onClick={() => {
            setZoom(1.1);
            setOffset({ x: 0, y: 0 });
          }}
          className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-xs"
        >
          Reset
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 900 450"
        role="img"
        aria-label="Carte du monde interactive"
        style={{ height }}
        className="rounded-2xl w-full card touch-pan-y touch-pinch-zoom"
        onMouseDown={(e) => {
          setDragging(true);
          setStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
          updateFocusFromEvent(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          updateFocusFromEvent(e.clientX, e.clientY);
          if (!dragging) return;
          setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
        }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          setDragging(true);
          setStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
          updateFocusFromEvent(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          updateFocusFromEvent(t.clientX, t.clientY);
          if (!dragging) return;
          setOffset({ x: t.clientX - start.x, y: t.clientY - start.y });
        }}
        onTouchEnd={() => setDragging(false)}
      >
        <defs>
          <linearGradient id="sea" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0b172f" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <g
          style={{
            transformOrigin: "450px 225px",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        >
          <rect
            x={-1500}
            y={-1000}
            width={3900}
            height={3000}
            fill="url(#sea)"
          />
          {collection.features.map((feature: Feature, idx) => {
            const isoRaw = normalizeIso(feature);
            const iso = isoRaw || `feature-${idx}`;
            return (
              <path
                key={iso}
                d={path(feature as unknown as GeoPermissibleObjects) || ""}
                fill={pickColor(iso)}
                stroke="#0b172f"
                strokeWidth={0.4}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                className="transition-all duration-150 cursor-pointer hover:opacity-80"
                onMouseEnter={() => setHoverIso(iso)}
                onMouseLeave={() => setHoverIso(null)}
                onClick={() => handleClick(iso)}
              >
                <title>
                  {(feature.properties as { name?: string })?.name ?? iso}
                </title>
              </path>
            );
          })}
          {vaticanCentroid && (
            <circle
              cx={vaticanCentroid[0]}
              cy={vaticanCentroid[1]}
              r={Math.max(2 / zoom, 0.9)}
              fill={pickColor("VA")}
              fillOpacity={0.6}
              stroke={pickColor("VA")}
              strokeWidth={0.18}
              className="cursor-pointer"
              onMouseEnter={() => setHoverIso("VA")}
              onMouseLeave={() => setHoverIso(null)}
              onClick={() => handleClick("VA")}
            >
              <title>Vatican</title>
            </circle>
          )}
        </g>
        {hoverIso && (
          <text x={20} y={30} className="text-xs fill-white">
            {hoverIso}
          </text>
        )}
      </svg>

      <p className="text-xs text-slate-300 mt-2">
        Carte interactive : tap ou clique un pays pour le sélectionner.
      </p>

      {showDetails && selected && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100">
          <p className="font-semibold flex items-center gap-2">
            <span className="text-lg">{selected.flag ?? "🏳️"}</span>
            {selected.name} ({selected.iso})
          </p>
          {selected.capital && (
            <p className="text-sm text-slate-200">Capitale : {selected.capital}</p>
          )}
          <p className="text-xs text-slate-300">
          </p>
        </div>
      )}
    </div>
  );
}

function normalizeIso(
  feature: Feature & {
    id?: string | number;
    properties?: { iso_a2?: string; iso_a3?: string; iso_n3?: string; name?: string };
  }
) {
  const props = feature.properties ?? {};
  // 1) ISO alpha-2 direct
  const iso2 = cleanIso(props.iso_a2);
  if (iso2) return iso2;
  // 2) ISO alpha-3 convert to alpha-2 via lib si présent
  const iso3 = cleanIso(props.iso_a3);
  if (iso3) {
    const converted = isoCountries.getAlpha2Code(iso3, "en");
    if (converted) return converted.toUpperCase();
  }
  // 3) Nom anglais -> alpha-2 via lib
  if (props.name) {
    const alpha = isoCountries.getAlpha2Code(props.name, "en");
    if (alpha) return alpha.toUpperCase();
  }
  // 4) Correspondance par nom (français/slug)
  const byName = matchCountryByName(props.name);
  if (byName) return byName;
  // 5) fallback sur id (numérique)
  return typeof feature.id === "number" ? String(feature.id) : cleanIso(feature.id);
}

function cleanIso(value?: string | number) {
  if (!value) return "";
  const str = String(value).toUpperCase();
  return str === "-99" ? "" : str;
}

function slugName(value?: string) {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z]/g, "");
}

function matchCountryByName(name?: string) {
  if (!name) return "";
  const target = slugName(name);
  const found = countries.find((c) => slugName(c.name) === target);
  return found?.iso ?? "";
}
