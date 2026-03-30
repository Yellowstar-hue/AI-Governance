import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Card, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, LinearProgress,
  IconButton,
} from "@mui/material";
import { Add, Delete, Link as LinkIcon } from "@mui/icons-material";
import { evidenceAPI } from "../services/api";

const Evidence = () => {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", type: "document", folder: "General", url: "",
  });

  const fetchEvidence = () => {
    evidenceAPI.list()
      .then((res) => setEvidence(res.data.evidence))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchEvidence, []);

  const handleCreate = async () => {
    try {
      await evidenceAPI.create(form);
      setOpen(false);
      setForm({ title: "", description: "", type: "document", folder: "General", url: "" });
      fetchEvidence();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this evidence?")) {
      await evidenceAPI.delete(id);
      fetchEvidence();
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4">Evidence Center</Typography>
          <Typography variant="body2" color="text.secondary">
            Collect and organize compliance evidence for audits
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Add Evidence
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Title</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Folder</strong></TableCell>
                <TableCell><strong>Uploaded By</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evidence.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{e.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{e.description}</Typography>
                  </TableCell>
                  <TableCell><Chip label={e.type} size="small" variant="outlined" /></TableCell>
                  <TableCell>{e.folder}</TableCell>
                  <TableCell>{e.uploaded_by_name}</TableCell>
                  <TableCell>{new Date(e.created_at).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>
                    {e.url && (
                      <IconButton size="small" href={e.url} target="_blank"><LinkIcon /></IconButton>
                    )}
                    <IconButton size="small" color="error" onClick={() => handleDelete(e.id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {evidence.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No evidence collected yet</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Evidence</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth label="Title" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth select label="Type" value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })} sx={{ mb: 2 }}>
            {["document", "screenshot", "log", "certificate", "policy", "report", "other"]
              .map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Folder" value={form.folder}
            onChange={(e) => setForm({ ...form, folder: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="URL (optional)" value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.title}>Add Evidence</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Evidence;
