// API: Set Bet
export const setBet = (req, res) => {
    const { spectators, player, amount } = req.body;
    pool.query(
      "INSERT INTO StakeDetails (spectators, player, amount) VALUES (?, ?, ?)",
      [spectators, player, amount],
      (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Failed to place bet.");
        }
        res.status(201).send("Bet placed successfully.");
      }
    );
  };