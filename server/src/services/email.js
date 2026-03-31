const { pool } = require("../config/database");

// Email templates for Indian AI governance context
const EMAIL_TEMPLATES = {
  welcome: {
    subject: "Welcome to AISafe - AI Governance Platform",
    render: (data) => `
      <h2>Welcome to AISafe, ${data.name}!</h2>
      <p>Your organization <strong>${data.organizationName}</strong> is now registered on AISafe.</p>
      <p>AISafe helps you comply with Indian AI regulations including:</p>
      <ul>
        <li>Digital Personal Data Protection Act (DPDP) 2023</li>
        <li>NITI Aayog Responsible AI Principles</li>
        <li>MeitY AI Advisory Guidelines</li>
        <li>CERT-In Incident Reporting Requirements</li>
        <li>And 6+ more Indian regulatory frameworks</li>
      </ul>
      <p><a href="${data.loginUrl}">Get started with your dashboard</a></p>
    `,
  },
  invite: {
    subject: "You're invited to join {orgName} on AISafe",
    render: (data) => `
      <h2>You've been invited!</h2>
      <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.orgName}</strong> on AISafe as a <strong>${data.role}</strong>.</p>
      <p><a href="${data.acceptUrl}">Accept Invitation</a></p>
      <p>Your temporary password: <code>${data.tempPassword}</code></p>
      <p>Please change your password after first login.</p>
    `,
  },
  incident_alert: {
    subject: "[ALERT] AI Incident Reported - {severity}",
    render: (data) => `
      <h2 style="color: #c62828;">AI Incident Alert</h2>
      <p><strong>Incident:</strong> ${data.title}</p>
      <p><strong>Severity:</strong> ${data.severity}</p>
      <p><strong>Category:</strong> ${data.category}</p>
      <p><strong>Reported by:</strong> ${data.reporterName}</p>
      ${data.certInReportable ? '<p style="color: #c62828; font-weight: bold;">⚠ This incident is flagged as CERT-In reportable. You have 6 hours to report to CERT-In.</p>' : ""}
      <p>${data.description}</p>
      <p><a href="${data.incidentUrl}">View Incident Details</a></p>
    `,
  },
  compliance_reminder: {
    subject: "Compliance Assessment Due - {frameworkName}",
    render: (data) => `
      <h2>Compliance Reminder</h2>
      <p>Your compliance assessment for <strong>${data.frameworkName}</strong> is due for review.</p>
      <p><strong>Current Score:</strong> ${data.score}%</p>
      <p><strong>Non-compliant Items:</strong> ${data.nonCompliant}</p>
      <p><a href="${data.complianceUrl}">Review Compliance Status</a></p>
    `,
  },
  cert_in_deadline: {
    subject: "[URGENT] CERT-In Reporting Deadline Approaching",
    render: (data) => `
      <h2 style="color: #c62828;">CERT-In Reporting Deadline</h2>
      <p>The following incident must be reported to CERT-In within 6 hours:</p>
      <p><strong>Incident:</strong> ${data.title}</p>
      <p><strong>Reported at:</strong> ${data.reportedAt}</p>
      <p><strong>Deadline:</strong> ${data.deadline}</p>
      <p><a href="${data.incidentUrl}">Report Now</a></p>
    `,
  },
  vendor_assessment_due: {
    subject: "Vendor Assessment Due - {vendorName}",
    render: (data) => `
      <h2>Vendor Assessment Reminder</h2>
      <p>The periodic assessment for vendor <strong>${data.vendorName}</strong> is due.</p>
      <p><strong>Risk Level:</strong> ${data.riskLevel}</p>
      <p><strong>Last Assessment:</strong> ${data.lastAssessment || "Never"}</p>
      <p><a href="${data.vendorUrl}">Start Assessment</a></p>
    `,
  },
  report_generated: {
    subject: "Your {reportType} Report is Ready",
    render: (data) => `
      <h2>Report Generated</h2>
      <p>Your <strong>${data.reportType}</strong> report has been generated.</p>
      <p><strong>Generated at:</strong> ${data.generatedAt}</p>
      <p><a href="${data.downloadUrl}">Download Report</a></p>
    `,
  },
  payment_receipt: {
    subject: "Payment Receipt - AISafe Subscription",
    render: (data) => `
      <h2>Payment Confirmation</h2>
      <p>Thank you for your payment.</p>
      <p><strong>Plan:</strong> ${data.planName}</p>
      <p><strong>Amount:</strong> ₹${data.amount} (incl. 18% GST: ₹${data.gstAmount})</p>
      <p><strong>Invoice:</strong> ${data.invoiceNumber}</p>
      <p><strong>GSTIN:</strong> ${data.gstin || "N/A"}</p>
      <p><a href="${data.receiptUrl}">View Receipt</a></p>
    `,
  },
};

// Queue email for sending
const queueEmail = async (toEmail, toName, templateName, templateData) => {
  try {
    const template = EMAIL_TEMPLATES[templateName];
    if (!template) throw new Error(`Unknown template: ${templateName}`);

    let subject = template.subject;
    for (const [key, value] of Object.entries(templateData)) {
      subject = subject.replace(`{${key}}`, value);
    }

    await pool.query(
      `INSERT INTO email_queue (to_email, to_name, subject, template, template_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [toEmail, toName, subject, templateName, JSON.stringify(templateData)]
    );
  } catch (err) {
    console.error("Email queue error:", err);
  }
};

// Process email queue (called by worker/cron)
const processEmailQueue = async (transporter) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM email_queue WHERE status = 'pending' AND attempts < 3
       ORDER BY created_at ASC LIMIT 10`
    );

    for (const email of result.rows) {
      try {
        const template = EMAIL_TEMPLATES[email.template];
        const html = template.render(email.template_data);

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || "noreply@aisafe.in",
          to: email.to_email,
          subject: email.subject,
          html,
        });

        await client.query(
          "UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = $1",
          [email.id]
        );
      } catch (err) {
        await client.query(
          "UPDATE email_queue SET attempts = attempts + 1, last_error = $1 WHERE id = $2",
          [err.message, email.id]
        );
      }
    }
  } finally {
    client.release();
  }
};

module.exports = { queueEmail, processEmailQueue, EMAIL_TEMPLATES };
