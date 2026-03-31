import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Card, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, LinearProgress,
  FormControlLabel, Switch, Grid,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { dataProcessingAPI } from "../services/api";

const DataProcessing = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", purpose: "", legal_basis: "consent",
    data_categories: [], data_subjects: [],
    retention_period: "", cross_border_transfer: false,
    security_measures: "", dpia_required: false,
  });

  const fetchData = () => {
    dataProcessingAPI.list()
      .then((res) => setActivities(res.data.activities))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, []);

  const handleCreate = async () => {
    try {
      await dataProcessingAPI.create(form);
      setOpen(false);
      setForm({
        name: "", purpose: "", legal_basis: "consent",
        data_categories: [], data_subjects: [],
        retention_period: "", cross_border_transfer: false,
        security_measures: "", dpia_required: false,
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4">Data Processing Register</Typography>
          <Typography variant="body2" color="text.secondary">
            DPDP Act 2023 compliance — Record of Processing Activities (ROPA)
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Add Activity
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Activity</strong></TableCell>
                <TableCell><strong>Legal Basis</strong></TableCell>
                <TableCell><strong>Cross-Border</strong></TableCell>
                <TableCell><strong>DPIA</strong></TableCell>
                <TableCell><strong>Retention</strong></TableCell>
                <TableCell><strong>AI Model</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{a.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{a.purpose}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={a.legal_basis?.replace(/_/g, " ")} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={a.cross_border_transfer ? "Yes" : "No"}
                      size="small"
                      color={a.cross_border_transfer ? "warning" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {a.dpia_required ? (
                      <Chip
                        label={a.dpia_completed ? "Completed" : "Required"}
                        size="small"
                        color={a.dpia_completed ? "success" : "error"}
                      />
                    ) : (
                      <Chip label="N/A" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>{a.retention_period}</TableCell>
                  <TableCell>{a.model_name || "-"}</TableCell>
                  <TableCell><Chip label={a.status} size="small" variant="outlined" /></TableCell>
                </TableRow>
              ))}
              {activities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No data processing activities recorded. Under DPDP Act 2023, maintaining a processing register is recommended.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Register Data Processing Activity</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Activity Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ mt: 1 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Purpose of Processing" value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Legal Basis (DPDP)" value={form.legal_basis}
                onChange={(e) => setForm({ ...form, legal_basis: e.target.value })}>
                {["consent", "contract", "legal_obligation", "vital_interest", "public_interest", "legitimate_interest"]
                  .map((b) => <MenuItem key={b} value={b}>{b.replace(/_/g, " ")}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Retention Period" value={form.retention_period}
                onChange={(e) => setForm({ ...form, retention_period: e.target.value })}
                placeholder="e.g., 3 years, Until consent withdrawn" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Security Measures" value={form.security_measures}
                onChange={(e) => setForm({ ...form, security_measures: e.target.value })}
                placeholder="Describe encryption, access controls, etc." />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={<Switch checked={form.cross_border_transfer}
                  onChange={(e) => setForm({ ...form, cross_border_transfer: e.target.checked })} />}
                label="Involves Cross-Border Data Transfer"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={<Switch checked={form.dpia_required}
                  onChange={(e) => setForm({ ...form, dpia_required: e.target.checked })} />}
                label="DPIA Required"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name || !form.purpose}>
            Register Activity
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataProcessing;
