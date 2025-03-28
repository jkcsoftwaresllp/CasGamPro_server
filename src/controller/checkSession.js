export const checkSession = (req, res) => {
  const { userId, userRole, status, clientName, blockingLevel } = req.session;

  // Respond with the user data from the session
  res.json({
    uniqueCode: "CGP0050",
    message: "Session data",
    data: {
      status,
      userId,
      profilePic: null,
      userRole,
      clientName,
      blockingLevel,
    },
  });
};
