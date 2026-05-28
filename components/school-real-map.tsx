"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type LeafletMap = {
  remove: () => void;
  fitBounds: (bounds: unknown, options?: Record<string, unknown>) => void;
  setView: (center: [number, number], zoom: number) => void;
  invalidateSize: () => void;
};

type LeafletNamespace = {
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options?: Record<string, unknown>) => { addTo: (map: LeafletMap) => unknown };
  marker: (
    latLng: [number, number],
    options?: Record<string, unknown>
  ) => { addTo: (map: LeafletMap) => { bindPopup: (html: string) => unknown } };
  divIcon: (options: Record<string, unknown>) => unknown;
  latLngBounds: (latLngs: [number, number][]) => unknown;
};

declare global {
  interface Window {
    L?: LeafletNamespace;
    __leafletLoading?: Promise<LeafletNamespace>;
  }
}

export type RealMapPoint = {
  schoolId: string;
  schoolName: string;
  score: number;
  levelLabel: string;
  bucketLabel: string;
  color: string;
  address?: string;
  schoolLevel?: string;
  latitude?: number;
  longitude?: number;
  weakFactors: string[];
  recommendedSupports: string[];
};

type PlottedPoint = RealMapPoint & {
  plotLatitude: number;
  plotLongitude: number;
  isSynthetic?: boolean;
};

const leafletCssId = "leaflet-css";
const leafletScriptId = "leaflet-js";

function loadLeaflet() {
  if (typeof window === "undefined") return Promise.reject(new Error("브라우저에서만 지도를 열 수 있습니다."));
  if (window.L) return Promise.resolve(window.L);
  if (window.__leafletLoading) return window.__leafletLoading;

  window.__leafletLoading = new Promise<LeafletNamespace>((resolve, reject) => {
    if (!document.getElementById(leafletCssId)) {
      const link = document.createElement("link");
      link.id = leafletCssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById(leafletScriptId) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => (window.L ? resolve(window.L) : reject(new Error("지도 라이브러리를 불러오지 못했습니다."))));
      existingScript.addEventListener("error", () => reject(new Error("지도 라이브러리를 불러오지 못했습니다.")));
      return;
    }

    const script = document.createElement("script");
    script.id = leafletScriptId;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error("지도 라이브러리를 불러오지 못했습니다.")));
    script.onerror = () => reject(new Error("지도 라이브러리를 불러오지 못했습니다."));
    document.body.appendChild(script);
  });

  return window.__leafletLoading;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function markerHtml(point: RealMapPoint) {
  return `
    <div style="
      width: 34px;
      height: 34px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid #ffffff;
      background: ${point.color};
      color: #ffffff;
      font-size: 11px;
      font-weight: 900;
      box-shadow: 0 8px 18px rgba(15,23,42,0.28);
    ">${point.score}</div>
  `;
}

function popupHtml(point: RealMapPoint) {
  const weakFactors = point.weakFactors.slice(0, 3).map(escapeHtml).join(", ") || "추가 보강 항목 없음";
  const detailHref = `/schools/${encodeURIComponent(point.schoolId)}`;

  return `
    <div style="min-width: 230px; max-width: 280px; font-family: Arial, sans-serif;">
      <div style="font-weight: 900; font-size: 15px; color: #0f172a; line-height: 1.35;">${escapeHtml(point.schoolName)}</div>
      <div style="margin-top: 6px; color: #475569; font-size: 12px; line-height: 1.5;">${escapeHtml(point.schoolLevel ?? "학교급 자료 없음")}</div>
      <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: 900; font-size: 24px; color: #0f172a;">${point.score}</span>
        <span style="border-radius: 4px; padding: 3px 6px; background: #f8fafc; color: #334155; font-size: 12px; font-weight: 700;">${escapeHtml(point.bucketLabel)}</span>
      </div>
      <div style="margin-top: 8px; color: #475569; font-size: 12px; line-height: 1.5;">${escapeHtml(weakFactors)}</div>
      <a href="${detailHref}" style="display: inline-block; margin-top: 10px; color: #1d4ed8; font-size: 12px; font-weight: 800; text-decoration: none;">상세 보기</a>
    </div>
  `;
}

