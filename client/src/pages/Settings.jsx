import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Divider, Alert, MenuItem, LinearProgress,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { organizationsAPI, authAPI } from "../services/api";

const Settings = () => {
  const { user } = useAuth();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orgForm, setOrgForm] = useState({});
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    organizationsAPI.get()
      .then((res) => {
        setOrg(res.data.organization);
        setOrgForm(res.data.organization);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleOrgUpdate = async () => {
    try {
      const res = await organizationsAPI.update(orgForm);
      setOrg(res.data.organization);
      setMessage({ type: "success", text: "Organization updated" });
    } catch (err) {
      setMessage({ type: "error", text: "Update failed" });
    }
  };

  const handlePasswordChange = async () => {
    try {
      await authAPI.changePassword(pwForm);
      setPwForm({ currentPassword: "", newPassword: "" });
      setMessage({ type: "success", text: "Password updated" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Password update failed" });
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Organization Settings */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Organization Details</Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Organization Name" value={orgForm.name || ""}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="Industry" value={orgForm.industry || ""}
                    onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })}>
                    {["Technology", "Financial Services", "Healthcare", "Manufacturing",
                      "E-commerce", "Education", "Government", "Other"]
                      .map((i) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="Organization Size" value={orgForm.size || ""}
                    onChange={(e) => setOrgForm({ ...orgForm, size: e.target.value })}>
                    {["startup", "small", "medium", "large", "enterprise"]
                      .map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Website" value={orgForm.website || ""}
                    onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="GSTIN" value={orgForm.gstin || ""}
                    onChange={(e) => setOrgForm({ ...orgForm, gstin: e.target.value })}
                    helperText="Goods and Services Tax ID" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="CIN" value={orgForm.cin || ""}
                    onChange={(e) => setOrgForm({ ...orgForm, cin: e.target.value })}
                    helperText="Corporate Identity Number" />
                </Grid>
              </Grid>
              <Button variant="contained" sx={{ mt: 3 }} onClick={handleOrgUpdate}>
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Account */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Account</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2"><strong>Name:</strong> {user?.name}</Typography>
              <Typography variant="body2"><strong>Email:</strong> {user?.email}</Typography>
              <Typography variant="body2"><strong>Role:</strong> {user?.role}</Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Change Password</Typography>
              <Divider sx={{ mb: 2 }} />
              <TextField fullWidth type="password" label="Current Password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                sx={{ mb: 2 }} />
              <TextField fullWidth type="password" label="New Password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                sx={{ mb: 2 }} />
              <Button variant="outlined" fullWidth onClick={handlePasswordChange}
                disabled={!pwForm.currentPassword || !pwForm.newPassword}>
                Update Password
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
