import { create } from "zustand";
import { Trip } from "../types";
import { TripEvents } from "../contracts/websocket";

interface DriverTripStore {
  tripStatus: TripEvents | null;
  requestedTrip: Trip | null;

  setTripStatus: (status: TripEvents | null) => void;
  setRequestedTrip: (trip: Trip | null) => void;
  resetDriverTrip: () => void;
}

const initialState = {
  tripStatus: null,
  requestedTrip: null,
};

export const useDriverTripStore = create<DriverTripStore>((set) => ({
  ...initialState,

  setTripStatus: (status) => set({ tripStatus: status }),
  setRequestedTrip: (trip) => set({ requestedTrip: trip }),
  resetDriverTrip: () => set(initialState),
}));
