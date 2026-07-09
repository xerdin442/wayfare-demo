"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { RegionBounds } from "@/lib/types";
import { LocationDataResponse } from "@/lib/contracts/http";

interface MapSearchOverlayProps {
  regionBounds: RegionBounds | null;
  tripPreview: boolean;
  onSelect: (lat: number, lon: number, address: string) => void;
}

export default function MapSearchOverlay({
  regionBounds,
  tripPreview,
  onSelect,
}: MapSearchOverlayProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<LocationDataResponse[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setResults([]);
      if (!q || !regionBounds) return;

      try {
        const viewbox = `${regionBounds.min_longitude},${regionBounds.min_latitude},${regionBounds.max_longitude},${regionBounds.max_latitude}`;
        const params = new URLSearchParams({ q, viewbox });

        const res = await fetch(`/api/autocomplete?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setResults(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (e) {
        console.error(e);
      }
    }, 350);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [q, regionBounds]);

  return (
    <div className="absolute z-50 top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] md:right-4 md:left-auto md:translate-x-0 md:w-80">
      <div className="bg-white rounded-md shadow p-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            className="flex-1 outline-none text-sm"
            placeholder="Search destination"
            disabled={tripPreview}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {results.length > 0 && (
          <ul className="mt-2">
            {results.map((r) => (
              <li
                key={r.place_id}
                className="py-2 px-1 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-sm"
                onClick={() => {
                  setQ("");
                  setResults([]);
                  onSelect(
                    parseFloat(r.lat),
                    parseFloat(r.lon),
                    r.display_name,
                  );
                }}
              >
                <MapPin className="h-8 w-8 text-gray-700" />
                <span className="truncate">{r.display_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
