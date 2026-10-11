import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import PublicLayout from "./components/PublicLayout.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import TrackApplication from "./pages/TrackApplication.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Properties from "./pages/Properties.jsx";
import LandParcels from "./pages/LandParcels.jsx";
import PropertyRegistration from "./pages/PropertyRegistration.jsx";
import PropertyTransfer from "./pages/PropertyTransfer.jsx";
import Documents from "./pages/Documents.jsx";
import Payments from "./pages/Payments.jsx";
import Appointments from "./pages/Appointments.jsx";
import Notifications from "./pages/Notifications.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";
import AdminUserManagement from "./pages/AdminUserManagement.jsx";
import VerifyDeed from "./pages/VerifyDeed.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import NotFound from "./pages/NotFound.jsx";

function RootRedirect() {
  const { user } = useApp();
  return <Navigate to={user ? "/app/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/:role" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/google" element={<Register />} />
            <Route path="/complete-registration" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/login/callback" element={<AuthCallback />} />
            <Route path="/auth/google/callback" element={<AuthCallback />} />
            <Route path="/register/callback" element={<AuthCallback />} />
            <Route path="/api/auth/google/callback" element={<AuthCallback />} />
            <Route path="/oauth2/callback" element={<AuthCallback />} />
            <Route path="/track" element={<TrackApplication />} />
            <Route path="/verify-deed" element={<VerifyDeed />} />
            <Route path="/verify-deed/:deedNumber" element={<VerifyDeed />} />
            <Route path="/verify/:deedNumber" element={<VerifyDeed />} />
          </Route>

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RootRedirect />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="properties" element={<Properties />} />
            <Route path="land-parcels" element={<LandParcels />} />
            <Route path="registration" element={<PropertyRegistration />} />
            <Route path="transfer" element={<PropertyTransfer />} />
            <Route path="documents" element={<Documents />} />
            <Route path="payments" element={<Payments />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route
              path="users"
              element={
                <ProtectedRoute allow={["admin"]}>
                  <AdminUserManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<PublicLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
