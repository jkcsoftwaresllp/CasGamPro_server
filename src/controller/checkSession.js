export const checkSession = (req, res) => {
  const { userId, username, userRole } = req.session;

  // Respond with the user data from the session
  res.json({
    uniqueCode: "CGP0020",
    message: "Session data",
    data: {
      userId,
      username,
      profilePic: null,
      userRole,
    },
  });
};
