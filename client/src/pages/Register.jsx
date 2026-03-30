import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, Container,
} from "@mui/material";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", organizationName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(135deg, #1a237e 0%, #0d1642 50%, #1a237e 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Box
                component="img"
                src="/aisafe-logo.svg"
                alt="AISafe"
                sx={{ width: 64, height: 64, mb: 2 }}
              />
              <Typography variant="h4" color="primary" gutterBottom>
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start governing your AI systems responsibly
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Full Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required sx={{ mb: 2 }}
              />
              <TextField
                fullWidth label="Organization Name" value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                required sx={{ mb: 2 }}
              />
              <TextField
                fullWidth label="Email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required sx={{ mb: 2 }}
              />
              <TextField
                fullWidth label="Password" type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required helperText="Minimum 8 characters" sx={{ mb: 3 }}
              />
              <Button
                type="submit" fullWidth variant="contained" size="large"
                disabled={loading} sx={{ py: 1.5 }}
              >
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </form>

            <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#1a237e", fontWeight: 600 }}>
                Sign In
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Register;
