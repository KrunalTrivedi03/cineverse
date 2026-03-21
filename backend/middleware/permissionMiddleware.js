module.exports = function requirePermission(permissionName) {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.permissions) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const hasPermission = req.user.permissions.includes(permissionName);

      if (!hasPermission) {
        return res.status(403).json({
          message: `Access denied: Missing permission → ${permissionName}`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};
