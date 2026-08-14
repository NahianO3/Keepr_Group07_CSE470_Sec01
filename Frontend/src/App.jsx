import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import CustomerDashboard from "./pages/customer/Dashboard";
import Appliances from "./pages/customer/Appliances";
import ApplianceDetails from "./pages/customer/ApplianceDetails";
import MaintenanceSchedules from "./pages/customer/MaintenanceSchedules";
import MaintenanceHistory from "./pages/customer/MaintenanceHistory";
import Reminders from "./pages/customer/Reminders";

import ProviderDashboard from "./pages/provider/Dashboard";
import ProviderRequests from "./pages/provider/Requests";
import ProviderRequestDetails from "./pages/provider/RequestDetails";
import ProviderProfile from "./pages/provider/Profile";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminProviders from "./pages/admin/Providers";
import ProviderApproval from "./pages/admin/ProviderApproval";
import AdminMaintenanceRecords from "./pages/admin/MaintenanceRecords";

import RoleRoute from "./routes/RoleRoute";

function CustomerRoute({ children }) {
  return (
    <RoleRoute allowedRoles={["customer"]}>
      {children}
    </RoleRoute>
  );
}

function ProviderRoute({ children }) {
  return (
    <RoleRoute
      allowedRoles={["service_provider"]}
    >
      {children}
    </RoleRoute>
  );
}

function AdminRoute({ children }) {
  return (
    <RoleRoute allowedRoles={["admin"]}>
      {children}
    </RoleRoute>
  );
}

export default function App() {
  return (
    <Routes>
      {/* =========================
          ROOT
      ========================= */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      {/* =========================
          AUTH
      ========================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={
          <ForgotPassword />
        }
      />

      <Route
        path="/reset-password"
        element={
          <ResetPassword />
        }
      />

      {/* =========================
          CUSTOMER
      ========================= */}

      <Route
        path="/dashboard"
        element={
          <CustomerRoute>
            <CustomerDashboard />
          </CustomerRoute>
        }
      />

      <Route
        path="/appliances"
        element={
          <CustomerRoute>
            <Appliances />
          </CustomerRoute>
        }
      />

      <Route
        path="/appliances/:id"
        element={
          <CustomerRoute>
            <ApplianceDetails />
          </CustomerRoute>
        }
      />

      <Route
        path="/maintenance-schedules"
        element={
          <CustomerRoute>
            <MaintenanceSchedules />
          </CustomerRoute>
        }
      />

      <Route
        path="/maintenance-history"
        element={
          <CustomerRoute>
            <MaintenanceHistory />
          </CustomerRoute>
        }
      />

      <Route
        path="/reminders"
        element={
          <CustomerRoute>
            <Reminders />
          </CustomerRoute>
        }
      />

      {/* =========================
          SERVICE PROVIDER
      ========================= */}

      <Route
        path="/provider"
        element={
          <ProviderRoute>
            <ProviderDashboard />
          </ProviderRoute>
        }
      />

      <Route
        path="/provider/requests"
        element={
          <ProviderRoute>
            <ProviderRequests />
          </ProviderRoute>
        }
      />

      <Route
        path="/provider/requests/:id"
        element={
          <ProviderRoute>
            <ProviderRequestDetails />
          </ProviderRoute>
        }
      />

      <Route
        path="/provider/profile"
        element={
          <ProviderRoute>
            <ProviderProfile />
          </ProviderRoute>
        }
      />

      {/* =========================
          ADMIN
      ========================= */}

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/providers"
        element={
          <AdminRoute>
            <AdminProviders />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/provider-approval"
        element={
          <AdminRoute>
            <ProviderApproval />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/maintenance-records"
        element={
          <AdminRoute>
            <AdminMaintenanceRecords />
          </AdminRoute>
        }
      />

      {/* =========================
          FALLBACK
      ========================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />
    </Routes>
  );
}