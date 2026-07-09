export type UserType = "driver" | "rider"

export interface Trip {
	id: string;
	userId: string;
	driverId?: string;
	status: string;
	selectedFare: RideFare;
}

export interface Coordinate {
	latitude: number
	longitude: number
	address?: string
}

export interface RegionBounds {
	region_id: string;
	min_longitude: number;
	min_latitude: number;
	max_longitude: number;
	max_latitude: number;
	unavailable: boolean;
	error?: string;
}

export interface Route {
	geometry: {
		coordinates: Coordinate[]
	}[],
	duration: number,
	distance: number,
}

export enum CarPackageSlug {
	SEDAN = "sedan",
	SUV = "suv",
	LUXURY = "luxury",
}

export enum DriverTier {
	BRONZE = "bronze",
	SILVER = "silver",
	GOLD = "gold",
}

export interface RideFare {
	id: string,
	packageSlug: CarPackageSlug,
	amount: number,
	route: Route,
}

export interface TripPreview {
	route: [number, number][],
	rideFares: RideFare[],
	duration: number,
	distance: number,
}

export interface Driver {
	id: string;
	name: string;
	email: string;
	phone: string;
	profilePicture: string;
	carModel: string;
	carColor: string;
	carPlate: string;
	packageSlug: CarPackageSlug;
	currentRating: number;
	totalCompletedTrips: number;
	tier: DriverTier;
}

export interface Rider {
	id: string;
	name: string;
	email: string;
	phone: string;
	profilePicture: string;
}

export interface RatingRequiredData {
	tripId: string
	pickup: Coordinate
	destination: Coordinate
	date: string
}