import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Box, CircularProgress } from "@mui/material";

// Layout
import Layout from "./components/common/Layout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Models from "./pages/Models";
import ModelDetail from "./pages/ModelDetail";
import Risks from "./pages/Risks";
import Compliance from "./pages/Compliance";
import FrameworkDetail from "./pages/FrameworkDetail";
import Vendors from "./pages/Vendors";
import Incidents from "./pages/Incidents";
import Policies from "./pages/Policies";
import Evidence from "./pages/Evidence";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  return user ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/models" element={<Models />} />
                <Route path="/models/:id" element={<ModelDetail />} />
                <Route path="/risks" element={<Risks />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/compliance/:id" element={<FrameworkDetail />} />
                <Route path="/vendors" element={<Vendors />} />
                <Route path="/incidents" element={<Incidents />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/evidence" element={<Evidence />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/audit" element={<AuditLogs />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
