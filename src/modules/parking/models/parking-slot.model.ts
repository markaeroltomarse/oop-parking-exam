export class ParkingSlot {
  slotId: number;
  size: number; // 0: Small, 1: Medium, 2: Large
  distances: number[];
  isOccupied: boolean;

  constructor(slotId: number, size: number, distances: number[]) {
    this.slotId = slotId;
    this.size = size;
    this.distances = distances;
    this.isOccupied = false;
  }
}
