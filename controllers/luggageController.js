const pool = require("../config/db");
const moment = require("moment-timezone");

exports.addLuggage = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      tripType,
      tripStartDate,
      tripEndtDate,
      fromCity,
      fromPincode,
      fromAddress,
      transportMode,
      isStartAndEndCitySame,
      tripEndCity,
      totalPackages,
      totalWeight,
      entryBy,
      totalAmount,
      tripDetail,
    } = req.body;

    await client.query("BEGIN");

    const tripHeaderQuery = `
    INSERT INTO tbl_trip_header (
        tripType, tripStartDate, tripEndDate, fromCity, fromPincode, fromAddress,
        transportMode, isStartAndEndCitySame, tripEndCity, totalPackages, totalWeight, entryBy, totalAmount
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING tripId
 `;

    const tripHeaderValues = [
      tripType,
      tripStartDate,
      tripEndtDate,
      fromCity,
      fromPincode,
      fromAddress,
      transportMode,
      isStartAndEndCitySame,
      tripEndCity,
      totalPackages,
      totalWeight,
      entryBy,
      String(totalAmount),
    ];

    const tripHeaderResult = await client.query(
      tripHeaderQuery,
      tripHeaderValues
    );
    const tripId = tripHeaderResult.rows[0].tripid;

    for (const detail of tripDetail) {
      const detailQuery = `
                INSERT INTO tbl_luggage_drop_detail (
                    headerTripId, pickupDate, dropDate, fromPincode, fromCity, fromAddress,
                    dropPincode, dropAddress, dropCity, noOfPackage, weight, amount, remarks, entryBy, noOfExtraSmallPackage,noOfSmallPackage,noOfMediumPackage,
                    noOfLargePackage,noOfExtraLargePackage
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,$15,$16,$17,$18,$19)
            `;

      const detailValues = [
        tripId,
        detail.pickupDate,
        detail.dropDate,
        detail.fromPincode,
        detail.fromCity,
        detail.fromAddress,
        detail.dropPincode,
        detail.dropAddress,
        detail.dropCity,
        detail.noOfPackage || 0,
        detail.weight || "0",
        detail.amount || "0",
        detail.remarks || "",
        detail.entryBy || 1,
        detail.noOfExtraSmallPackage || "0",
        detail.noOfSmallPackage || "0",
        detail.noOfMediumPackage || "0",
        detail.noOfLargePackage || "0",
        detail.noOfExtraLargePackage || "0",
      ];

      await client.query(detailQuery, detailValues);
    }

    await client.query("COMMIT");
    res
      .status(201)
      .json({ message: "Trip and details inserted successfully", tripId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "Database error" });
  } finally {
    client.release();
  }
};

exports.getLuggageByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const result = await pool.query(
      "SELECT * FROM tbl_luggage_drop_detail WHERE headerTripId = $1",
      [tripId]
    );
    res.json({ success: 1, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: 0, error: err.message });
  }
};

exports.getTripDetails = async (req, res) => {
  try {
    const entryBy = req.params.userId;

    // Fetch all trips for the given entryBy user
    const tripQuery = `
          SELECT * FROM tbl_trip_header
          WHERE entryby = $1
          ORDER BY entrydate DESC;
        `;

    const tripResult = await pool.query(tripQuery, [entryBy]);

    if (tripResult.rows.length === 0) {
      return res
        .status(200)
        .json({ status: 1, message: "No trips found", data: [] });
    }

    // Fetch all luggage details for the trips
    const tripIds = tripResult.rows.map((trip) => trip.tripid);
    const luggageQuery = `
          SELECT * FROM tbl_luggage_drop_detail
          WHERE headertripid = ANY($1::int[]);
        `;

    const luggageResult = await pool.query(luggageQuery, [tripIds]);
    const luggageData = luggageResult.rows;

    // Format the response
    const formattedData = tripResult.rows.map((trip) => {
      return {
        tripId: trip.tripid,
        tripType: trip.triptype,
        tripStartDate: trip.tripstartdate,
        tripEndDate: trip.tripenddate,
        fromCity: trip.fromcity,
        fromAddress: trip.fromaddress,
        fromPincode: trip.frompincode,
        transportMode: trip.transportmode,
        isStartAndEndCitySame: trip.isstartandendcitysame,
        tripEndCity: trip.tripendcity,
        entryDate: trip.entrydate,
        totalPackages: trip.totalpackages,
        totalWeight: trip.totalweight,
        totalAmount: trip.totalamount,
        entryBy: trip.entryby,
        isActive: trip.isactive,
        luggageDropDetails: luggageData
          .filter((luggage) => luggage.headertripid === trip.tripid)
          .map((luggage) => ({
            detailId: luggage.detailid,
            pickupDate: luggage.pickupdate,
            dropDate: luggage.dropdate,
            fromPincode: luggage.frompincode,
            fromCity: luggage.fromcity,
            fromAddress: luggage.fromaddress,
            dropPincode: luggage.droppincode,
            dropCity: luggage.dropcity,
            dropAddress: luggage.dropaddress,
            noOfPackage: luggage.noofpackage,
            weight: luggage.weight,
            amount: luggage.amount,
            remarks: luggage.remarks,
            entryDate: luggage.entrydate,
            entryBy: luggage.entryby,
            isActive: luggage.isactive,
            deliveryStatus: luggage.deliverystatus,
            noOfExtraSmallPackage: luggage.noofextrasmallpackage,
            noOfSmallPackage: luggage.noofsmallpackage,
            noOfMediumPackage: luggage.noofmediumpackage,
            noOfLargePackage: luggage.nooflargepackage,
            noOfExtraLargePackage: luggage.noofextralargepackage,
          })),
      };
    });

    res.status(200).json({
      status: 1,
      message: "success",
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({
      status: 0,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.updateLuggageDropStatus = async (req, res) => {
  try {
    let { detailId, deliveryStatus, updateBy } = req.body;

    // Validate required fields
    if (isNaN(detailId) || isNaN(deliveryStatus) || isNaN(updateBy)) {
      return res.status(400).json({
        success: 0,
        message:
          "Invalid input. detailId, deliveryStatus, and updateBy must be numbers.",
      });
    }

    // Get IST time
    const istTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    // Update query for PostgreSQL
    const query = `
          UPDATE public.tbl_luggage_drop_detail 
          SET deliverystatus = $1, 
              updateby = $2, 
              updatedate = TO_TIMESTAMP($3, 'YYYY-MM-DD HH24:MI:SS')
          WHERE detailid = $4
          RETURNING *;
        `;

    const values = [deliveryStatus, updateBy, istTime, detailId];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: 0, message: "Record not found" });
    }

    res.json({ success: 1, message: "Trip status updated successfully" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: 0, error: err.message });
  }
};

exports.addPaymentTransaction = async (req, res) => {
  try {
    const {
      tripid,
      userId,
      totalAmount,
      paymentMethod,
      transactionId,
      paymentStatus,
    } = req.body;

    if (
      !tripid ||
      !userId ||
      !totalAmount ||
      !paymentMethod ||
      !transactionId ||
      !paymentStatus
    ) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    const result = await pool.query(
      `INSERT INTO tbl_trip_payment (tripId, userId, totalAmount, paymentMethod, transactionId, paymentStatus)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tripid, userId, totalAmount, paymentMethod, transactionId, paymentStatus]
    );

    res
      .status(201)
      .json({
        success: 1,
        message: "Payment recorded successfully!",
        data: result.rows[0],
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: 0, message: "Internal Server Error" });
  }
};
