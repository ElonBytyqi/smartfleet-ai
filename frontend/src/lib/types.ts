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


export interface MaintenanceRecord {
  id: string;
  droneId: string;
  droneSerialNumber: string | null;
  droneNickname: string | null;
  technicianId: string;
  technicianName: string | null;
  maintenanceType: string;
  description: string;
  componentId: string | null;
  componentType: string | null;
  performedAt: string;
  nextRecommendedDate: string | null;
  cost: number | null;
  status: string;
}

export interface DroneComponent {
  id: string;
  droneId: string;
  componentType: string;
  serialNumber: string | null;
  installedAt: string;
  expectedLifespanHours: number | null;
  status: string;
}

export interface Checklist {
  id: string;
  missionId: string;
  completedByPilotId: string;
  completedByName: string | null;
  batteryChecked: boolean;
  propellersChecked: boolean;
  gpsSignalOk: boolean;
  weatherConditionsOk: boolean;
  firmwareUpToDate: boolean;
  notes: string | null;
  completedAt: string;
  allChecksPassed: boolean;
}

export interface FlightReport {
  id: string;
  missionId: string;
  missionTitle: string | null;
  submittedByPilotId: string;
  submittedByName: string | null;
  flightDurationMinutes: number;
  batteryUsedPercentage: number | null;
  issuesReported: string | null;
  weatherConditions: string | null;
  summary: string | null;
  aiAnalysisStatus: string;
  submittedAt: string;
}
export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  isActive: boolean;
  roles: string[];
  hasPilotProfile: boolean;
  createdAt: string;
}

export interface RiskFactor {
  name: string;
  value: string;
  score: number;
  weight: number;
}

export interface DroneRisk {
  droneId: string;
  serialNumber: string;
  nickname: string | null;
  modelName: string | null;
  riskScore: number;
  riskLevel: string;
  recommendedAction: string;
  recommendedInspectionDays: number;
  likelyComponent: string | null;
  factors: RiskFactor[];
  telemetryPoints: number;
  assessedAt: string;
}