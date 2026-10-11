// Central role configuration used for sidebar nav, dashboards, and
// role-based permission checks throughout the app.

export const ROLES = ["citizen", "officer", "surveyor", "lawyer", "admin"];

export function roleLabelKey(role) {
  return `role_${role}`;
}

export function roleTabLabel(role) {
  switch (role) {
    case "officer":
      return "Registrar";
    case "admin":
      return "Admin";
    case "citizen":
      return "Citizen";
    case "surveyor":
      return "Surveyor";
    case "lawyer":
      return "Lawyer";
    default:
      return role;
  }
}

export function navItemsForRole(role) {
  if (role === "citizen") {
    return [
      { to: "/app/dashboard", label: "Overview", icon: "grid" },
      { to: "/app/properties", label: "My Properties", icon: "home" },
      { to: "/app/registration", label: "New Registration", icon: "file-plus" },
      { to: "/track", label: "Track Application", icon: "search" },
      { to: "/app/transfer", label: "Transfer Property", icon: "swap" },
      { to: "/app/documents", label: "My Documents", icon: "doc" },
      { to: "/app/payments", label: "Fee Payments", icon: "wallet" },
      { to: "/app/appointments", label: "Appointments", icon: "calendar" },
      { to: "/app/notifications", label: "Notifications", icon: "bell" },
      { to: "/app/profile", label: "My Profile", icon: "user" },
    ];
  }

  if (role === "surveyor") {
    return [
      { to: "/app/dashboard", label: "Survey Station", icon: "compass" },
      { to: "/app/land-parcels", label: "Cadastral Parcels (GIS)", icon: "map" },
      { to: "/app/properties", label: "Boundary Records", icon: "building" },
      { to: "/app/appointments", label: "Field Inspections", icon: "calendar" },
      { to: "/app/notifications", label: "Survey Alerts", icon: "bell" },
      { to: "/app/profile", label: "Surveyor Profile", icon: "user" },
    ];
  }

  if (role === "officer" || role === "registrar") {
    return [
      { to: "/app/dashboard", label: "Adjudication Desk", icon: "shield" },
      { to: "/app/registration", label: "Pending Applications", icon: "file-plus" },
      { to: "/app/transfer", label: "Property Conveyance", icon: "swap" },
      { to: "/app/properties", label: "Registry Ledger", icon: "home" },
      { to: "/app/documents", label: "Digital Deeds Vault", icon: "doc" },
      { to: "/app/appointments", label: "Verification Hearings", icon: "calendar" },
      { to: "/app/payments", label: "Revenue & Stamp Duty", icon: "wallet" },
      { to: "/app/notifications", label: "Official Notices", icon: "bell" },
      { to: "/app/profile", label: "Officer Profile", icon: "user" },
    ];
  }

  if (role === "lawyer") {
    return [
      { to: "/app/dashboard", label: "Legal Workspace", icon: "briefcase" },
      { to: "/app/properties", label: "Title Due Diligence", icon: "home" },
      { to: "/app/documents", label: "Document Certification", icon: "doc" },
      { to: "/app/transfer", label: "Conveyancing & Deeds", icon: "swap" },
      { to: "/app/appointments", label: "Registry Hearings", icon: "calendar" },
      { to: "/app/notifications", label: "Case Alerts", icon: "bell" },
      { to: "/app/profile", label: "Advocate Profile", icon: "user" },
    ];
  }

  // Admin
  return [
    { to: "/app/dashboard", label: "System Governance", icon: "grid" },
    { to: "/app/users", label: "User Directory & Roles", icon: "users" },
    { to: "/app/properties", label: "Property Master Ledger", icon: "home" },
    { to: "/app/land-parcels", label: "Cadastral Parcels GIS", icon: "map" },
    { to: "/app/registration", label: "All Registrations", icon: "file-plus" },
    { to: "/app/transfer", label: "Transfer Registry", icon: "swap" },
    { to: "/app/payments", label: "Financial Audit", icon: "wallet" },
    { to: "/app/notifications", label: "System Logs", icon: "bell" },
    { to: "/app/settings", label: "Platform Settings", icon: "settings" },
    { to: "/app/profile", label: "Admin Profile", icon: "user" },
  ];
}

// Whether a role can approve/reject records (registrations, transfers, documents)
export function canReview(role) {
  return role === "officer" || role === "registrar" || role === "admin";
}

export function canCertifyDocuments(role) {
  return role === "lawyer" || role === "officer" || role === "registrar" || role === "admin";
}

export function canManageUsers(role) {
  return role === "admin";
}
