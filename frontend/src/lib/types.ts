export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  roles: string[];
}

export interface Drone {
  id: string;
  serialNumber: string;
  nickname: string | null;
  status: string;
  totalFlightHours: number;
  purchaseDate: string | null;
  droneModelId: string;
  modelName: string | null;
}

export interface Mission {
  id: string;
  title: string;
  missionType: string;
  status: string;
  isAutonomous: boolean;
  flightZoneId: string;
  flightZoneName: string | null;
  droneId: string | null;
  droneSerialNumber: string | null;
  pilotId: string | null;
  pilotLicense: string | null;
  batteryId: string | null;
  batterySerialNumber: string | null;
  scheduledStart: string;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  waypointCount: number;
}

export interface FlightZone {
  id: string;
  name: string;
  zoneType: string;
  polygonGeoJson: string;
  isRestricted: boolean;
  maxAltitudeMeters: number | null;
  missionCount: number;
}