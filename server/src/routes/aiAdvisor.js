const express = require("express");
const { body } = require("express-validator");
const { authenticate, tenantIsolation } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { processAdvisorQuery, getChatHistory } = require("../services/aiAdvisor");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// Start new chat session
router.post("/sessions", async (req, res) => {
  const sessionId = uuidv4();
  res.json({ sessionId });
});

// Send message
router.post(
  "/chat",
  [body("message").trim().notEmpty(), body("sessionId").trim().notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      const response = await processAdvisorQuery(
        message,
        sessionId,
        req.user.id,
        req.orgId
      );
      res.json({ response, sessionId });
    } catch (err) {
      console.error("AI Advisor error:", err);
      res.status(500).json({ error: "AI Advisor failed to respond" });
    }
  }
);

// Get chat history
router.get("/sessions/:sessionId", async (req, res) => {
  try {
    const history = await getChatHistory(req.params.sessionId);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

module.exports = router;
