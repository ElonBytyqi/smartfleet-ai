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


export interface Battery {
  id: string;
  serialNumber: string;
  capacityMah: number;
  cycleCount: number;
  healthPercentage: number;
  status: string;
  droneId: string | null;
  droneSerialNumber: string | null;
  purchaseDate: string | null;
  lastInspectionDate: string | null;
}

export interface Certification {
  id: string;
  pilotId: string;
  pilotName: string | null;
  certificationType: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  documentUrl: string | null;
  isExpired: boolean;
  daysUntilExpiry: number;
}

export interface Pilot {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  licenseNumber: string | null;
  totalFlightHours: number;
  status: string;
  certificationCount: number;
  expiringCertificationCount: number;
}

export interface Waypoint {
  id: string;
  sequenceNumber: number;
  latitude: number;
  longitude: number;
  altitudeMeters: number | null;
  actionType: string | null;
}

export interface ConflictCheck {
  hasConflicts: boolean;
  conflicts: string[];
}