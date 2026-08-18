// Nje vend i vetem per te gjithe celesat e cache-it
export const qk = {
  drones: ["drones"] as const,
  drone: (id: string) => ["drone", id] as const,
  droneModels: ["drone-models"] as const,

  batteries: ["batteries"] as const,
  batteriesForDrone: (droneId: string) => ["batteries", "drone", droneId] as const,

  missions: ["missions"] as const,
  mission: (id: string) => ["mission", id] as const,
  missionsForDrone: (droneId: string) => ["missions", "drone", droneId] as const,
  waypoints: (missionId: string) => ["waypoints", missionId] as const,
  conflicts: (missionId: string) => ["conflicts", missionId] as const,
  checklist: (missionId: string) => ["checklist", missionId] as const,
  report: (missionId: string) => ["report", missionId] as const,

  pilots: ["pilots"] as const,
  certifications: (pilotId: string) => ["certifications", pilotId] as const,
  expiringCerts: ["expiring-certs"] as const,

  flightZones: ["flight-zones"] as const,
  maintenance: ["maintenance"] as const,
  users: ["users"] as const,
  roles: ["roles"] as const,
  liveFleet: ["live-fleet"] as const,
};