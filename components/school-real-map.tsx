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
  const weakFactors = point.weakFactors.slice(0, 3).map(escapeHtml).join(", ") || "보강 신호 없음";
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

export function SchoolRealMap({ points }: { points: RealMapPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const plottedPoints = useMemo(() => getPlottedPoints(points), [points]);
  const schematicPoints = useMemo(
    () =>
      points.slice(0, 60).map((point, index) => ({
        ...point,
        left: 8 + ((index * 17) % 84),
        top: 10 + ((index * 29) % 78)
      })),
    [points]
  );

  useEffect(() => {
    if (!plottedPoints.length) return;
    let mounted = true;

    loadLeaflet()
      .then((leaflet) => {
        if (!mounted || !containerRef.current) return;
        if (mapRef.current) mapRef.current.remove();

        const map = leaflet.map(containerRef.current, {
          scrollWheelZoom: false,
          zoomControl: true,
          preferCanvas: true
        });

        mapRef.current = map;

        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          })
          .addTo(map);

        if (plottedPoints.length) {
          const latLngs = plottedPoints.map((point) => [point.plotLatitude, point.plotLongitude] as [number, number]);
          plottedPoints.forEach((point) => {
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
          map.fitBounds(leaflet.latLngBounds(latLngs), { padding: [28, 28], maxZoom: 15 });
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
  }, [plottedPoints]);

  if (!plottedPoints.length && points.length) {
    return (
      <div className="relative h-[560px] min-h-[560px] w-full overflow-hidden bg-slate-50">
        <div className="absolute inset-5 rounded-xl border border-slate-200 bg-white">
          <div className="absolute left-4 top-4 rounded-md bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
            익명화 권역 분포
          </div>
          <div className="absolute inset-0 opacity-80">
            <div className="absolute left-1/3 top-0 h-full border-l border-dashed border-slate-200" />
            <div className="absolute left-2/3 top-0 h-full border-l border-dashed border-slate-200" />
            <div className="absolute left-0 top-1/3 w-full border-t border-dashed border-slate-200" />
            <div className="absolute left-0 top-2/3 w-full border-t border-dashed border-slate-200" />
          </div>
          {schematicPoints.map((point) => (
            <a
              key={point.schoolId}
              href={`/schools/${encodeURIComponent(point.schoolId)}`}
              className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white shadow-md"
              style={{ left: `${point.left}%`, top: `${point.top}%`, background: point.color }}
              title={`${point.schoolName} ${point.score}점`}
            >
              {point.score}
            </a>
          ))}
          <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-white/95 p-3 text-xs font-bold leading-5 text-slate-600 shadow-sm">
            제출용 익명화 모드에서는 실제 좌표를 표시하지 않고 권역화된 분포로 대체합니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[560px] min-h-[560px] w-full overflow-hidden bg-slate-100">
      <div ref={containerRef} className="h-full w-full" aria-label="학교별 AI 교육 지원 소요 실제 지도" />
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-center">
          <p className="max-w-sm text-sm font-bold leading-6 text-slate-700">{error}</p>
        </div>
      ) : null}
      {!error && !plottedPoints.length ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-center">
          <p className="max-w-sm text-sm font-bold leading-6 text-slate-700">표시할 좌표 데이터가 없습니다.</p>
        </div>
      ) : null}
    </div>
  );
}
