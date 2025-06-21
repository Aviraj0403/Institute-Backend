export const authAdmin = (req, res, next) => {
  if (!req.user || req.user.roleType !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};
export const authEmployer = (req, res, next) => {
  if (!req.user || req.user.roleType !== "employer") {
    return res.status(403).json({ message: "Access denied. Employers only." });
  }
  next();
}
export const authStudent = (req, res, next) => {
  if (!req.user || req.user.roleType !== "student") {
    return res.status(403).json({ message: "Access denied. Students only." });
  }
  next();
};
