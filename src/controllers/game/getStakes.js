import pool from "../../config/db.js";

// export const getStakes = (req, res) => {};
export const getStakes = async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM StakeDetails");
    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch stakes.");
  }
};
