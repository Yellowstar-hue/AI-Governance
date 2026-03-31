const express = require("express");
const path = require("path");
const { authenticate, tenantIsolation } = require("../middleware/auth");
const { upload, saveAttachment, getAttachments, deleteAttachment } = require("../services/fileUpload");

const router = express.Router();
router.use(authenticate, tenantIsolation);

// Upload file(s)
router.post("/:entityType/:entityId", upload.array("files", 5), async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const attachments = [];

    for (const file of req.files) {
      const attachment = await saveAttachment({
        organizationId: req.orgId,
        entityType,
        entityId: parseInt(entityId),
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storagePath: file.path,
        uploadedBy: req.user.id,
      });
      attachments.push(attachment);
    }

    res.status(201).json({ attachments });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

// Get attachments for entity
router.get("/:entityType/:entityId", async (req, res) => {
  try {
    const attachments = await getAttachments(
      req.orgId,
      req.params.entityType,
      parseInt(req.params.entityId)
    );
    res.json({ attachments });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
});

// Download attachment
router.get("/download/:id", async (req, res) => {
  try {
    const { pool } = require("../config/database");
    const result = await pool.query(
      "SELECT * FROM attachments WHERE id = $1 AND organization_id = $2",
      [req.params.id, req.orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const file = result.rows[0];
    res.download(file.storage_path, file.original_name);
  } catch (err) {
    res.status(500).json({ error: "Download failed" });
  }
});

// Delete attachment
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await deleteAttachment(req.params.id, req.orgId);
    if (!deleted) return res.status(404).json({ error: "Attachment not found" });
    res.json({ message: "Attachment deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
