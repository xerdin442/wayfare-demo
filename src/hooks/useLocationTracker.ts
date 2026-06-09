import { Coordinate } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';

export const useLocationTracker = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [location, setLocation] = useState<Coordinate>();
  const [mapPosition, setMapPosition] = useState<[number, number] | undefined>();

  // Track user location
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setLocation({
            latitude: lat,
            longitude: lng,
          });

          // Update user position on the map
          setMapPosition([lat, lng]);
        },
        (error) => console.error('User location tracker error:', error),
        { enableHighAccuracy: true },
      );
    }, 3500); // Update user location every 3.5 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { location, mapPosition };
};