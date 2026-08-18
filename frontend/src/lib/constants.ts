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