import React, { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Button, Chip,
  LinearProgress, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Divider, Alert,
} from "@mui/material";
import { CheckCircle, Star } from "@mui/icons-material";
import { subscriptionsAPI } from "../services/api";

const Subscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [usage, setUsage] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      subscriptionsAPI.plans(),
      subscriptionsAPI.current(),
      subscriptionsAPI.payments(),
    ])
      .then(([plansRes, currentRes, paymentsRes]) => {
        setPlans(plansRes.data.plans);
        setCurrent(currentRes.data.subscription);
        setUsage(currentRes.data.usage);
        setPayments(paymentsRes.data.payments);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (slug) => {
    try {
      await subscriptionsAPI.subscribe({ plan_slug: slug, billing_cycle: "monthly" });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LinearProgress />;

  const planColors = {
    free: "#9e9e9e",
    starter: "#1a237e",
    professional: "#FF9933",
    enterprise: "#138808",
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Subscription & Billing</Typography>

      {/* Current Plan */}
      {current && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You're on the <strong>{current.plan_name}</strong> plan.
          {current.current_period_end && ` Valid until ${new Date(current.current_period_end).toLocaleDateString("en-IN")}`}
        </Alert>
      )}

      {/* Usage */}
      {usage && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Current Usage</Typography>
            <Grid container spacing={3}>
              {[
                { label: "Users", used: usage.users, max: usage.maxUsers },
                { label: "AI Models", used: usage.models, max: usage.maxModels },
                { label: "Vendors", used: usage.vendors, max: usage.maxVendors },
              ].map((item) => (
                <Grid item xs={12} sm={4} key={item.label}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="h6">
                    {item.used} / {item.max === -1 ? "Unlimited" : item.max}
                  </Typography>
                  {item.max > 0 && (
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((item.used / item.max) * 100, 100)}
                      sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    />
                  )}
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <Typography variant="h6" gutterBottom>Available Plans</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {plans.map((plan) => {
          const color = planColors[plan.slug] || "#1a237e";
          const isCurrent = current?.plan_slug === plan.slug;
          const features = plan.features || {};

          return (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <Card
                sx={{
                  height: "100%",
                  borderTop: `4px solid ${color}`,
                  position: "relative",
                  ...(isCurrent && { border: `2px solid ${color}` }),
                }}
              >
                {isCurrent && (
                  <Chip
                    icon={<Star />}
                    label="Current Plan"
                    size="small"
                    sx={{ position: "absolute", top: 8, right: 8, bgcolor: color, color: "#fff" }}
                  />
                )}
                <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <Typography variant="h6" fontWeight={700}>{plan.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {plan.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" fontWeight={700} color={color}>
                      {plan.price_monthly === 0 ? "Free" : `₹${plan.price_monthly.toLocaleString("en-IN")}`}
                    </Typography>
                    {plan.price_monthly > 0 && (
                      <Typography variant="caption" color="text.secondary">/month + GST</Typography>
                    )}
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ flexGrow: 1 }}>
                    {[
                      `${plan.max_users === -1 ? "Unlimited" : plan.max_users} users`,
                      `${plan.max_models === -1 ? "Unlimited" : plan.max_models} AI models`,
                      `${features.frameworks === "all" ? "All" : features.frameworks || 0} frameworks`,
                      features.trust_center && "AI Trust Center",
                      features.ai_advisor && "AI Governance Advisor",
                      features.webhooks && `${features.webhooks === -1 ? "Unlimited" : features.webhooks} webhooks`,
                      features.scheduled_reports && "Scheduled reports",
                      features.sso && "SSO / Entra ID",
                      `${features.support || "community"} support`,
                    ]
                      .filter(Boolean)
                      .map((feature, i) => (
                        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                          <CheckCircle sx={{ fontSize: 16, color }} />
                          <Typography variant="body2">{feature}</Typography>
                        </Box>
                      ))}
                  </Box>

                  <Button
                    variant={isCurrent ? "outlined" : "contained"}
                    fullWidth
                    sx={{ mt: 2, bgcolor: isCurrent ? "transparent" : color }}
                    disabled={isCurrent}
                    onClick={() => handleSubscribe(plan.slug)}
                  >
                    {isCurrent ? "Current" : plan.price_monthly === 0 ? "Get Started" : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Payment History */}
      {payments.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>Payment History</Typography>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Invoice</strong></TableCell>
                    <TableCell><strong>Plan</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>GST</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.invoice_number}</TableCell>
                      <TableCell>{p.plan_name}</TableCell>
                      <TableCell>₹{parseFloat(p.amount).toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{parseFloat(p.gst_amount).toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Chip label={p.status} size="small" color={p.status === "completed" ? "success" : "default"} />
                      </TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleDateString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  );
};

export default Subscriptions;
