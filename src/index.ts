import express from "express";
import { ParkingLotService } from "./modules/parking/services/parking.service";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(port, () => {
  ParkingLotService.execute();
  console.log(`Server is running on http://localhost:${port}`);
});
