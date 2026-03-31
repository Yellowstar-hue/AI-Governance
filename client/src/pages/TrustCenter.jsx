import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Switch, FormControlLabel, Divider, Alert, LinearProgress, Chip,
} from "@mui/material";
import { Public, Security } from "@mui/icons-material";
import { trustCenterAPI } from "../services/api";

const TrustCenter = () => {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({
    is_enabled: false,
    public_slug: "",
    company_description: "",
    ai_commitment: "",
    dpo_name: "",
    dpo_email: "",
    grievance_officer_name: "",
    grievance_officer_email: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    trustCenterAPI.get()
      .then((res) => {
        if (res.data.trustCenter) {
          setConfig(res.data.trustCenter);
          setForm({ ...form, ...res.data.trustCenter });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      const res = await trustCenterAPI.update(form);
      setConfig(res.data.trustCenter);
      setMessage({ type: "success", text: "Trust Center updated successfully" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Update failed" });
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4">AI Trust Center</Typography>
          <Typography variant="body2" color="text.secondary">
            Public-facing transparency portal for your AI governance (per MeitY & DPDP requirements)
          </Typography>
        </Box>
        {config?.is_enabled && config?.public_slug && (
          <Chip
            icon={<Public />}
            label={`Live at /trust/${config.public_slug}`}
            color="success"
            variant="outlined"
          />
        )}
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Trust Center Configuration</Typography>
              <Divider sx={{ mb: 3 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_enabled}
                    onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
                  />
                }
                label="Enable Public Trust Center"
                sx={{ mb: 2, display: "block" }}
              />

              <TextField
                fullWidth
                label="Public URL Slug"
                value={form.public_slug}
                onChange={(e) => setForm({ ...form, public_slug: e.target.value })}
                helperText="Your trust center will be accessible at /trust/{slug}"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Company Description"
                value={form.company_description || ""}
                onChange={(e) => setForm({ ...form, company_description: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="AI Commitment Statement"
                value={form.ai_commitment || ""}
                onChange={(e) => setForm({ ...form, ai_commitment: e.target.value })}
                placeholder="Describe your organization's commitment to responsible AI..."
                sx={{ mb: 3 }}
              />

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Data Protection Officer (DPDP Act)
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="DPO Name"
                    value={form.dpo_name || ""}
                    onChange={(e) => setForm({ ...form, dpo_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="DPO Email"
                    value={form.dpo_email || ""}
                    onChange={(e) => setForm({ ...form, dpo_email: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Grievance Officer (MeitY Requirement)
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Grievance Officer Name"
                    value={form.grievance_officer_name || ""}
                    onChange={(e) => setForm({ ...form, grievance_officer_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Grievance Officer Email"
                    value={form.grievance_officer_email || ""}
                    onChange={(e) => setForm({ ...form, grievance_officer_email: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Button variant="contained" onClick={handleSave} size="large">
                Save Trust Center
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: "#f5f6fa" }}>
            <CardContent>
              <Security sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
              <Typography variant="h6" gutterBottom>Why a Trust Center?</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Under MeitY AI Advisory Guidelines, organizations must maintain transparency about their AI systems.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The DPDP Act 2023 requires Significant Data Fiduciaries to publish transparency information and appoint a DPO.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your AI Trust Center displays:
              </Typography>
              <Box component="ul" sx={{ pl: 2, "& li": { mb: 0.5 } }}>
                <li><Typography variant="body2">Compliance scores</Typography></li>
                <li><Typography variant="body2">Published policies</Typography></li>
                <li><Typography variant="body2">AI model risk breakdown</Typography></li>
                <li><Typography variant="body2">DPO & Grievance Officer details</Typography></li>
                <li><Typography variant="body2">AI commitment statement</Typography></li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrustCenter;
