import { getPercentageOf, getValueFromPercentage } from "@/utils/math.util";
import { ParkingSlot } from "../models/parking-slot.model";
import { Vehicle } from "../models/vehicle.model";

export class ParkingLotService {
  numEntryPoints: number;
  slots: ParkingSlot[];
  vehicles: { [key: string]: Vehicle };

  readonly BASE_RATE = 40;
  readonly EXCEEDING_RATES = [20, 60, 100];
  readonly DAILY_RATE = 5000;

  constructor(
    numEntryPoints: number,
    slotsInfo: number[][],
    slotSizes: number[]
  ) {
    // minimum number of entry points for the parking lot
    this.numEntryPoints = Math.max(3, numEntryPoints);

    // Initiate Parking Slots
    this.slots = slotsInfo.map(
      (distances, i) => new ParkingSlot(i, slotSizes[i], distances)
    );
    this.vehicles = {};
  }

  findNearestSlot(vehicleSize: number, entryPoint: number): ParkingSlot | null {
    // Filter the slots to find those that are not occupied and can accommodate the vehicle size
    const suitableSlots = this.slots.filter(
      (slot) => !slot.isOccupied && slot.size >= vehicleSize
    );

    // Sort the suitable slots based on their distance to the specified entry point
    suitableSlots.sort(
      (a, b) => a.distances[entryPoint] - b.distances[entryPoint]
    );

    // Return the nearest suitable slot if any, otherwise return null
    return suitableSlots.length > 0 ? suitableSlots[0] : null;
  }

  // Check vehicle is does re-parking within first 3 hours of parking
  // Find entry point and parking slot size
  parkVehicle(
    vehicleId: string,
    vehicleSize: number,
    entryPoint: number
  ): number | null {
    let vehicle = this.vehicles[vehicleId];

    // Get current time
    const CURRENT_TIME = new Date();

    if (vehicle) {
      // Adjust the time by adding 3 hours
      let adjustedTime3hrEntryTime = new Date(vehicle.entryTime!);
      adjustedTime3hrEntryTime.setHours(
        adjustedTime3hrEntryTime.getHours() + 3
      );

      // Adjust the time by adding 1 hour
      let adjustedTime1hrLastExitTime = new Date(vehicle.lastExitTime!);
      adjustedTime1hrLastExitTime.setHours(
        adjustedTime1hrLastExitTime.getHours() + 1
      );

      // Check if vehicle re-parking within one hour
      const RETURN_IS_BETWEEN_AN_HOUR =
        CURRENT_TIME <= adjustedTime1hrLastExitTime;

      const IS_WITHIN_3HRS = CURRENT_TIME <= adjustedTime3hrEntryTime;

      if (!(IS_WITHIN_3HRS && RETURN_IS_BETWEEN_AN_HOUR)) {
        // New charge
        // New Entry Time
        vehicle.entryTime = CURRENT_TIME;
        this.vehicles[vehicleId] = vehicle;
      }

      // Return to previews parking slot else find new near
      let returnPrevSlotOrFindNewSlot =
        this.slots.find(
          (slot) => slot.lastVehicleId === vehicle.vehicleId && !slot.isOccupied
        ) || this.findNearestSlot(vehicleSize, entryPoint);
      vehicle.slot = returnPrevSlotOrFindNewSlot;

      // Update parking slot state
      const returnPrevSlotOrFindNewSlotIndex = this.slots.findIndex(
        (slot) => slot.slotId === returnPrevSlotOrFindNewSlot?.slotId
      );
      this.slots[returnPrevSlotOrFindNewSlotIndex].isOccupied = true;

      // return slotId
      return vehicle.slot!.slotId >= 0 ? vehicle.slot!.slotId : null;
    }

    vehicle = new Vehicle(vehicleId, vehicleSize);
    vehicle.entryTime = CURRENT_TIME;
    this.vehicles[vehicleId] = vehicle;

    const slot = this.findNearestSlot(vehicleSize, entryPoint);
    if (!slot) return null;

    slot.isOccupied = true;
    vehicle.slot = slot;

    return vehicle.slot.slotId;
  }

  // Calculate additional park fee if vehicle exceed 3 hours
  unparkVehicle(vehicleId: string, fakeLastExitTime?: Date): number | null {
    let vehicle = this.vehicles[vehicleId];
    if (!vehicle || !vehicle.slot) {
      return null;
    }

    const lastParkingSlotIndex = this.slots.findIndex(
      (slot) => slot.slotId === vehicle.slot!.slotId
    );
    this.slots[lastParkingSlotIndex].isOccupied = false;

    // Save last vehicle parked
    this.slots[lastParkingSlotIndex].lastVehicleId = vehicle.vehicleId;

    vehicle.lastExitTime = new Date();
    vehicle.slot = null;

    const totalFees = this.calculateFees(vehicleId, fakeLastExitTime);

    return totalFees;
  }

  calculateFees(vehicleId: string, fakeLastExitTime?: Date) {
    const vehicle = this.vehicles[vehicleId];

    // Create Date objects from the original timestamps
    const entryTime = new Date(vehicle.entryTime!);
    const exitTime = new Date(fakeLastExitTime || vehicle.lastExitTime!);

    // Calculate the difference in milliseconds
    const differenceInMillis = exitTime.getTime() - entryTime.getTime();

    // Calculate the difference in total hours and minutes
    const differenceInMinutes = Math.floor(differenceInMillis / (1000 * 60));
    let hours = Math.floor(differenceInMinutes / 60);
    let minutes = differenceInMinutes % 60;

    let daysFeeCount = 0;
    let total = 0;

    if (hours >= 24) {
      daysFeeCount = hours / 24;

      // Get remaining hours
      let remainingHours = daysFeeCount * 24;
      remainingHours = remainingHours - hours;

      // Compute total
      total = this.DAILY_RATE * daysFeeCount;
      total += Math.ceil(remainingHours) * this.EXCEEDING_RATES[vehicle.size];
    } else if (hours > 3) {
      total = Math.ceil(hours - 3) * this.EXCEEDING_RATES[vehicle.size];
    }

    // Another additional hour if some 30 minutes
    if (minutes > 0) {
      total += this.EXCEEDING_RATES[vehicle.size];
    }

    // Accurate based on minutes
    // if (minutes > 0) {
    //   const percentage = getPercentageOf(minutes, 60);
    //   const minutesFee = getValueFromPercentage(
    //     percentage,
    //     this.EXCEEDING_RATES[vehicle.size]
    //   );
    //   total += minutesFee;
    // }

    return hours >= 24 ? total : total + this.BASE_RATE;
  }

  static execute() {
    // Example usage
    const slotsInfo = [
      [1, 4, 5],
      [3, 2, 3],
      [2, 3, 2],
      [5, 5, 1],
    ];
    const slotSizes = [0, 1, 1, 2];
    const parkingLot = new ParkingLotService(3, slotsInfo, slotSizes);

    // Parking a vehicle
    parkingLot.parkVehicle("Car1", 0, 0); // Vehicle ID, Size, Entry Point

    // Adjust the time by adding 1 hours
    let adjustedTime10hr = new Date();
    adjustedTime10hr.setHours(adjustedTime10hr.getHours() + 10);

    // Unparking a vehicle
    parkingLot.unparkVehicle("Car1");
  }
}
