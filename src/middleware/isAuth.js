import pool from '../config/db.js';

export const isAuth = async (req, res, next) => {
    try {
        // Check if the session exists
        if (!req.session || !req.session.authToken) {
            return res.status(401).json({ uniqueCode: "CGP0000A", message: "Unauthorized. Please log in." });
        }

        // Fetch session from the session store
        const sessionId = req.sessionID; // Retrieve session ID from the request

        // Query the session store to validate the session
        const [rows] = await pool.query('SELECT * FROM sessions WHERE session_id = ?', [sessionId]);

        // If no session is found, or the session is expired
        if (rows.length === 0) {
            return res.status(401).json({ uniqueCode: "CGP0000B", message: "Unauthorized. Please log in again." });
        }

        // Session is valid
        next();
    } catch (error) {
        console.error("Error in isAuth middleware:", error);
        res.status(500).json({ uniqueCode: "CGP0000C", message: "Internal server error" });
    }
};
