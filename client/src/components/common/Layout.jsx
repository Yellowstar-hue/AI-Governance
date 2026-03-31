import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { notificationsAPI, searchAPI } from "../../services/api";
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar,
  Menu, MenuItem, Divider, Chip, Badge, TextField, InputAdornment,
  Popover, ListItemAvatar, Paper, Autocomplete, CircularProgress,
} from "@mui/material";
import {
  Dashboard as DashboardIcon, Psychology, Warning, VerifiedUser,
  Store, ReportProblem, Policy, Folder, Assessment, History,
  Settings, Menu as MenuIcon, Logout, ChevronLeft,
  SmartToy, CreditCard, Public, Assignment, Storage,
  Notifications, Search, Close,
} from "@mui/icons-material";

const DRAWER_WIDTH = 270;

const navSections = [
  {
    title: "Overview",
    items: [
      { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    ],
  },
  {
    title: "AI Governance",
    items: [
      { text: "AI Models", icon: <Psychology />, path: "/models" },
      { text: "Risk Register", icon: <Warning />, path: "/risks" },
      { text: "Assessments", icon: <Assignment />, path: "/assessments" },
      { text: "Data Processing", icon: <Storage />, path: "/data-processing" },
    ],
  },
  {
    title: "Compliance",
    items: [
      { text: "Frameworks", icon: <VerifiedUser />, path: "/compliance" },
      { text: "Policies", icon: <Policy />, path: "/policies" },
      { text: "Evidence Center", icon: <Folder />, path: "/evidence" },
    ],
  },
  {
    title: "Operations",
    items: [
      { text: "Vendors", icon: <Store />, path: "/vendors" },
      { text: "Incidents", icon: <ReportProblem />, path: "/incidents" },
      { text: "Reports", icon: <Assessment />, path: "/reports" },
    ],
  },
  {
    title: "Tools",
    items: [
      { text: "AI Advisor", icon: <SmartToy />, path: "/ai-advisor" },
      { text: "Trust Center", icon: <Public />, path: "/trust-center" },
    ],
  },
  {
    title: "System",
    items: [
      { text: "Audit Logs", icon: <History />, path: "/audit" },
      { text: "Subscription", icon: <CreditCard />, path: "/subscriptions" },
      { text: "Settings", icon: <Settings />, path: "/settings" },
    ],
  },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch notification count
  useEffect(() => {
    const fetchCount = () => {
      notificationsAPI.count()
        .then((res) => setUnreadCount(res.data.count))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotifOpen = async (e) => {
    setNotifAnchor(e.currentTarget);
    try {
      const res = await notificationsAPI.list();
      setNotifications(res.data.notifications);
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    await notificationsAPI.markAllRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await searchAPI.query(query);
      setSearchResults(res.data.results);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSelect = (result) => {
    const typeRoutes = {
      model: "/models",
      risk: "/risks",
      incident: "/incidents",
      vendor: "/vendors",
      policy: "/policies",
    };
    const route = typeRoutes[result.type];
    if (route) navigate(`${route}/${result.id}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

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
          <Box sx={{ px: 2, py: 1, display: "flex", gap: 0.5 }}>
            <Chip
              label="India"
              size="small"
              sx={{ bgcolor: "#FF9933", color: "#fff", fontWeight: 600, fontSize: "0.65rem" }}
            />
            <Chip
              label="SaaS"
              size="small"
              sx={{ bgcolor: "#138808", color: "#fff", fontWeight: 600, fontSize: "0.65rem" }}
            />
          </Box>
        )}

        <Box sx={{ overflow: "auto", mt: 1 }}>
          {navSections.map((section) => (
            <Box key={section.title}>
              {drawerOpen && (
                <Typography
                  variant="overline"
                  sx={{ px: 3, pt: 1.5, pb: 0.5, display: "block", color: "#ffffff60", fontSize: "0.65rem" }}
                >
                  {section.title}
                </Typography>
              )}
              <List disablePadding>
                {section.items.map((item) => (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      selected={
                        item.path === "/"
                          ? location.pathname === "/"
                          : location.pathname.startsWith(item.path)
                      }
                      sx={{
                        mx: 1,
                        borderRadius: 1.5,
                        mb: 0.25,
                        py: 0.75,
                        justifyContent: drawerOpen ? "initial" : "center",
                        "&.Mui-selected": {
                          bgcolor: "rgba(255,255,255,0.15)",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                        },
                        "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color:
                            (item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path))
                              ? "#FF9933"
                              : "#ffffffb3",
                          minWidth: drawerOpen ? 36 : "unset",
                          "& svg": { fontSize: 20 },
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {drawerOpen && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 500 }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </Box>
      </Drawer>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: "#fff", color: "text.primary", borderBottom: "1px solid #e0e0e0" }}
        >
          <Toolbar sx={{ gap: 1 }}>
            {/* Search */}
            <Box sx={{ flexGrow: 1, maxWidth: 400 }}>
              <TextField
                size="small"
                placeholder="Search models, risks, vendors..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 20, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchLoading ? (
                    <CircularProgress size={16} />
                  ) : searchQuery ? (
                    <IconButton size="small" onClick={() => { setSearchQuery(""); setSearchResults([]); }}>
                      <Close sx={{ fontSize: 16 }} />
                    </IconButton>
                  ) : null,
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#f5f6fa" } }}
              />
              {searchOpen && searchResults.length > 0 && (
                <Paper
                  sx={{
                    position: "absolute",
                    zIndex: 1300,
                    width: 400,
                    mt: 0.5,
                    maxHeight: 300,
                    overflow: "auto",
                    boxShadow: 3,
                  }}
                >
                  <List dense>
                    {searchResults.map((r, i) => (
                      <ListItem key={i} disablePadding>
                        <ListItemButton onClick={() => handleSearchSelect(r)}>
                          <ListItemText
                            primary={r.name}
                            secondary={
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Chip label={r.type} size="small" sx={{ fontSize: "0.65rem" }} />
                                {r.subtitle && <Chip label={r.subtitle} size="small" variant="outlined" sx={{ fontSize: "0.65rem" }} />}
                              </Box>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Notifications */}
            <IconButton onClick={handleNotifOpen}>
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            <Popover
              open={Boolean(notifAnchor)}
              anchorEl={notifAnchor}
              onClose={() => setNotifAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <Box sx={{ width: 360, maxHeight: 400, overflow: "auto" }}>
                <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
                  {unreadCount > 0 && (
                    <Chip label="Mark all read" size="small" onClick={handleMarkAllRead} clickable />
                  )}
                </Box>
                <Divider />
                <List dense>
                  {notifications.slice(0, 10).map((n) => (
                    <ListItem
                      key={n.id}
                      sx={{ bgcolor: n.is_read ? "transparent" : "#f5f6fa" }}
                    >
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={n.is_read ? 400 : 600}>{n.title}</Typography>}
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {n.message?.substring(0, 80)}
                            {n.message?.length > 80 ? "..." : ""}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                  {notifications.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary={<Typography variant="body2" color="text.secondary" align="center">No notifications</Typography>}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            </Popover>

            {/* User Menu */}
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
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
              <MenuItem disabled>
                <Chip label={user?.role} size="small" />
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); navigate("/settings"); }}>
                <Settings sx={{ mr: 1, fontSize: 18 }} /> Settings
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); navigate("/subscriptions"); }}>
                <CreditCard sx={{ mr: 1, fontSize: 18 }} /> Subscription
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1, fontSize: 18 }} /> Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box
          sx={{ p: 3, flexGrow: 1 }}
          onClick={() => {
            if (searchOpen) setSearchOpen(false);
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
