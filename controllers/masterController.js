const pool = require("../config/db");

exports.getStatusMaster = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM public."tbl_Master_Status" WHERE "isActive" = true ORDER BY id ASC `
    );
    res.json({ success: 1, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: 0, error: err.message });
  }
};
