import React, { useState } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Button, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Chip,
} from "@mui/material";
import { Assessment, Security, Store } from "@mui/icons-material";
import { reportsAPI } from "../services/api";

const Reports = () => {
  const [activeReport, setActiveReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async (type) => {
    setLoading(true);
    setActiveReport(type);
    try {
      let res;
      if (type === "compliance") res = await reportsAPI.complianceSummary();
      else if (type === "risk") res = await reportsAPI.riskAssessment();
      else res = await reportsAPI.vendorAssessment();
      setReportData(res.data.report);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Reports & Analytics</Typography>
        <Typography variant="body2" color="text.secondary">
          Generate compliance and risk assessment reports
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { type: "compliance", title: "Compliance Summary", desc: "Overview across all Indian frameworks", icon: <Assessment />, color: "#1a237e" },
          { type: "risk", title: "Risk Assessment", desc: "AI risk analysis by category and model", icon: <Security />, color: "#c62828" },
          { type: "vendor", title: "Vendor Assessment", desc: "Third-party vendor DPDP compliance", icon: <Store />, color: "#FF9933" },
        ].map((r) => (
          <Grid item xs={12} md={4} key={r.type}>
            <Card
              sx={{
                cursor: "pointer", borderTop: `4px solid ${r.color}`,
                bgcolor: activeReport === r.type ? "#f5f5f5" : "#fff",
                "&:hover": { transform: "translateY(-2px)", transition: "0.2s" },
              }}
              onClick={() => loadReport(r.type)}
            >
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                {React.cloneElement(r.icon, { sx: { fontSize: 40, color: r.color, mb: 1 } })}
                <Typography variant="h6">{r.title}</Typography>
                <Typography variant="body2" color="text.secondary">{r.desc}</Typography>
                <Button variant="outlined" sx={{ mt: 2, color: r.color, borderColor: r.color }}>
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {reportData && activeReport === "compliance" && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Compliance Summary Report</Typography>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Generated: {new Date(reportData.generatedAt).toLocaleString("en-IN")}
            </Typography>
            <TableContainer sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Framework</strong></TableCell>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell><strong>Compliant</strong></TableCell>
                    <TableCell><strong>Non-Compliant</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.complianceByFramework?.map((fw) => (
                    <TableRow key={fw.short_code}>
                      <TableCell><Chip label={fw.short_code} size="small" /> {fw.name}</TableCell>
                      <TableCell>{fw.total}</TableCell>
                      <TableCell><Chip label={fw.compliant} size="small" color="success" /></TableCell>
                      <TableCell><Chip label={fw.non_compliant} size="small" color="error" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {reportData && activeReport === "risk" && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Risk Assessment Report</Typography>
            <TableContainer sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Severity</strong></TableCell>
                    <TableCell><strong>Count</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.risksByCategory?.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.category?.replace(/_/g, " ")}</TableCell>
                      <TableCell><Chip label={r.severity} size="small" color={
                        { critical: "error", high: "warning", medium: "info", low: "success" }[r.severity]
                      } /></TableCell>
                      <TableCell>{r.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {reportData && activeReport === "vendor" && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Vendor Assessment Report</Typography>
            <TableContainer sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Vendor</strong></TableCell>
                    <TableCell><strong>Risk</strong></TableCell>
                    <TableCell><strong>DPDP</strong></TableCell>
                    <TableCell><strong>Data Location</strong></TableCell>
                    <TableCell><strong>Models</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.vendors?.map((v, i) => (
                    <TableRow key={i}>
                      <TableCell>{v.name}</TableCell>
                      <TableCell><Chip label={v.risk_level} size="small" /></TableCell>
                      <TableCell>{v.dpdp_compliant ? "Yes" : "No"}</TableCell>
                      <TableCell>{v.data_processing_location}</TableCell>
                      <TableCell>{v.model_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Reports;
