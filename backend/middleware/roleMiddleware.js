export function authorize(...roles) {
  // Normalize roles so "officer" and "registrar" match seamlessly
  const normalizedAllowed = roles.flatMap((r) => {
    const clean = String(r).toLowerCase().trim();
    if (clean === "officer" || clean === "registrar") return ["officer", "registrar"];
    return [clean];
  });

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      });
    }

    const userRole = String(req.user.role || "").toLowerCase().trim();
    const isAllowed = normalizedAllowed.includes(userRole);

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: `Forbidden: Access restricted to [${roles.join(", ")}]. Your current role is '${req.user.role}'.`,
      });
    }

    next();
  };
}
