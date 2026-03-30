import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Grid, Card, CardContent, Typography, Chip, LinearProgress,
  List, ListItem, ListItemText, Paper, Divider,
} from "@mui/material";
import {
  Psychology, Warning, VerifiedUser, Store, ReportProblem, TrendingUp,
} from "@mui/icons-material";
import { dashboardAPI } from "../services/api";

const StatCard = ({ title, value, subtitle, icon, color, onClick }) => (
  <Card
    sx={{ cursor: onClick ? "pointer" : "default", "&:hover": onClick ? { transform: "translateY(-2px)", transition: "0.2s" } : {} }}
    onClick={onClick}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            bgcolor: `${color}15`,
            borderRadius: 2,
            p: 1.5,
            display: "flex",
            alignItems: "center",
          }}
        >
          {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI
      .get()
      .then((res) => setData(res.data.dashboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;

  const d = data || {
    models: { total: 0, high_risk: 0, active: 0 },
    risks: { total: 0, critical: 0, open: 0 },
    incidents: { total: 0, open: 0, cert_in_reportable: 0 },
    compliance: { score: 0, total: 0, compliant: 0 },
    vendors: { total: 0, high_risk: 0, dpdp_compliant: 0 },
    recentActivity: [],
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          AI Governance Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of your organization's AI governance posture
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="AI Models"
            value={d.models.total}
            subtitle={`${d.models.high_risk} high risk`}
            icon={<Psychology />}
            color="#1a237e"
            onClick={() => navigate("/models")}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Risks"
            value={d.risks.open}
            subtitle={`${d.risks.critical} critical`}
            icon={<Warning />}
            color="#f44336"
            onClick={() => navigate("/risks")}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Compliance Score"
            value={`${d.compliance.score}%`}
            subtitle={`${d.compliance.compliant} of ${d.compliance.total} requirements`}
            icon={<VerifiedUser />}
            color="#138808"
            onClick={() => navigate("/compliance")}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Vendors"
            value={d.vendors.total}
            subtitle={`${d.vendors.dpdp_compliant} DPDP compliant`}
            icon={<Store />}
            color="#FF9933"
            onClick={() => navigate("/vendors")}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Incidents */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6">Incidents Overview</Typography>
                <Chip
                  label={`${d.incidents.cert_in_reportable} CERT-In Reportable`}
                  size="small"
                  color="error"
                  variant="outlined"
                />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}>
                    <Typography variant="h5" fontWeight={700}>{d.incidents.total}</Typography>
                    <Typography variant="caption">Total</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fce4ec" }}>
                    <Typography variant="h5" fontWeight={700}>{d.incidents.open}</Typography>
                    <Typography variant="caption">Open</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#e8f5e9" }}>
                    <Typography variant="h5" fontWeight={700}>
                      {parseInt(d.incidents.total) - parseInt(d.incidents.open)}
                    </Typography>
                    <Typography variant="caption">Resolved</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Activity
              </Typography>
              <List dense>
                {(d.recentActivity || []).slice(0, 6).map((activity, i) => (
                  <React.Fragment key={i}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            <strong>{activity.user_name}</strong>{" "}
                            {activity.action.toLowerCase().replace(/_/g, " ")}
                          </Typography>
                        }
                        secondary={new Date(activity.created_at).toLocaleString("en-IN")}
                      />
                    </ListItem>
                    {i < 5 && <Divider />}
                  </React.Fragment>
                ))}
                {(!d.recentActivity || d.recentActivity.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No recent activity. Start by adding AI models and assessing compliance.
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                India Regulatory Quick Links
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {[
                  { label: "DPDP Act 2023", color: "#1a237e" },
                  { label: "NITI Aayog RAI", color: "#FF9933" },
                  { label: "MeitY Guidelines", color: "#138808" },
                  { label: "BIS AI Standards", color: "#1565c0" },
                  { label: "CERT-In Reporting", color: "#c62828" },
                  { label: "RBI AI/ML", color: "#6a1b9a" },
                  { label: "SEBI AI", color: "#00695c" },
                  { label: "IRDAI AI", color: "#e65100" },
                  { label: "IndiaAI Mission", color: "#2e7d32" },
                  { label: "IT Act 2000", color: "#37474f" },
                ].map((fw) => (
                  <Chip
                    key={fw.label}
                    label={fw.label}
                    onClick={() => navigate("/compliance")}
                    sx={{
                      bgcolor: fw.color,
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                      "&:hover": { opacity: 0.85 },
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
