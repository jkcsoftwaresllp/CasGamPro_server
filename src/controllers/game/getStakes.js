import pool from '../../config/db.js'

// export const getStakes = (req, res) => {};
export const getStakes = (req, res) => {
    pool.query("SELECT * FROM StakeDetails", (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Failed to fetch stakes.");
      }
      res.status(200).json(results);
    });
  };
