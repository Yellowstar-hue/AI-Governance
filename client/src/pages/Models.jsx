import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Card, CardContent, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  LinearProgress, IconButton,
} from "@mui/material";
import { Add, Visibility, Delete } from "@mui/icons-material";
import { modelsAPI } from "../services/api";

const riskColors = {
  minimal: "success", limited: "info", high: "warning", unacceptable: "error",
};

const Models = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", model_type: "nlp", risk_level: "limited",
    purpose: "", deployment_env: "development",
  });

  const fetchModels = () => {
    modelsAPI.list()
      .then((res) => setModels(res.data.models))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchModels, []);

  const handleCreate = async () => {
    try {
      await modelsAPI.create(form);
      setOpen(false);
      setForm({ name: "", description: "", model_type: "nlp", risk_level: "limited", purpose: "", deployment_env: "development" });
      fetchModels();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this model?")) {
      await modelsAPI.delete(id);
      fetchModels();
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4">AI Model Registry</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and monitor your AI/ML models
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Register Model
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Risk Level</strong></TableCell>
                <TableCell><strong>Environment</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>
                    <Chip label={m.model_type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={m.risk_level} size="small" color={riskColors[m.risk_level] || "default"} />
                  </TableCell>
                  <TableCell>{m.deployment_env}</TableCell>
                  <TableCell>
                    <Chip label={m.status} size="small" color={m.status === "active" ? "success" : "default"} />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => navigate(`/models/${m.id}`)}><Visibility /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(m.id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {models.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No AI models registered yet</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register AI Model</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth label="Model Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Purpose" value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth multiline rows={2} label="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth select label="Model Type" value={form.model_type}
            onChange={(e) => setForm({ ...form, model_type: e.target.value })} sx={{ mb: 2 }}>
            {["classification", "regression", "nlp", "computer_vision", "generative", "recommendation", "other"]
              .map((t) => <MenuItem key={t} value={t}>{t.replace("_", " ")}</MenuItem>)}
          </TextField>
          <TextField fullWidth select label="Risk Level" value={form.risk_level}
            onChange={(e) => setForm({ ...form, risk_level: e.target.value })} sx={{ mb: 2 }}>
            {["minimal", "limited", "high", "unacceptable"]
              .map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <TextField fullWidth select label="Environment" value={form.deployment_env}
            onChange={(e) => setForm({ ...form, deployment_env: e.target.value })}>
            {["production", "staging", "development", "retired"]
              .map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name || !form.purpose}>
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Models;
