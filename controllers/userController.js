const pool = require("../config/db");

exports.getUserDetails = async (req, res) => {
  const userId = req.params.userId;

  // Fetch all trips for the given entryBy user
  try {
    const query = `SELECT * FROM public.user_master WHERE id = $1`;
    const result = await pool.query(query, [userId]);

    if (result.rows.length > 0) {
      res.status(200).json({ success: true, data: result.rows });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.editUser = async (req, res) => {
  // Destructure the required fields from the request body
  const { userId, firstName, lastName, emailId } = req.body;

  // Validate required fields
  if (!userId || !firstName || !lastName || !emailId) {
    return res.status(400).json({
      success: false,
      message: "userId, firstName, lastName, and emailId are required.",
    });
  }

  try {
    // Update the user_master record in PostgreSQL
    const query = `
      UPDATE public.user_master 
      SET firstname = $1, 
          lastname = $2, 
          emailid = $3,
          updateBy = $4,
          updateDate = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;  -- Returns the updated row
    `;

    const values = [firstName, lastName, emailId, userId];

    const result = await pool.query(query, values);

    // Check if any row was updated
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.json({
      success: true,
      message: "Profile updated successfully.",
      data: result.rows[0], // Return updated user data
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
