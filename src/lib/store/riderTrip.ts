import { create } from "zustand";
import {
  Coordinate,
  Driver,
  RatingRequiredData,
  RegionBounds,
  Trip,
  TripOverview,
} from "../types";
import { TripEvents } from "../contracts/websocket";

interface RiderTripStore {
  tripStatus: TripEvents | null;
  requestedTrip: Trip | null;
  tripRatingData: RatingRequiredData | null;
  assignedDriver: Driver | null;
  driverLocation: Coordinate | null;
  regionBounds: RegionBounds | null;
  tripOverview: TripOverview | null;

  setTripStatus: (status: TripEvents | null) => void;
  setRequestedTrip: (trip: Trip | null) => void;
  setTripRatingData: (data: RatingRequiredData | null) => void;
  setAssignedDriver: (driver: Driver | null) => void;
  setDriverLocation: (location: Coordinate | null) => void;
  setRegionBounds: (bounds: RegionBounds | null) => void;
  setTripOverview: (overview: TripOverview | null) => void;
  resetRiderTrip: () => void;
}

const initialState = {
  tripStatus: null,
  requestedTrip: null,
  tripRatingData: null,
  assignedDriver: null,
  driverLocation: null,
  regionBounds: null,
  tripOverview: null,
};

export const useRiderTripStore = create<RiderTripStore>((set) => ({
  ...initialState,

  setTripStatus: (status) => set({ tripStatus: status }),
  setRequestedTrip: (trip) => set({ requestedTrip: trip }),
  setTripRatingData: (data) => set({ tripRatingData: data }),
  setAssignedDriver: (driver) => set({ assignedDriver: driver }),
  setDriverLocation: (location) => set({ driverLocation: location }),
  setRegionBounds: (bounds) => set({ regionBounds: bounds }),
  setTripOverview: (overview) => set({ tripOverview: overview }),
  resetRiderTrip: () => set(initialState),
}));
