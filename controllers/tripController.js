const pool = require("../config/db");

// ✅ Add Trip
exports.addTrip = async (req, res) => {
  try {
    const {
      tripType,
      tripStartDate,
      tripEndDate,
      fromCity,
      fromAddress,
      fromPincode,
      transportMode,
      isStartAndEndCitySame,
      tripEndCity,
      totalPackages,
      totalWeight,
      entryBy,
      isActive,
      paymentStatus,
      statusId,
      updateBy,
      updateDate,
      totalAmount,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO tbl_trip_header (
        tripType, tripStartDate, tripEndDate, fromCity, fromAddress, fromPincode, transportMode, 
        isStartAndEndCitySame, tripEndCity, totalPackages, totalWeight, entryBy, isActive, 
        paymentStatus, statusId, updateBy, updateDate, totalAmount
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING tripId`,
      [
        tripType,
        tripStartDate,
        tripEndDate,
        fromCity,
        fromAddress,
        fromPincode,
        transportMode,
        isStartAndEndCitySame,
        tripEndCity,
        totalPackages,
        totalWeight,
        entryBy,
        isActive,
        paymentStatus,
        statusId,
        updateBy,
        updateDate,
        totalAmount,
      ]
    );

    res.json({
      success: 1,
      message: "Trip added successfully",
      tripId: result.rows[0].tripid,
    });
  } catch (err) {
    res.status(500).json({ success: 0, error: err.message });
  }
};

// ✅ Get All Trips
exports.getTrips = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tbl_trip_header ORDER BY tripId DESC"
    );
    res.json({ success: 1, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: 0, error: err.message });
  }
};

// ✅ Update Trip
exports.updateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { statusId, updateBy } = req.body;

    const result = await pool.query(
      "UPDATE tbl_trip_header SET statusId = $1, updateBy = $2, updateDate = NOW() WHERE tripId = $3",
      [statusId, updateBy, tripId]
    );

    res.json(
      result.rowCount > 0
        ? { success: 1, message: "Trip updated" }
        : { success: 0, message: "Trip not found" }
    );
  } catch (err) {
    res.status(500).json({ success: 0, error: err.message });
  }
};

// ✅ Delete Trip
exports.deleteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const result = await pool.query(
      "DELETE FROM tbl_trip_header WHERE tripId = $1",
      [tripId]
    );

    res.json(
      result.rowCount > 0
        ? { success: 1, message: "Trip deleted" }
        : { success: 0, message: "Trip not found" }
    );
  } catch (err) {
    res.status(500).json({ success: 0, error: err.message });
  }
};
