import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Chip, LinearProgress, TextField, MenuItem,
} from "@mui/material";
import { auditAPI } from "../services/api";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ entity_type: "" });

  const fetchLogs = () => {
    setLoading(true);
    auditAPI.logs(filter.entity_type ? { entity_type: filter.entity_type } : {})
      .then((res) => setLogs(res.data.logs))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchLogs, [filter]);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4">Audit Logs</Typography>
          <Typography variant="body2" color="text.secondary">
            Complete activity trail for governance and compliance audits
          </Typography>
        </Box>
        <TextField
          select label="Filter by Type" value={filter.entity_type}
          onChange={(e) => setFilter({ entity_type: e.target.value })}
          sx={{ minWidth: 180 }} size="small"
        >
          <MenuItem value="">All</MenuItem>
          {["user", "ai_model", "risk", "vendor", "incident", "policy", "evidence"]
            .map((t) => <MenuItem key={t} value={t}>{t.replace("_", " ")}</MenuItem>)}
        </TextField>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Action</strong></TableCell>
                <TableCell><strong>Entity</strong></TableCell>
                <TableCell><strong>User</strong></TableCell>
                <TableCell><strong>IP Address</strong></TableCell>
                <TableCell><strong>Timestamp</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Chip label={log.action.replace(/_/g, " ")} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={log.entity_type} size="small" /> #{log.entity_id}
                  </TableCell>
                  <TableCell>{log.user_name || log.user_email}</TableCell>
                  <TableCell><Typography variant="caption">{log.ip_address}</Typography></TableCell>
                  <TableCell>{new Date(log.created_at).toLocaleString("en-IN")}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No audit logs found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default AuditLogs;
