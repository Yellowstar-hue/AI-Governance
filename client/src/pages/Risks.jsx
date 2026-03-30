import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Card, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, LinearProgress,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { risksAPI } from "../services/api";

const severityColors = { critical: "error", high: "warning", medium: "info", low: "success" };

const Risks = () => {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", severity: "medium",
    category: "operational", mitigation_plan: "",
  });

  const fetchRisks = () => {
    risksAPI.list()
      .then((res) => setRisks(res.data.risks))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchRisks, []);

  const handleCreate = async () => {
    try {
      await risksAPI.create(form);
      setOpen(false);
      setForm({ title: "", description: "", severity: "medium", category: "operational", mitigation_plan: "" });
      fetchRisks();
    } catch (err) { console.error(err); }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4">Risk Register</Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage AI-related risks
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Add Risk
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Title</strong></TableCell>
                <TableCell><strong>Severity</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Model</strong></TableCell>
                <TableCell><strong>Created</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {risks.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.title}</TableCell>
                  <TableCell><Chip label={r.severity} size="small" color={severityColors[r.severity]} /></TableCell>
                  <TableCell>{r.category?.replace(/_/g, " ")}</TableCell>
                  <TableCell><Chip label={r.status} size="small" variant="outlined" /></TableCell>
                  <TableCell>{r.model_name || "-"}</TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleDateString("en-IN")}</TableCell>
                </TableRow>
              ))}
              {risks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No risks identified yet</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Risk</DialogTitle>
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
            {["bias_discrimination", "privacy_data", "security", "transparency", "accountability",
              "safety", "environmental", "regulatory", "operational", "other"]
              .map((c) => <MenuItem key={c} value={c}>{c.replace(/_/g, " ")}</MenuItem>)}
          </TextField>
          <TextField fullWidth multiline rows={2} label="Mitigation Plan" value={form.mitigation_plan}
            onChange={(e) => setForm({ ...form, mitigation_plan: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.title || !form.description}>
            Add Risk
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Risks;
