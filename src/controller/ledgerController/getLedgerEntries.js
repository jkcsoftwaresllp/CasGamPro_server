import { fetchLedgerEntries } from "../../utils/ledgerEntries/fetchLedgerEntries.js";
export const getLedgerEntries = async (req, res) => {
  try {
    const userId = req.session.userId; // Authenticated user's ID
    const { page = 1, filters = {} } = req.query;

    const entries = await fetchLedgerEntries(
      userId,
      page,
      20,
      JSON.parse(filters)
    );
    res.json({
      uniqueCode: "CGP0025",
      message: "",
      data: {
        success: true,
        entries,
      },
    });
  } catch (error) {
    res.status(500).json({
      uniqueCode: "CGP0026",
      message: error.message,
      data: { success: false },
    });
  }
};