function getPlottedPoints(points: RealMapPoint[]): PlottedPoint[] {
  const coordinatePoints = points.filter(
    (point) => isFiniteNumber(point.latitude) && isFiniteNumber(point.longitude)
  );
  const seen = new Map<string, number>();

  return coordinatePoints.map((point) => {
    const key = `${point.latitude?.toFixed(6)},${point.longitude?.toFixed(6)}`;
    const index = seen.get(key) ?? 0;
    seen.set(key, index + 1);

    if (index === 0) {
      return {
        ...point,
        plotLatitude: point.latitude as number,
        plotLongitude: point.longitude as number
      };
    }

    const angle = (index / 8) * Math.PI * 2;
    const distance = 0.00008 + Math.floor(index / 8) * 0.00004;

    return {
      ...point,
      plotLatitude: (point.latitude as number) + Math.sin(angle) * distance,
      plotLongitude: (point.longitude as number) + Math.cos(angle) * distance
    };
  });
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pseudoRandom(seed: number) {
  let value = seed || 1;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return ((value >>> 0) % 10000) / 10000;
}

function anonymousPlotPosition(point: RealMapPoint, index: number): PlottedPoint {
  const seed = hashString(`${point.schoolId}-${point.schoolName}-${index}`);
  const west = 127.035;
  const east = 127.115;
  const south = 37.61;
  const north = 37.69;
  return {
    ...point,
    plotLatitude: south + pseudoRandom(seed ^ 0x9e3779b9) * (north - south),
    plotLongitude: west + pseudoRandom(seed) * (east - west),
    isSynthetic: true
  };
}

export function SchoolRealMap({ points }: { points: RealMapPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const plottedPoints = useMemo(() => getPlottedPoints(points), [points]);
  const displayPoints = useMemo(
    () => (plottedPoints.length ? plottedPoints : points.map((point, index) => anonymousPlotPosition(point, index))),
    [plottedPoints, points]
  );
  const isAnonymousMap = !plottedPoints.length && points.length > 0;

  useEffect(() => {
    if (!displayPoints.length) return;
    let mounted = true;

    loadLeaflet()
      .then((leaflet) => {
        if (!mounted || !containerRef.current) return;
        if (mapRef.current) mapRef.current.remove();

        const map = leaflet.map(containerRef.current, {
          scrollWheelZoom: false,
          zoomControl: true,
          zoomDelta: 0.5,
          zoomSnap: 0.5,
          preferCanvas: true
        });

        mapRef.current = map;

        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          })
          .addTo(map);

        if (displayPoints.length) {
          const latLngs = displayPoints.map((point) => [point.plotLatitude, point.plotLongitude] as [number, number]);
          displayPoints.forEach((point) => {
            leaflet
              .marker([point.plotLatitude, point.plotLongitude], {
                title: point.schoolName,
                icon: leaflet.divIcon({
                  className: "",
                  html: markerHtml(point),
                  iconSize: [34, 34],
                  iconAnchor: [17, 17],
                  popupAnchor: [0, -16]
                })
              })
              .addTo(map)
              .bindPopup(popupHtml(point));
          });
          if (isAnonymousMap) {
            map.setView([37.65, 127.075], 12.5);
          } else {
            map.fitBounds(leaflet.latLngBounds(latLngs), { padding: [28, 28], maxZoom: 15 });
          }
        } else {
          map.setView([37.654, 127.075], 13);
        }

        window.setTimeout(() => map.invalidateSize(), 120);
      })
      .catch((loadError: Error) => {
        if (mounted) setError(loadError.message);
      });

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [displayPoints, isAnonymousMap]);

  return (
    <div className="relative h-[560px] min-h-[560px] w-full overflow-hidden bg-slate-100">
      <div ref={containerRef} className="h-full w-full" aria-label="학교별 AI 교육 지원 소요 실제 지도" />
      {isAnonymousMap ? (
        <div className="pointer-events-none absolute bottom-4 right-4 rounded-md bg-white/95 px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
          제출용 화면에서는 학교 위치를 가상 배치했습니다.
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-center">
          <p className="max-w-sm text-sm font-bold leading-6 text-slate-700">{error}</p>
        </div>
      ) : null}
      {!error && !displayPoints.length ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-center">
          <p className="max-w-sm text-sm font-bold leading-6 text-slate-700">표시할 좌표 데이터가 없습니다.</p>
        </div>
      ) : null}
    </div>
  );
}
