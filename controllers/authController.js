require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// User Login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ message: "Username and password are required" });

  try {
    const userQuery = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (userQuery.rows.length === 0)
      return res.status(401).json({ message: "Invalid username or password" });

    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// User Registration
exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ message: "Username and password are required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
      username,
      hashedPassword,
    ]);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.mobileLogin = async (req, res) => {
  const { mobileNo, otp } = req.body;

  if (!mobileNo) {
    return res.status(400).json({ message: "Required fields are missing." });
  }

  if (otp !== "123456") {
    return res.status(200).json({
      success: 0,
      message: "Please enter the correct OTP",
    });
  }

  try {
    // Check if user exists
    const checkUserQuery = `
        SELECT id, roleid AS "roleId", rolename AS "roleName"
        FROM User_Master WHERE mobileno = $1
      `;
    const { rows } = await pool.query(checkUserQuery, [mobileNo]);

    if (rows.length > 0) {
      // User exists
      return res.status(200).json({
        success: 1,
        userId: rows[0].id,
        roleId: rows[0].roleId,
        roleName: rows[0].roleName,
        message: "User login successful",
      });
    } else {
      // Insert new user
      const insertUserQuery = `
          INSERT INTO User_Master (mobileno, isactive, roleid, rolename) 
          VALUES ($1, true, 1, 'User') RETURNING id, roleid AS "roleId", rolename AS "roleName"
        `;

      const { rows: newUser } = await pool.query(insertUserQuery, [mobileNo]);

      return res.status(201).json({
        success: 1,
        userId: newUser[0].id,
        roleId: newUser[0].roleId,
        roleName: newUser[0].roleName,
        message: "User created successfully",
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login error", error: error.message });
  }
};
