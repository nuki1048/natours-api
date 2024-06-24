export interface SimpleTour {
  id: number;
  name: string;
  duration: number;
  maxGroupSize: number;
  difficulty: string;
  ratingsAverage: number;
  ratingsQuantity: number;
  price: number;
  summary: string;
  description: string;
  imageCover: string;
  images: string[];
  startDates: string[];
}

export interface Tour {
  startLocation: StartLocation;
  ratingsAverage: number;
  ratingsQuantity: number;
  images: string[];
  startDates: string[];
  name: string;
  duration: number;
  maxGroupSize: number;
  difficulty: string;
  guides: string[];
  price: number;
  summary: string;
  description: string;
  imageCover: string;
  locations: Location[];
  slug?: string;
}

export interface StartLocation {
  description: string;
  type: string;
  coordinates: number[];
  address: string;
}

export interface Location {
  description: string;
  type: string;
  coordinates: number[];
  day: number;
}

export enum Environment {
  Development = 'development',
  Production = 'production',
}
