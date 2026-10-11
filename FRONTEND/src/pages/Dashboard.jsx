import React from "react";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import { useAsync } from "../hooks/useAsync.js";
import { Loader, ErrorState } from "../components/Feedback.jsx";

import CitizenDashboard from "../components/dashboards/CitizenDashboard.jsx";
import SurveyorDashboard from "../components/dashboards/SurveyorDashboard.jsx";
import RegistrarDashboard from "../components/dashboards/RegistrarDashboard.jsx";
import LawyerDashboard from "../components/dashboards/LawyerDashboard.jsx";
import AdminDashboard from "../components/dashboards/AdminDashboard.jsx";

export default function Dashboard() {
  const { user, addToast } = useApp();

  const { data: stats, loading, error, reload } = useAsync(() => api.stats(), []);
  const { data: registrations, reload: reloadRegs } = useAsync(() => api.registrations.list(), []);
  const { data: properties, reload: reloadProps } = useAsync(() => api.properties.list(), []);
  const { data: deeds } = useAsync(() => api.deeds.list(), []);
  const { data: appointments } = useAsync(() => api.appointments.list(), []);
  const { data: documents } = useAsync(() => api.documents.list(), []);
  const { data: transfers, reload: reloadTransfers } = useAsync(() => api.transfers.list(), []);
  const { data: parcels } = useAsync(() => api.landParcels.list(), []);
  const { data: usersList } = useAsync(() => (user?.role === "admin" ? api.users.list() : Promise.resolve([])), [user?.role]);

  function reloadAll() {
    reload();
    reloadRegs();
    reloadTransfers();
    reloadProps();
  }

  if (loading && !stats) return <Loader />;
  if (error) return <ErrorState onRetry={reload} />;

  const commonProps = {
    user,
    stats,
    registrations: registrations || [],
    properties: properties || [],
    deeds: deeds || [],
    appointments: appointments || [],
    documents: documents || [],
    transfers: transfers || [],
    parcels: parcels || [],
    users: usersList || [],
    reload: reloadAll,
    addToast,
    api,
  };

  switch (user?.role) {
    case "surveyor":
      return <SurveyorDashboard {...commonProps} />;
    case "officer":
    case "registrar":
      return <RegistrarDashboard {...commonProps} />;
    case "lawyer":
      return <LawyerDashboard {...commonProps} />;
    case "admin":
      return <AdminDashboard {...commonProps} />;
    case "citizen":
    default:
      return <CitizenDashboard {...commonProps} />;
  }
}
