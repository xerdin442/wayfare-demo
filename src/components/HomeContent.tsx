"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { CarPackageSlug, DriverTier, UserType } from "@/lib/types";

// Dynamic imports
const DriverMap = dynamic(
  () => import("@/components/DriverMap").then((mod) => mod.DriverMap),
  { ssr: false },
);
const RiderMap = dynamic(() => import("@/components/RiderMap"), { ssr: false });

export function HomeContent() {
  const [userType, setUserType] = useState<UserType>();

  const handleUserTypeSelection = (type: UserType) => {
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

      {userType === "driver" && (
        <DriverMap
          user={{
            id: "drv_8f2a1c9e4d3b",
            name: "Sarah Jenkins",
            email: "sarah.j@ridebebedi.com",
            phone: "+15550192834",
            profilePicture:
              "https://randomuser.me/api/portraits/women/89.jpg",
            carModel: "Tesla Model Y",
            carColor: "Blue",
            carPlate: "7XYZ89",
            packageSlug: CarPackageSlug.SEDAN,
            currentRating: 4.72,
            totalCompletedTrips: 1428,
            tier: DriverTier.GOLD,
          }}
        />
      )}
      {userType === "rider" && (
        <RiderMap
          user={{
            id: "rid_9g3b2d0f5e4c",
            name: "John Doe",
            email: "john.d@ridebebedi.com",
            phone: "+15550192835",
            profilePicture:
              "https://randomuser.me/api/portraits/men/41.jpg",
          }}
        />
      )}
    </>
  );
}
