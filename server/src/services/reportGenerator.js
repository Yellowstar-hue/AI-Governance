const { pool } = require("../config/database");

// PDF-ready report generation (structured data for frontend PDF rendering)
const generateComplianceReport = async (organizationId) => {
  const [orgInfo, frameworks, risks, incidents, vendors, models] = await Promise.all([
    pool.query("SELECT * FROM organizations WHERE id = $1", [organizationId]),
    pool.query(
      `SELECT f.name, f.short_code,
         COUNT(cr.id) as total,
         COUNT(CASE WHEN cr.status = 'compliant' THEN 1 END) as compliant,
         COUNT(CASE WHEN cr.status = 'partially_compliant' THEN 1 END) as partial,
         COUNT(CASE WHEN cr.status = 'non_compliant' THEN 1 END) as non_compliant,
         COUNT(CASE WHEN cr.status = 'not_assessed' THEN 1 END) as not_assessed
       FROM frameworks f
       LEFT JOIN compliance_requirements cr ON cr.framework_id = f.id AND cr.organization_id = $1
       WHERE f.is_active = true GROUP BY f.id, f.name, f.short_code ORDER BY f.name`,
      [organizationId]
    ),
    pool.query(
      `SELECT severity, status, COUNT(*) as count FROM risks
       WHERE organization_id = $1 GROUP BY severity, status`,
      [organizationId]
    ),
    pool.query(
      `SELECT severity, status, cert_in_reportable, COUNT(*) as count FROM incidents
       WHERE organization_id = $1 GROUP BY severity, status, cert_in_reportable`,
      [organizationId]
    ),
    pool.query(
      `SELECT risk_level, dpdp_compliant, data_processing_location, COUNT(*) as count
       FROM vendors WHERE organization_id = $1 GROUP BY risk_level, dpdp_compliant, data_processing_location`,
      [organizationId]
    ),
    pool.query(
      `SELECT risk_level, status, model_type, COUNT(*) as count
       FROM ai_models WHERE organization_id = $1 GROUP BY risk_level, status, model_type`,
      [organizationId]
    ),
  ]);

  const org = orgInfo.rows[0];
  const totalReqs = frameworks.rows.reduce((sum, f) => sum + parseInt(f.total), 0) || 1;
  const compliantReqs = frameworks.rows.reduce((sum, f) => sum + parseInt(f.compliant), 0);
  const overallScore = Math.round((compliantReqs / totalReqs) * 100);

  return {
    reportType: "Comprehensive AI Governance Compliance Report",
    generatedAt: new Date().toISOString(),
    organization: {
      name: org.name,
      industry: org.industry,
      size: org.size,
      gstin: org.gstin,
      cin: org.cin,
    },
    executiveSummary: {
      overallComplianceScore: overallScore,
      totalFrameworks: frameworks.rows.length,
      totalRequirements: totalReqs,
      compliantRequirements: compliantReqs,
      totalModels: models.rows.reduce((s, m) => s + parseInt(m.count), 0),
      totalRisks: risks.rows.reduce((s, r) => s + parseInt(r.count), 0),
      totalIncidents: incidents.rows.reduce((s, i) => s + parseInt(i.count), 0),
      totalVendors: vendors.rows.reduce((s, v) => s + parseInt(v.count), 0),
      certInReportable: incidents.rows
        .filter((i) => i.cert_in_reportable)
        .reduce((s, i) => s + parseInt(i.count), 0),
    },
    frameworkCompliance: frameworks.rows.map((f) => ({
      name: f.name,
      shortCode: f.short_code,
      total: parseInt(f.total),
      compliant: parseInt(f.compliant),
      partial: parseInt(f.partial),
      nonCompliant: parseInt(f.non_compliant),
      notAssessed: parseInt(f.not_assessed),
      score: Math.round(
        ((parseInt(f.compliant) + parseInt(f.partial) * 0.5) /
          (parseInt(f.total) || 1)) *
          100
      ),
    })),
    riskSummary: risks.rows,
    incidentSummary: incidents.rows,
    vendorSummary: vendors.rows,
    modelSummary: models.rows,
    recommendations: generateRecommendations(overallScore, frameworks.rows, risks.rows, incidents.rows),
  };
};

const generateRecommendations = (score, frameworks, risks, incidents) => {
  const recommendations = [];

  if (score < 50) {
    recommendations.push({
      priority: "critical",
      title: "Urgent: Low Overall Compliance Score",
      description: "Your compliance score is below 50%. Prioritize addressing non-compliant requirements, starting with DPDP Act 2023 and CERT-In requirements.",
    });
  }

  const dpdp = frameworks.find((f) => f.short_code === "DPDP-2023");
  if (dpdp && parseInt(dpdp.non_compliant) > 0) {
    recommendations.push({
      priority: "high",
      title: "DPDP Act 2023 Non-Compliance",
      description: `${dpdp.non_compliant} requirements under DPDP Act 2023 are non-compliant. Non-compliance can result in penalties up to ₹250 crore. Prioritize consent management and data principal rights.`,
    });
  }

  const certInIncidents = incidents.filter((i) => i.cert_in_reportable);
  if (certInIncidents.length > 0) {
    recommendations.push({
      priority: "critical",
      title: "CERT-In Reportable Incidents Pending",
      description: "There are CERT-In reportable incidents. Ensure reporting within 6 hours of discovery to avoid penalties.",
    });
  }

  const criticalRisks = risks.filter((r) => r.severity === "critical" && r.status !== "resolved");
  if (criticalRisks.length > 0) {
    recommendations.push({
      priority: "high",
      title: "Unresolved Critical Risks",
      description: `There are ${criticalRisks.reduce((s, r) => s + parseInt(r.count), 0)} unresolved critical risks. Assign owners and create mitigation plans immediately.`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: "info",
      title: "Good Governance Posture",
      description: "Your AI governance posture is healthy. Continue with periodic reviews and stay updated with regulatory changes.",
    });
  }

  return recommendations;
};

const generateDPIAReport = async (organizationId, modelId) => {
  const [model, risks, dpa] = await Promise.all([
    pool.query("SELECT * FROM ai_models WHERE id = $1 AND organization_id = $2", [modelId, organizationId]),
    pool.query("SELECT * FROM risks WHERE model_id = $1 AND organization_id = $2", [modelId, organizationId]),
    pool.query("SELECT * FROM data_processing_activities WHERE model_id = $1 AND organization_id = $2", [modelId, organizationId]),
  ]);

  return {
    reportType: "Data Protection Impact Assessment (DPIA)",
    generatedAt: new Date().toISOString(),
    model: model.rows[0],
    dataProcessingActivities: dpa.rows,
    identifiedRisks: risks.rows,
    assessment: {
      dataMinimization: "Assess whether only necessary personal data is collected",
      purposeLimitation: "Verify data is used only for stated purposes",
      storagePolicy: "Review data retention and deletion practices",
      crossBorderTransfer: dpa.rows.some((d) => d.cross_border_transfer),
      childrenData: "Verify if children's data is processed and parental consent obtained",
      automatedDecisions: "Assess impact of automated decision-making on data principals",
    },
  };
};

module.exports = { generateComplianceReport, generateDPIAReport };
