"use client";

import { useEffect, useRef, useState } from "react";

interface RouteMapProps {
  points: Array<{ lat: number; lng: number }>;
  title: string;
}

export function RouteMap({ points, title }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || !points || points.length === 0) return;

    let active = true;

    // Helper to load stylesheet
    function loadStyle(href: string) {
      if (document.querySelector(`link[href="${href}"]`)) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.onload = () => resolve();
        document.head.appendChild(link);
      });
    }

    // Helper to load script
    function loadScript(src: string) {
      if ((window as any).L) return Promise.resolve((window as any).L);
      if (document.querySelector(`script[src="${src}"]`)) {
        return new Promise<any>((resolve) => {
          const check = setInterval(() => {
            if ((window as any).L) {
              clearInterval(check);
              resolve((window as any).L);
            }
          }, 50);
        });
      }
      return new Promise<any>((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve((window as any).L);
        document.body.appendChild(script);
      });
    }

    Promise.all([
      loadStyle("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"),
      loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js")
    ]).then(([_, L]) => {
      if (!active || !containerRef.current) return;

      // Leaflet requires container to not have an existing map initialized on it.
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error(e);
        }
      }

      try {
        // Initialize map
        const map = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: false,
          dragging: !L.Browser.mobile,
          touchZoom: !L.Browser.mobile
        });
        mapRef.current = map;

        // Add TileLayer (CartoDB Positron is very clean and modern - looks like a premium map)
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 19
        }).addTo(map);

        // Convert points to Leaflet latLngs
        const latLngs = points.map(p => [p.lat, p.lng]);

        // Add Polyline for the path
        L.polyline(latLngs, {
          color: "var(--slabai-brand-orange-600)",
          weight: 4,
          opacity: 0.85
        }).addTo(map);

        // Add start marker (blue circle) and end marker (orange circle)
        if (points.length > 0) {
          const start = points[0];
          L.circleMarker([start.lat, start.lng], {
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 1,
            radius: 5
          }).addTo(map);
        }
        if (points.length > 1) {
          const end = points[points.length - 1];
          L.circleMarker([end.lat, end.lng], {
            color: "#f97316",
            fillColor: "#f97316",
            fillOpacity: 1,
            radius: 4
          }).addTo(map);
        }

        // Fit map bounds to show the route
        map.fitBounds(L.polyline(latLngs).getBounds(), {
          padding: [15, 15]
        });

        setLoaded(true);
      } catch (err) {
        console.error("Leaflet init error", err);
      }
    });

    return () => {
      active = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // ignore
        }
        mapRef.current = null;
      }
    };
  }, [points]);

  if (!points || points.length === 0) return null;

  return (
    <div 
      className="route-map" 
      ref={containerRef} 
      role="img" 
      aria-label={title}
      style={{
        height: "180px",
        borderRadius: "var(--slabai-radius-md)",
        border: "1px solid var(--slabai-neutral-200)",
        background: "var(--slabai-neutral-100)",
        overflow: "hidden",
        position: "relative",
        zIndex: 1
      }}
    >
      {!loaded && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--slabai-text-secondary)", fontSize: "var(--slabai-font-sm)" }}>
          Đang tải bản đồ...
        </div>
      )}
    </div>
  );
}
