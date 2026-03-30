import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Card, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, LinearProgress,
  FormControlLabel, Switch, Alert,
} from "@mui/material";
import { Add, Warning } from "@mui/icons-material";
import { incidentsAPI } from "../services/api";

const severityColors = { critical: "error", high: "warning", medium: "info", low: "success" };

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", severity: "medium", category: "other",
    affected_users: 0, cert_in_reportable: false,
  });

  const fetchIncidents = () => {
    incidentsAPI.list()
      .then((res) => setIncidents(res.data.incidents))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchIncidents, []);

  const handleCreate = async () => {
    try {
      await incidentsAPI.create(form);
      setOpen(false);
      setForm({ title: "", description: "", severity: "medium", category: "other",
        affected_users: 0, cert_in_reportable: false });
      fetchIncidents();
    } catch (err) { console.error(err); }
  };

  const certInCount = incidents.filter((i) => i.cert_in_reportable).length;

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4">Incident Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Track and respond to AI-related incidents per CERT-In requirements
          </Typography>
        </Box>
        <Button variant="contained" color="error" startIcon={<Add />} onClick={() => setOpen(true)}>
          Report Incident
        </Button>
      </Box>

      {certInCount > 0 && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
          <strong>{certInCount} incident(s)</strong> flagged as CERT-In reportable.
          Under CERT-In guidelines, cyber incidents must be reported within 6 hours.
        </Alert>
      )}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Incident</strong></TableCell>
                <TableCell><strong>Severity</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>CERT-In</strong></TableCell>
                <TableCell><strong>Reported</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents.map((i) => (
                <TableRow key={i.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{i.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{i.model_name || ""}</Typography>
                  </TableCell>
                  <TableCell><Chip label={i.severity} size="small" color={severityColors[i.severity]} /></TableCell>
                  <TableCell>{i.category?.replace(/_/g, " ")}</TableCell>
                  <TableCell><Chip label={i.status} size="small" variant="outlined" /></TableCell>
                  <TableCell>
                    {i.cert_in_reportable && <Chip label="Reportable" size="small" color="error" />}
                  </TableCell>
                  <TableCell>{new Date(i.created_at).toLocaleDateString("en-IN")}</TableCell>
                </TableRow>
              ))}
              {incidents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No incidents reported</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report Incident</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth label="Title" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth multiline rows={3} label="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth select label="Severity" value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })} sx={{ mb: 2 }}>
            {["critical", "high", "medium", "low"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField fullWidth select label="Category" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })} sx={{ mb: 2 }}>
            {["bias_output", "data_breach", "model_failure", "privacy_violation",
              "safety_issue", "security_breach", "misinformation", "regulatory_violation", "other"]
              .map((c) => <MenuItem key={c} value={c}>{c.replace(/_/g, " ")}</MenuItem>)}
          </TextField>
          <TextField fullWidth type="number" label="Affected Users" value={form.affected_users}
            onChange={(e) => setForm({ ...form, affected_users: parseInt(e.target.value) || 0 })} sx={{ mb: 2 }} />
          <FormControlLabel
            control={<Switch checked={form.cert_in_reportable}
              onChange={(e) => setForm({ ...form, cert_in_reportable: e.target.checked })} />}
            label="CERT-In Reportable (6-hour reporting window)"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleCreate} disabled={!form.title || !form.description}>
            Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Incidents;
