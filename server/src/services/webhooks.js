const crypto = require("crypto");
const { pool } = require("../config/database");

const triggerWebhooks = async (organizationId, event, payload) => {
  try {
    const result = await pool.query(
      `SELECT * FROM webhooks
       WHERE organization_id = $1 AND is_active = true
       AND events @> $2`,
      [organizationId, JSON.stringify([event])]
    );

    for (const webhook of result.rows) {
      deliverWebhook(webhook, event, payload);
    }
  } catch (err) {
    console.error("Webhook trigger error:", err);
  }
};

const deliverWebhook = async (webhook, event, payload) => {
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  const signature = webhook.secret
    ? crypto.createHmac("sha256", webhook.secret).update(body).digest("hex")
    : null;

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AISafe-Event": event,
        ...(signature && { "X-AISafe-Signature": `sha256=${signature}` }),
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    await pool.query(
      `INSERT INTO webhook_deliveries (webhook_id, event, payload, response_status)
       VALUES ($1, $2, $3, $4)`,
      [webhook.id, event, payload, response.status]
    );

    if (response.ok) {
      await pool.query(
        "UPDATE webhooks SET last_triggered = NOW(), failure_count = 0 WHERE id = $1",
        [webhook.id]
      );
    } else {
      await pool.query(
        "UPDATE webhooks SET failure_count = failure_count + 1 WHERE id = $1",
        [webhook.id]
      );
    }
  } catch (err) {
    await pool.query(
      `INSERT INTO webhook_deliveries (webhook_id, event, payload, response_status, response_body)
       VALUES ($1, $2, $3, 0, $4)`,
      [webhook.id, event, payload, err.message]
    );

    await pool.query(
      "UPDATE webhooks SET failure_count = failure_count + 1 WHERE id = $1",
      [webhook.id]
    );

    // Disable after 10 consecutive failures
    if (webhook.failure_count >= 9) {
      await pool.query(
        "UPDATE webhooks SET is_active = false WHERE id = $1",
        [webhook.id]
      );
    }
  }
};

module.exports = { triggerWebhooks };
