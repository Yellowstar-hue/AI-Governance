const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { pool } = require("../config/database");

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// Ensure upload directory exists
const ensureUploadDir = (subDir) => {
  const dir = path.join(UPLOAD_DIR, subDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const orgDir = `org_${req.orgId}`;
    const dir = ensureUploadDir(orgDir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/png",
    "image/jpeg",
    "image/gif",
    "text/plain",
    "text/csv",
    "application/json",
    "application/zip",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB default
    files: 5,
  },
});

// Save attachment record
const saveAttachment = async ({
  organizationId,
  entityType,
  entityId,
  filename,
  originalName,
  mimeType,
  sizeBytes,
  storagePath,
  uploadedBy,
}) => {
  const result = await pool.query(
    `INSERT INTO attachments (organization_id, entity_type, entity_id, filename,
     original_name, mime_type, size_bytes, storage_path, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [organizationId, entityType, entityId, filename, originalName,
     mimeType, sizeBytes, storagePath, uploadedBy]
  );
  return result.rows[0];
};

// Get attachments for entity
const getAttachments = async (organizationId, entityType, entityId) => {
  const result = await pool.query(
    `SELECT a.*, u.name as uploaded_by_name FROM attachments a
     LEFT JOIN users u ON a.uploaded_by = u.id
     WHERE a.organization_id = $1 AND a.entity_type = $2 AND a.entity_id = $3
     ORDER BY a.created_at DESC`,
    [organizationId, entityType, entityId]
  );
  return result.rows;
};

// Delete attachment
const deleteAttachment = async (attachmentId, organizationId) => {
  const result = await pool.query(
    "DELETE FROM attachments WHERE id = $1 AND organization_id = $2 RETURNING *",
    [attachmentId, organizationId]
  );

  if (result.rows.length > 0) {
    const filePath = result.rows[0].storage_path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  return result.rows[0];
};

module.exports = { upload, saveAttachment, getAttachments, deleteAttachment };
