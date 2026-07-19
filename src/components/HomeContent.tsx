"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Login } from "@/components/Login";
import { Driver, Rider, UserType } from "@/lib/types";
import { useSessionStore } from "@/lib/store/session";

const DriverMap = dynamic(
  () => import("@/components/DriverMap").then((mod) => mod.DriverMap),
  { ssr: false },
);
const RiderMap = dynamic(() => import("@/components/RiderMap"), { ssr: false });

export function HomeContent() {
  const [userType, setUserType] = useState<UserType>();
  const [profile, setProfile] = useState<Driver | Rider>();

  const { sessionExpired, clearExpired } = useSessionStore();
  const effectiveProfile = sessionExpired ? undefined : profile;

  const handleUserTypeSelection = (type: UserType) => {
    if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") {
      setUserType(type);
      return;
    }

    // Check if browser supports geolocation
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    // Trigger the browser permissions popup
    navigator.geolocation.getCurrentPosition(
      () => setUserType(type),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert("Please enable location access to use Wayfare");
        } else {
          alert("Failed to fetch current location. Please try again");
        }
      },
      { enableHighAccuracy: true },
    );
  };

  const handleLoginSuccess = (p: Driver | Rider) => {
    clearExpired();
    setProfile(p);
  };

  return (
    <>
      {!userType && (
        <div className="flex flex-col items-center justify-center h-screen gap-6 px-4 bg-gray-50">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Welcome to Wayfare
            </h2>
            <p className="text-gray-600 mb-8">
              Choose how you&apos;d like to use our service today
            </p>
            <div className="space-y-4">
              <Button
                className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
                onClick={() => handleUserTypeSelection("rider")}
              >
                I Need a Ride
              </Button>
              <Button
                className="w-full text-lg py-6"
                variant="outline"
                onClick={() => handleUserTypeSelection("driver")}
              >
                I Want to Drive
              </Button>
            </div>
          </div>
        </div>
      )}

      {userType && !effectiveProfile && (
        <Login
          userType={userType}
          sessionExpired={sessionExpired}
          onSuccess={handleLoginSuccess}
          onBack={() => {
            clearExpired();
            setUserType(undefined);
          }}
        />
      )}

      {userType === "driver" && effectiveProfile && (
        <DriverMap user={effectiveProfile as Driver} />
      )}

      {userType === "rider" && effectiveProfile && (
        <RiderMap user={effectiveProfile as Rider} />
      )}
    </>
  );
}
