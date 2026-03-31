import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Card, CardContent, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  LinearProgress, Grid,
} from "@mui/material";
import { Add, Assessment, CheckCircle } from "@mui/icons-material";
import { assessmentsAPI } from "../services/api";

const riskColors = { critical: "error", high: "warning", medium: "info", low: "success" };
const statusColors = { draft: "default", in_progress: "warning", completed: "success", approved: "success" };

const Assessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ template_id: "", title: "" });

  const fetchData = () => {
    Promise.all([assessmentsAPI.list(), assessmentsAPI.templates()])
      .then(([aRes, tRes]) => {
        setAssessments(aRes.data.assessments);
        setTemplates(tRes.data.templates);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, []);

  const handleCreate = async () => {
    try {
      await assessmentsAPI.create({
        template_id: parseInt(form.template_id),
        title: form.title,
      });
      setOpen(false);
      setForm({ template_id: "", title: "" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4">Assessments</Typography>
          <Typography variant="body2" color="text.secondary">
            Conduct risk assessments, DPDP readiness checks, and vendor due diligence
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          New Assessment
        </Button>
      </Box>

      {/* Assessment Templates */}
      <Typography variant="h6" gutterBottom>Assessment Templates</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {templates.map((t) => (
          <Grid item xs={12} sm={6} md={4} key={t.id}>
            <Card
              sx={{
                cursor: "pointer",
                "&:hover": { transform: "translateY(-2px)", transition: "0.2s" },
              }}
              onClick={() => {
                setForm({ template_id: t.id, title: t.name });
                setOpen(true);
              }}
            >
              <CardContent>
                <Assessment sx={{ color: "primary.main", mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>{t.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t.description}
                </Typography>
                <Chip label={t.type.replace(/_/g, " ")} size="small" variant="outlined" />
                <Chip
                  label={`${JSON.parse(JSON.stringify(t.questions || [])).length} questions`}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Assessments List */}
      <Typography variant="h6" gutterBottom>Completed & In-Progress</Typography>
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Assessment</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Subject</strong></TableCell>
                <TableCell><strong>Score</strong></TableCell>
                <TableCell><strong>Risk Rating</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Assigned To</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assessments.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>{a.title}</TableCell>
                  <TableCell>
                    <Chip label={a.assessment_type?.replace(/_/g, " ")} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{a.model_name || a.vendor_name || "-"}</TableCell>
                  <TableCell>
                    {a.score !== null ? (
                      <Typography fontWeight={700}>{a.score}%</Typography>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {a.risk_rating && (
                      <Chip label={a.risk_rating} size="small" color={riskColors[a.risk_rating]} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={a.status} size="small" color={statusColors[a.status]} />
                  </TableCell>
                  <TableCell>{a.assignee_name || "-"}</TableCell>
                  <TableCell>{new Date(a.created_at).toLocaleDateString("en-IN")}</TableCell>
                </TableRow>
              ))}
              {assessments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No assessments yet. Create one from a template above.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Assessment</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            select
            label="Assessment Template"
            value={form.template_id}
            onChange={(e) => {
              const t = templates.find((t) => t.id === parseInt(e.target.value));
              setForm({ template_id: e.target.value, title: t?.name || "" });
            }}
            sx={{ mb: 2, mt: 1 }}
          >
            {templates.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Assessment Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.template_id || !form.title}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assessments;
