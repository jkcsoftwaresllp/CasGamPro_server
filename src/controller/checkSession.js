export const checkSession = (req, res) => {
  const { userId, username, userRole, status, clientName, blockingLevel } =
    req.session;

  // Respond with the user data from the session
  res.json({
    uniqueCode: "CGP0025",
    message: "Session data",
    data: {
      status,
      userId,
      username,
      profilePic: null,
      userRole,
      clientName,
      blockingLevel,
    },
  });
};
