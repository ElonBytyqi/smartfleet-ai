// ===== Statuset =====

export const DroneStatus = {
  Available: "Available",
  InMission: "InMission",
  Maintenance: "Maintenance",
  Grounded: "Grounded",
} as const;

export const BatteryStatus = {
  Available: "Available",
  InUse: "InUse",
  Charging: "Charging",
  NeedsReplacement: "NeedsReplacement",
} as const;

export const MissionStatus = {
  Planned: "Planned",
  Approved: "Approved",
  InProgress: "InProgress",
  Completed: "Completed",
  Cancelled: "Cancelled",
  Aborted: "Aborted",
} as const;

export const MaintenanceStatus = {
  Scheduled: "Scheduled",
  InProgress: "InProgress",
  Completed: "Completed",
} as const;

export const PilotStatus = {
  Active: "Active",
  Suspended: "Suspended",
  Inactive: "Inactive",
} as const;

// ===== Rolet =====

export const Role = {
  Admin: "Admin",
  FleetManager: "FleetManager",
  Pilot: "Pilot",
  MaintenanceTechnician: "MaintenanceTechnician",
  Operator: "Operator",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  Admin: "Administrator",
  FleetManager: "Menaxher flote",
  Pilot: "Pilot",
  MaintenanceTechnician: "Teknik mirëmbajtjeje",
  Operator: "Operator",
};

// ===== Tipet e misionit dhe zonës =====

export const MISSION_TYPES = [
  "Agriculture",
  "Infrastructure",
  "Energy",
  "Environmental",
  "Mapping",
] as const;

export const TYPE_LABELS: Record<string, string> = {
  Agriculture: "Bujqësi",
  Infrastructure: "Infrastrukturë",
  Energy: "Energji",
  Environmental: "Ambient",
  Mapping: "Hartografi",
};

// ===== Mirëmbajtja =====

export const MAINTENANCE_TYPES = [
  { value: 0, key: "Scheduled", label: "E planifikuar" },
  { value: 1, key: "Corrective", label: "Riparim" },
  { value: 2, key: "Predictive", label: "Parandaluese" },
] as const;

// ===== Etiketat e statuseve në shqip =====

export const STATUS_LABELS: Record<string, string> = {
  Available: "I lirë",
  InMission: "Në mision",
  Maintenance: "Në servis",
  Grounded: "I ndaluar",
  InUse: "Në përdorim",
  Charging: "Duke u karikuar",
  NeedsReplacement: "Për zëvendësim",
  Planned: "I planifikuar",
  Approved: "I aprovuar",
  InProgress: "Në progres",
  Completed: "I përfunduar",
  Cancelled: "I anuluar",
  Aborted: "I ndërprerë",
  Scheduled: "I planifikuar",
  Active: "Aktiv",
  Suspended: "I pezulluar",
  Inactive: "Joaktiv",
};

// ===== Pragjet =====

export const THRESHOLDS = {
  batteryLow: 80,
  batteryCritical: 70,
  certificationExpiryDays: 45,
} as const;


// ===== Komponentët e dronit =====

export const COMPONENT_TYPES = [
  "Motor",
  "Propeller",
  "Camera",
  "GPS",
  "FlightController",
  "Gimbal",
  "Landing gear",
  "Antenna",
  "Sensor",
] as const;

export const COMPONENT_LABELS: Record<string, string> = {
  Motor: "Motor",
  Propeller: "Helikë",
  Camera: "Kamerë",
  GPS: "GPS",
  FlightController: "Kontrolluesi i fluturimit",
  Gimbal: "Gimbal",
  "Landing gear": "Këmbët e uljes",
  Antenna: "Antenë",
  Sensor: "Sensor",
};

export const COMPONENT_STATUSES = ["OK", "NeedsInspection", "Replaced"] as const;

export const COMPONENT_STATUS_LABELS: Record<string, string> = {
  OK: "Në rregull",
  NeedsInspection: "Për inspektim",
  Replaced: "I zëvendësuar",
};


// ===== Audit =====

export const AUDIT_ACTIONS = ["Created", "Updated", "Deleted"] as const;

export const ACTION_LABELS: Record<string, string> = {
  Created: "Krijuar",
  Updated: "Ndryshuar",
  Deleted: "Fshirë",
};

export const ENTITY_LABELS: Record<string, string> = {
  Drone: "Dron",
  DroneModel: "Model droni",
  DroneComponent: "Komponent",
  Battery: "Bateri",
  Pilot: "Pilot",
  Certification: "Certifikatë",
  FlightZone: "Zonë fluturimi",
  Mission: "Mision",
  MissionWaypoint: "Pikë fluturimi",
  PreFlightChecklist: "Checklist",
  PostFlightReport: "Raport fluturimi",
  MaintenanceRecord: "Mirëmbajtje",
  ApplicationUser: "Përdorues",
};

// Emrat e fushave ne shqip
export const FIELD_LABELS: Record<string, string> = {
  SerialNumber: "Numri serik",
  Nickname: "Nofka",
  Status: "Statusi",
  Title: "Titulli",
  Name: "Emri",
  FullName: "Emri i plotë",
  Email: "Email",
  IsActive: "Aktiv",
  IsRestricted: "E kufizuar",
  IsAutonomous: "Autonom",
  TotalFlightHours: "Orë fluturimi",
  HealthPercentage: "Shëndeti",
  CycleCount: "Cikle",
  CapacityMah: "Kapaciteti",
  DroneId: "Droni",
  PilotId: "Piloti",
  BatteryId: "Bateria",
  FlightZoneId: "Zona",
  MissionType: "Tipi i misionit",
  ZoneType: "Tipi i zonës",
  ScheduledStart: "Fillimi",
  ScheduledEnd: "Mbarimi",
  ActualStart: "Nisja reale",
  ActualEnd: "Mbarimi real",
  Description: "Përshkrimi",
  Cost: "Kostoja",
  LicenseNumber: "Numri i licencës",
  ExpiryDate: "Skadon",
  MaxAltitudeMeters: "Lartësia maksimale",
  ComponentType: "Tipi i komponentit",
  ExpectedLifespanHours: "Jetëgjatësia",
};


export const ALERT_SEVERITY: Record<string, { label: string; color: string }> = {
  Info:     { label: "Info",     color: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  Warning:  { label: "Warning",  color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  Critical: { label: "Critical", color: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export const ALERT_STATUS: Record<string, { label: string; color: string }> = {
  Active:       { label: "Active",       color: "bg-red-500/15 text-red-400 border-red-500/30" },
  Acknowledged: { label: "Acknowledged", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  Resolved:     { label: "Resolved",     color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};