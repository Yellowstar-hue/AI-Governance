import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Card, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, LinearProgress,
  FormControlLabel, Switch,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { vendorsAPI } from "../services/api";

const riskColors = { low: "success", medium: "info", high: "warning", critical: "error" };

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", contact_email: "", risk_level: "medium", country: "India",
    services_provided: "", data_processing_location: "india", dpdp_compliant: false,
  });

  const fetchVendors = () => {
    vendorsAPI.list()
      .then((res) => setVendors(res.data.vendors))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchVendors, []);

  const handleCreate = async () => {
    try {
      await vendorsAPI.create(form);
      setOpen(false);
      setForm({ name: "", contact_email: "", risk_level: "medium", country: "India",
        services_provided: "", data_processing_location: "india", dpdp_compliant: false });
      fetchVendors();
    } catch (err) { console.error(err); }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4">Vendor Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage third-party AI vendors and assess DPDP compliance
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Add Vendor
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Vendor</strong></TableCell>
                <TableCell><strong>Risk Level</strong></TableCell>
                <TableCell><strong>Data Location</strong></TableCell>
                <TableCell><strong>DPDP Compliant</strong></TableCell>
                <TableCell><strong>Models</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((v) => (
                <TableRow key={v.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{v.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{v.country}</Typography>
                  </TableCell>
                  <TableCell><Chip label={v.risk_level} size="small" color={riskColors[v.risk_level]} /></TableCell>
                  <TableCell>{v.data_processing_location || "-"}</TableCell>
                  <TableCell>
                    <Chip label={v.dpdp_compliant ? "Yes" : "No"} size="small"
                      color={v.dpdp_compliant ? "success" : "error"} variant="outlined" />
                  </TableCell>
                  <TableCell>{v.model_count || 0}</TableCell>
                  <TableCell><Chip label={v.status} size="small" variant="outlined" /></TableCell>
                </TableRow>
              ))}
              {vendors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No vendors added yet</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Vendor</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth label="Vendor Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Contact Email" type="email" value={form.contact_email}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Country" value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Services Provided" value={form.services_provided}
            onChange={(e) => setForm({ ...form, services_provided: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth select label="Risk Level" value={form.risk_level}
            onChange={(e) => setForm({ ...form, risk_level: e.target.value })} sx={{ mb: 2 }}>
            {["low", "medium", "high", "critical"].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <TextField fullWidth select label="Data Processing Location" value={form.data_processing_location}
            onChange={(e) => setForm({ ...form, data_processing_location: e.target.value })} sx={{ mb: 2 }}>
            {["india", "international", "both"].map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </TextField>
          <FormControlLabel
            control={<Switch checked={form.dpdp_compliant} onChange={(e) => setForm({ ...form, dpdp_compliant: e.target.checked })} />}
            label="DPDP Act 2023 Compliant"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name}>Add Vendor</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vendors;
