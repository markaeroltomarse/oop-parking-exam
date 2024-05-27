import { ParkingSlot } from "./parking-slot.model";

export class Vehicle {
  vehicleId: string;
  size: number; // 0: Small, 1: Medium, 2: Large
  entryTime: Date | null;
  lastExitTime: Date | null;
  slot: ParkingSlot | null;
  lastParkingSlotId: number | null;

  constructor(vehicleId: string, size: number) {
    this.vehicleId = vehicleId;
    this.size = size;
    this.entryTime = null;
    this.lastExitTime = null;
    this.slot = null;
    this.lastParkingSlotId = null;
  }
}
