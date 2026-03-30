import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button,
  LinearProgress, Divider,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { modelsAPI } from "../services/api";

const ModelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    modelsAPI.get(id)
      .then((res) => setModel(res.data.model))
      .catch(() => navigate("/models"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LinearProgress />;
  if (!model) return null;

  const riskColors = { minimal: "success", limited: "info", high: "warning", unacceptable: "error" };

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate("/models")} sx={{ mb: 2 }}>
        Back to Models
      </Button>

      <Typography variant="h4" gutterBottom>{model.name}</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Model Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {[
                  ["Purpose", model.purpose],
                  ["Description", model.description || "N/A"],
                  ["Type", model.model_type],
                  ["Data Sources", model.data_sources || "N/A"],
                  ["Created", new Date(model.created_at).toLocaleDateString("en-IN")],
                ].map(([label, value]) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body1">{value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Status</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Risk Level</Typography>
                  <Box><Chip label={model.risk_level} color={riskColors[model.risk_level]} /></Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box><Chip label={model.status} color={model.status === "active" ? "success" : "default"} /></Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Environment</Typography>
                  <Box><Chip label={model.deployment_env} variant="outlined" /></Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModelDetail;
