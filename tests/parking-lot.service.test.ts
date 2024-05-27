import { ParkingLotService } from "../src/modules/parking/services/parking.service";

describe("ParkingLot System", () => {
  let parkingLot: ParkingLotService;
  const slotsInfo = [
    [1, 4, 5],
    [3, 2, 3],
    [2, 3, 2],
    [5, 5, 1],
  ];
  const slotSizes = [0, 1, 1, 2];

  beforeEach(() => {
    parkingLot = new ParkingLotService(3, slotsInfo, slotSizes);
  });

  test("should park and unpark a vehicle within free 3-hour period", () => {
    const slotId = parkingLot.parkVehicle("Car1", 0, 0);
    expect(slotId).not.toBeNull();

    const fees = parkingLot.unparkVehicle("Car1");
    expect(fees).toBe(40); // Only base rate since within 3 hours
  });

  test("should park a vehicle for more than 3 hours and calculate fee", () => {
    const slotId = parkingLot.parkVehicle("Car2", 0, 0);
    expect(slotId).not.toBeNull();

    let adjustedTime = new Date();
    adjustedTime.setHours(adjustedTime.getHours() + 5);

    const fees = parkingLot.unparkVehicle("Car2", adjustedTime);
    expect(fees).toBe(80); // 40 base + 40 for exceeding 2 hours (20/hour for small slot)
  });

  test("should handle re-parking within one hour", () => {
    const slotId1 = parkingLot.parkVehicle("Car3", 0, 0);
    expect(slotId1).not.toBeNull();

    parkingLot.unparkVehicle("Car3");

    let adjustedTime1hr = new Date();
    adjustedTime1hr.setHours(adjustedTime1hr.getHours() + 0.5); // Simulate re-parking within half hour

    const slotId2 = parkingLot.parkVehicle("Car3", 0, 0);
    expect(slotId2).toBe(slotId1);

    let adjustedTime = new Date();
    adjustedTime.setHours(adjustedTime.getHours() + 4); // Total 4 hours

    const fees = parkingLot.unparkVehicle("Car3", adjustedTime);
    expect(fees).toBe(60); // 40 base + 20 for exceeding 1 hour (20/hour for small slot)
  });

  test("should calculate fees for more than 24 hours", () => {
    const slotId = parkingLot.parkVehicle("Car4", 2, 0); // Large vehicle
    expect(slotId).not.toBeNull();

    let adjustedTime = new Date();
    adjustedTime.setDate(adjustedTime.getDate() + 1); // 24 hours

    const fees = parkingLot.unparkVehicle("Car4", adjustedTime);
    expect(fees).toBe(5000); // Daily rate
  });

  test("should return null if no slots are available", () => {
    parkingLot.parkVehicle("Car5", 0, 0);
    parkingLot.parkVehicle("Car6", 0, 0);
    parkingLot.parkVehicle("Car7", 0, 0);
    parkingLot.parkVehicle("Car8", 0, 0); // All slots occupied

    const slotId = parkingLot.parkVehicle("Car9", 0, 0);
    expect(slotId).toBeNull(); // No available slot
  });

  test("should park a vehicle when all slots are occupied except one", () => {
    parkingLot.parkVehicle("Car5", 0, 0);
    parkingLot.parkVehicle("Car6", 0, 0);
    parkingLot.parkVehicle("Car7", 0, 0); // Occupy three small slots

    const slotId = parkingLot.parkVehicle("Car8", 2, 0); // Large vehicle
    expect(slotId).not.toBeNull(); // Should park in the remaining large slot
  });

  test("should return null when trying to unpark a non-existent vehicle", () => {
    const fees = parkingLot.unparkVehicle("NonExistentCar");
    expect(fees).toBeNull(); // No such vehicle in the parking lot
  });

  test("should handle multiple re-parkings within free 3-hour period", () => {
    const slotId1 = parkingLot.parkVehicle("Car10", 1, 0);
    expect(slotId1).not.toBeNull();

    parkingLot.unparkVehicle("Car10");

    let adjustedTime1hr = new Date();
    adjustedTime1hr.setHours(adjustedTime1hr.getHours() + 0.5); // Simulate re-parking within half hour

    const slotId2 = parkingLot.parkVehicle("Car10", 1, 0);
    expect(slotId2).toBe(slotId1); // Should get the same slot

    parkingLot.unparkVehicle("Car10");

    let adjustedTime2hr = new Date();
    adjustedTime2hr.setHours(adjustedTime2hr.getHours() + 2.5); // Simulate another re-parking within 3 hours

    const slotId3 = parkingLot.parkVehicle("Car10", 1, 0);
    expect(slotId3).toBe(slotId1); // Should still get the same slot

    let adjustedTime = new Date();
    adjustedTime.setHours(adjustedTime.getHours() + 1); // Total within 3 hours

    const fees = parkingLot.unparkVehicle("Car10", adjustedTime);
    expect(fees).toBe(40); // Only base rate since within 3 hours
  });

  test("should calculate fees for exactly 3 hours and 30 minutes", () => {
    const slotId = parkingLot.parkVehicle("Car12", 0, 0);
    expect(slotId).not.toBeNull();

    let adjustedTime = new Date();
    adjustedTime.setHours(adjustedTime.getHours() + 3);
    adjustedTime.setMinutes(adjustedTime.getMinutes() + 30);

    const fees = parkingLot.unparkVehicle("Car12", adjustedTime);
    expect(fees).toBe(60); // 40 base + 20 for exceeding 30 minutes (20/hour for small slot)
  });
});
