import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Card, CardContent, TextField, IconButton,
  Paper, Avatar, Chip, CircularProgress,
} from "@mui/material";
import { Send, SmartToy, Person } from "@mui/icons-material";
import { aiAdvisorAPI } from "../services/api";

const AIAdvisor = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    aiAdvisorAPI.newSession().then((res) => {
      setSessionId(res.data.sessionId);
      setMessages([
        {
          role: "assistant",
          content:
            "Namaste! I'm your AI Governance Advisor. I can help you navigate Indian AI regulations including DPDP Act 2023, NITI Aayog principles, MeitY guidelines, CERT-In requirements, and more. What would you like to know?",
        },
      ]);
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await aiAdvisorAPI.chat({
        message: userMessage,
        sessionId,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickTopics = [
    "DPDP Act consent requirements",
    "CERT-In 6-hour reporting",
    "AI risk classification in India",
    "How to get started with compliance",
    "RBI AI/ML guidelines for lending",
    "MeitY AI content labeling rules",
  ];

  return (
    <Box sx={{ height: "calc(100vh - 130px)", display: "flex", flexDirection: "column" }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4">AI Governance Advisor</Typography>
        <Typography variant="body2" color="text.secondary">
          Ask questions about Indian AI regulations and compliance
        </Typography>
      </Box>

      {/* Quick Topics */}
      {messages.length <= 1 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {quickTopics.map((topic) => (
            <Chip
              key={topic}
              label={topic}
              onClick={() => {
                setInput(topic);
              }}
              variant="outlined"
              color="primary"
              sx={{ cursor: "pointer" }}
            />
          ))}
        </Box>
      )}

      {/* Chat Messages */}
      <Card sx={{ flexGrow: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ flexGrow: 1, overflow: "auto", p: 3 }}>
          {messages.map((msg, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                gap: 2,
                mb: 3,
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
              }}
            >
              <Avatar
                sx={{
                  bgcolor: msg.role === "user" ? "primary.main" : "#FF9933",
                  width: 36,
                  height: 36,
                }}
              >
                {msg.role === "user" ? <Person /> : <SmartToy />}
              </Avatar>
              <Paper
                sx={{
                  p: 2,
                  maxWidth: "75%",
                  bgcolor: msg.role === "user" ? "primary.main" : "#f5f5f5",
                  color: msg.role === "user" ? "#fff" : "text.primary",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "pre-line", lineHeight: 1.7 }}
                >
                  {msg.content}
                </Typography>
              </Paper>
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: "#FF9933", width: 36, height: 36 }}>
                <SmartToy />
              </Avatar>
              <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                <CircularProgress size={20} />
              </Paper>
            </Box>
          )}
          <div ref={chatEndRef} />
        </CardContent>

        {/* Input */}
        <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0", display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Ask about Indian AI regulations..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            size="small"
            multiline
            maxRows={3}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            <Send />
          </IconButton>
        </Box>
      </Card>
    </Box>
  );
};

export default AIAdvisor;
