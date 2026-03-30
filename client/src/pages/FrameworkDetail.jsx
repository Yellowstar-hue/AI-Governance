import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Button, Chip, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  MenuItem, Select, FormControl,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { frameworksAPI, complianceAPI } from "../services/api";

const statusColors = {
  compliant: "success", partially_compliant: "warning",
  non_compliant: "error", not_assessed: "default", not_applicable: "default",
};

const FrameworkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [framework, setFramework] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    frameworksAPI.get(id)
      .then((res) => {
        setFramework(res.data.framework);
        setRequirements(res.data.requirements);
      })
      .catch(() => navigate("/compliance"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (reqId, status) => {
    try {
      await complianceAPI.updateRequirement(reqId, { status });
      setRequirements((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleInitialize = async () => {
    try {
      const res = await frameworksAPI.initialize(id);
      setRequirements(res.data.requirements);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LinearProgress />;
  if (!framework) return null;

  const compliant = requirements.filter((r) => r.status === "compliant").length;
  const total = requirements.length || 1;
  const pct = Math.round((compliant / total) * 100);

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate("/compliance")} sx={{ mb: 2 }}>
        Back to Compliance
      </Button>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Chip label={framework.short_code} sx={{ bgcolor: "#1a237e", color: "#fff", fontWeight: 600, mb: 1 }} />
              <Typography variant="h5">{framework.name}</Typography>
              <Typography variant="body2" color="text.secondary">{framework.description}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Issuing Body: {framework.issuing_body} | Version: {framework.version}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight={700} color="primary">{pct}%</Typography>
              <Typography variant="caption">Compliant</Typography>
            </Box>
          </Box>
          <LinearProgress variant="determinate" value={pct} sx={{ mt: 2, height: 8, borderRadius: 4 }} />
        </CardContent>
      </Card>

      {requirements.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" gutterBottom>Framework Not Initialized</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Initialize this framework to load compliance requirements for your organization.
            </Typography>
            <Button variant="contained" onClick={handleInitialize}>
              Initialize Framework
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={80}><strong>Section</strong></TableCell>
                  <TableCell><strong>Requirement</strong></TableCell>
                  <TableCell width={200}><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requirements.map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell>
                      <Chip label={req.section_number} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{req.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{req.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req.id, e.target.value)}
                        >
                          {["compliant", "partially_compliant", "non_compliant", "not_assessed", "not_applicable"]
                            .map((s) => (
                              <MenuItem key={s} value={s}>
                                <Chip label={s.replace(/_/g, " ")} size="small" color={statusColors[s]} />
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
};

export default FrameworkDetail;
