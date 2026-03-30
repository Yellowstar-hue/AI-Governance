import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar,
  Menu, MenuItem, Divider, Chip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon, Psychology, Warning, VerifiedUser,
  Store, ReportProblem, Policy, Folder, Assessment, History,
  Settings, Menu as MenuIcon, Logout, ChevronLeft,
} from "@mui/icons-material";

const DRAWER_WIDTH = 260;

const navItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
  { text: "AI Models", icon: <Psychology />, path: "/models" },
  { text: "Risk Register", icon: <Warning />, path: "/risks" },
  { text: "Compliance", icon: <VerifiedUser />, path: "/compliance" },
  { text: "Vendors", icon: <Store />, path: "/vendors" },
  { text: "Incidents", icon: <ReportProblem />, path: "/incidents" },
  { text: "Policies", icon: <Policy />, path: "/policies" },
  { text: "Evidence", icon: <Folder />, path: "/evidence" },
  { text: "Reports", icon: <Assessment />, path: "/reports" },
  { text: "Audit Logs", icon: <History />, path: "/audit" },
  { text: "Settings", icon: <Settings />, path: "/settings" },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 72,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerOpen ? DRAWER_WIDTH : 72,
            boxSizing: "border-box",
            background: "linear-gradient(180deg, #1a237e 0%, #0d1642 100%)",
            color: "#fff",
            transition: "width 0.2s",
            overflowX: "hidden",
          },
        }}
      >
        <Toolbar
          sx={{
            justifyContent: drawerOpen ? "space-between" : "center",
            px: drawerOpen ? 2 : 1,
          }}
        >
          {drawerOpen && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                component="img"
                src="/aisafe-logo.svg"
                alt="AISafe"
                sx={{ width: 32, height: 32 }}
              />
              <Typography variant="h6" fontWeight={700}>
                AISafe
              </Typography>
            </Box>
          )}
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} sx={{ color: "#fff" }}>
            {drawerOpen ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>
        </Toolbar>

        {drawerOpen && (
          <Box sx={{ px: 2, py: 1 }}>
            <Chip
              label="India Compliance"
              size="small"
              sx={{ bgcolor: "#FF9933", color: "#fff", fontWeight: 600, fontSize: "0.7rem" }}
            />
          </Box>
        )}

        <List sx={{ mt: 1 }}>
          {navItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.5,
                  justifyContent: drawerOpen ? "initial" : "center",
                  "&.Mui-selected": {
                    bgcolor: "rgba(255,255,255,0.15)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                  },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? "#FF9933" : "#ffffffb3",
                    minWidth: drawerOpen ? 40 : "unset",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {drawerOpen && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 500 }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: "#fff", color: "text.primary", borderBottom: "1px solid #e0e0e0" }}
        >
          <Toolbar sx={{ justifyContent: "flex-end" }}>
            <Typography variant="body2" sx={{ mr: 2, color: "text.secondary" }}>
              {user?.name}
            </Typography>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 14 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem disabled>
                <Typography variant="body2">{user?.email}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); navigate("/settings"); }}>
                <Settings sx={{ mr: 1, fontSize: 18 }} /> Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1, fontSize: 18 }} /> Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3, flexGrow: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default Layout;
