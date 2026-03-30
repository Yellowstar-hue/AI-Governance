import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, LinearProgress,
} from "@mui/material";
import { Add, Description } from "@mui/icons-material";
import { policiesAPI } from "../services/api";

const statusColors = { draft: "default", review: "warning", approved: "success", archived: "default" };

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", content: "", category: "ai_usage", version: "1.0",
  });

  const fetchPolicies = () => {
    policiesAPI.list()
      .then((res) => setPolicies(res.data.policies))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchPolicies, []);

  const handleCreate = async () => {
    try {
      await policiesAPI.create(form);
      setOpen(false);
      setForm({ title: "", content: "", category: "ai_usage", version: "1.0" });
      fetchPolicies();
    } catch (err) { console.error(err); }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4">Policy Manager</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage AI governance policies aligned with Indian regulations
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Create Policy
        </Button>
      </Box>

      <Grid container spacing={3}>
        {policies.map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Description color="primary" />
                  <Chip label={p.status} size="small" color={statusColors[p.status]} />
                </Box>
                <Typography variant="h6" gutterBottom>{p.title}</Typography>
                <Chip label={p.category?.replace(/_/g, " ")} size="small" variant="outlined" sx={{ mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Version {p.version} | By {p.author_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(p.created_at).toLocaleDateString("en-IN")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {policies.length === 0 && (
          <Grid item xs={12}>
            <Card><CardContent sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary">No policies created yet</Typography>
            </CardContent></Card>
          </Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Policy</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth label="Policy Title" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth select label="Category" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })} sx={{ mb: 2 }}>
            {["ai_usage", "data_protection", "model_governance", "vendor_management",
              "incident_response", "ethics", "transparency", "risk_management", "other"]
              .map((c) => <MenuItem key={c} value={c}>{c.replace(/_/g, " ")}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Version" value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth multiline rows={10} label="Policy Content" value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.title || !form.content}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Policies;
