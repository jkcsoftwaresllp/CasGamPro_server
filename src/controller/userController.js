import pool from "../config/db.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

// To generate a random 8-character password
const generatePassword = () => {
  return crypto.randomBytes(4).toString("hex");
};

// For user registration
export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      fixLimit,
      userMatchCommission,
      userSessionCommission,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      fixLimit === undefined ||
      userMatchCommission === undefined ||
      userSessionCommission === undefined
    ) {
      return res.status(400).json({
        uniqueCode: "CGP0010A",
        message: "All fields are required",
      });
    }

    if (fixLimit < 0 || fixLimit > 18) {
      return res.status(400).json({
        uniqueCode: "CGP0010B",
        message: "Fix Limit must be between 0 and 18",
      });
    }

    if (userMatchCommission < 0 || userMatchCommission > 3) {
      return res.status(400).json({
        uniqueCode: "CGP0010C",
        message: "User Match Commission must be between 0 and 3",
      });
    }

    if (userSessionCommission < 0 || userSessionCommission > 3) {
      return res.status(400).json({
        uniqueCode: "CGP0010D",
        message: "User Session Commission must be between 0 and 3",
      });
    }

    const password = generatePassword();

    const query = `
      INSERT INTO users (first_name, last_name, fix_limit, user_match_commission, user_session_commission, password)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      firstName,
      lastName,
      fixLimit,
      userMatchCommission,
      userSessionCommission,
      password,
    ]);

    return res.status(201).json({
      uniqueCode: "CGP0001",
      message: "User registered successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      uniqueCode: "CGP0002",
      message: "Internal server error",
    });
  }
};

// For user login
export const loginUser = async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    console.info("Login attempted with incomplete information");
    return res
      .status(400)
      .json({ message: "Please provide required information" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE userId = ?", [
      userId,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Set up session data
    req.session.authToken = true;
    req.session.userId = user.userId;
    req.session.userRole = user.role;

    // Save the session
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Error creating session" });
      }

      return res.status(200).json({
        message: "Login successful",
        user: {
          userId: user.userId,
          role: user.role,
        },
      });
    });
  } catch (error) {
    console.error("Login Failed:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// For user logout
export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie(process.env.SESSION_COOKIE_NAME || "Session Cookie");
    res.status(200).json({ message: "Logged out successfully" });
  });
};
