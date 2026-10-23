export interface VehicleStats {
  id: string;
  name: string;
  maxSpeed: number; // m/s
  acceleration: number; // m/s² before rolling resistance
  stability: number; // normalized design stat, reserved for future balance
  turnRate: number; // lateral m/s at full steering
}

export const TRADITIONAL_BIKE: Readonly<VehicleStats> = Object.freeze({
  id: "traditional",
  name: "Bici tradicional",
  maxSpeed: 11,
  acceleration: 2.8,
  stability: 0.85,
  turnRate: 2.6,
});

export function selectVehicle(id: string): Readonly<VehicleStats> {
  if (id === TRADITIONAL_BIKE.id) return TRADITIONAL_BIKE;
  throw new Error(`Vehículo no disponible en el MVP: ${id}`);
}
