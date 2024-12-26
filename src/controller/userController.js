import pool from "../config/db.js";
import bcrypt from "bcrypt";

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
    const isPasswordValid = password === user.password;
    // const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Set up session data
    req.session.authToken = true; // Flag to indicate authenticated session
    req.session.userId = user.userId;
    req.session.userRole = user.role; // If you have role-based authentication

    // You can add any other user data you want to store in the session
    // But avoid storing sensitive information like passwords

    // Save the session
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Error creating session" });
      }

      // Return success response
      return res.status(200).json({
        message: "Login successful",
        user: {
          userId: user.userId,
          role: user.role,
          // Add any other non-sensitive user data you want to send to the client
        },
      });
    });
  } catch (error) {
    console.error("Login Failed:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

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