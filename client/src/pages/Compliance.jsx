import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Grid, Card, CardContent, LinearProgress, Chip, Button,
} from "@mui/material";
import { VerifiedUser, ArrowForward } from "@mui/icons-material";
import { complianceAPI, frameworksAPI } from "../services/api";

const frameworkColors = {
  "DPDP-2023": "#1a237e", "NITI-RAI": "#FF9933", "MEITY-AI": "#138808",
  "BIS-AI": "#1565c0", "CERT-IN": "#c62828", "RBI-AIML": "#6a1b9a",
  "SEBI-AI": "#00695c", "IRDAI-AI": "#e65100", "INDIAAI": "#2e7d32",
  "IT-ACT": "#37474f",
};

const Compliance = () => {
  const navigate = useNavigate();
  const [frameworks, setFrameworks] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([complianceAPI.overview(), complianceAPI.score()])
      .then(([fwRes, scoreRes]) => {
        setFrameworks(fwRes.data.frameworks);
        setScore(scoreRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Compliance Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Track compliance with Indian AI regulatory frameworks
        </Typography>
      </Box>

      {/* Overall Score */}
      <Card sx={{ mb: 4, background: "linear-gradient(135deg, #1a237e, #283593)" }}>
        <CardContent sx={{ p: 4, color: "#fff" }}>
          <Grid container alignItems="center" spacing={3}>
            <Grid item>
              <VerifiedUser sx={{ fontSize: 48, color: "#FF9933" }} />
            </Grid>
            <Grid item xs>
              <Typography variant="h5">Overall Compliance Score</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Across all active Indian regulatory frameworks
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="h2" fontWeight={700}>
                {score?.score || 0}%
              </Typography>
            </Grid>
          </Grid>
          <LinearProgress
            variant="determinate"
            value={score?.score || 0}
            sx={{
              mt: 2, height: 8, borderRadius: 4,
              bgcolor: "rgba(255,255,255,0.2)",
              "& .MuiLinearProgress-bar": { bgcolor: "#FF9933" },
            }}
          />
        </CardContent>
      </Card>

      {/* Frameworks Grid */}
      <Grid container spacing={3}>
        {frameworks.map((fw) => {
          const total = parseInt(fw.total_requirements) || 1;
          const compliant = parseInt(fw.compliant) || 0;
          const partial = parseInt(fw.partial) || 0;
          const pct = Math.round(((compliant + partial * 0.5) / total) * 100);
          const color = frameworkColors[fw.short_code] || "#1a237e";

          return (
            <Grid item xs={12} sm={6} md={4} key={fw.framework_id}>
              <Card
                sx={{
                  cursor: "pointer", height: "100%",
                  borderTop: `4px solid ${color}`,
                  "&:hover": { transform: "translateY(-2px)", transition: "0.2s" },
                }}
                onClick={() => navigate(`/compliance/${fw.framework_id}`)}
              >
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Chip label={fw.short_code} size="small" sx={{ bgcolor: color, color: "#fff", fontWeight: 600 }} />
                    <Typography variant="h6" fontWeight={700}>{pct}%</Typography>
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {fw.framework_name}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ mb: 1, height: 6, borderRadius: 3 }}
                  />
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                    <Chip label={`${fw.compliant} Compliant`} size="small" color="success" variant="outlined" />
                    <Chip label={`${fw.non_compliant} Non-compliant`} size="small" color="error" variant="outlined" />
                    <Chip label={`${fw.not_assessed} Pending`} size="small" variant="outlined" />
                  </Box>
                  <Button size="small" endIcon={<ArrowForward />} sx={{ mt: 2, color }}>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default Compliance;
