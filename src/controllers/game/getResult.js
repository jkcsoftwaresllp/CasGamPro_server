import pool from "../../config/db.js";

// API: Get Result
export const getResult = async (req, res) => {
  try {
    const [stakesResults] = await pool.query(
      "SELECT player, amount FROM StakeDetails"
    );

    //    Calculating total number of stakes on player-1
    const stakesPlayer1 = stakesResults
      .filter((stake) => stake.player === "Player 1")
      .map((stake) => stake.amount);

    //    Calculating total number of stakes on player-2
    const stakesPlayer2 = stakesResults
      .filter((stake) => stake.player === "Player 2")
      .map((stake) => stake.amount);

    //   Calculating total stakes
    const totalStakesPlayer1 = stakesPlayer1.reduce(
      (acc, stake) => acc + Number(stake), 
      0
    );
    const totalStakesPlayer2 = stakesPlayer2.reduce(
      (acc, stake) => acc + Number(stake), 
      0
    );

    //   Winning Logic
    const winner =
      totalStakesPlayer1 < totalStakesPlayer2 ? "Player 1" : "Player 2";
    // Logic for Payouts
    const payouts = {};
    let totalPayout = 0;

    const stakesToUse = winner === "Player 1" ? stakesPlayer1 : stakesPlayer2;
    stakesToUse.forEach((stake, index) => {
      const payout = stake * 1.96;
      payouts[`Spectator${index + 1}`] = payout;
      totalPayout += payout;
    });


    res.status(200).json({
      winner,
      payouts,
      totalStakesPlayer1,
      totalStakesPlayer2,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to calculate results.");
  }
};
