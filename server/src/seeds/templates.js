const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        database: process.env.DB_NAME || "aisafe",
        user: process.env.DB_USER || "aisafe_user",
        password: process.env.DB_PASSWORD || "password",
      }
);

const policyTemplates = [
  {
    title: "AI Usage Policy",
    category: "ai_usage",
    applicable_frameworks: '["DPDP-2023","NITI-RAI","MEITY-AI"]',
    content: `# AI Usage Policy

## Organization: {ORGANIZATION_NAME}
## Effective Date: {DATE}
## Version: 1.0

### 1. Purpose
This policy establishes guidelines for the responsible use of Artificial Intelligence (AI) and Machine Learning (ML) systems within {ORGANIZATION_NAME}. It ensures compliance with Indian regulations including the Digital Personal Data Protection Act (DPDP) 2023, NITI Aayog Responsible AI Principles, and MeitY Advisory Guidelines.

### 2. Scope
This policy applies to all employees, contractors, and third-party vendors who develop, deploy, or use AI/ML systems on behalf of {ORGANIZATION_NAME}.

### 3. AI System Classification
All AI systems must be classified into the following risk categories before deployment:
- **Minimal Risk**: AI systems with negligible impact on individuals
- **Limited Risk**: AI systems requiring transparency obligations
- **High Risk**: AI systems affecting fundamental rights, health, safety, or financial decisions
- **Unacceptable Risk**: AI systems that manipulate human behavior or exploit vulnerabilities (prohibited)

### 4. Approval Process
- Minimal Risk: Department head approval
- Limited Risk: AI Governance Committee review
- High Risk: Board-level approval with mandatory DPIA
- All AI systems must be registered in the AI Model Registry

### 5. Data Protection Requirements (DPDP Act 2023)
- Obtain informed consent before processing personal data through AI systems
- Provide clear notice about AI-driven decision-making
- Enable Data Principal rights (access, correction, erasure)
- Implement data minimization and purpose limitation
- Conduct DPIA for high-risk AI processing

### 6. Transparency and Explainability
- Users must be informed when interacting with AI systems (per MeitY Guidelines)
- AI-generated content must be clearly labeled
- Provide meaningful explanations for automated decisions affecting individuals
- Maintain documentation of AI model behavior and limitations

### 7. Fairness and Non-Discrimination
- AI systems must not discriminate based on caste, religion, gender, language, region, or other protected characteristics
- Conduct regular bias audits using representative Indian demographic data
- Implement fairness metrics and monitoring

### 8. Incident Reporting
- Report AI-related incidents within 2 hours to the AI Governance team
- CERT-In reportable cyber incidents must be reported within 6 hours
- Maintain incident logs and root cause analysis documentation

### 9. Vendor Management
- Third-party AI vendors must demonstrate DPDP Act compliance
- Verify data processing location (India/international)
- Conduct periodic vendor risk assessments

### 10. Monitoring and Review
This policy shall be reviewed annually or upon significant regulatory changes.

### Approved By:
- Name: ____________________
- Designation: ____________________
- Date: ____________________`,
  },
  {
    title: "Data Protection Policy for AI Systems",
    category: "data_protection",
    applicable_frameworks: '["DPDP-2023","CERT-IN"]',
    content: `# Data Protection Policy for AI Systems

## Organization: {ORGANIZATION_NAME}
## Effective Date: {DATE}

### 1. Purpose
This policy defines data protection requirements for AI/ML systems in compliance with the Digital Personal Data Protection Act (DPDP) 2023.

### 2. Consent Management
- All AI systems processing personal data must obtain consent as per Section 6 of DPDP Act
- Consent must be free, specific, informed, unconditional, and unambiguous
- Consent records must be maintained with timestamp and version of notice shown
- Provide mechanism for consent withdrawal at any time

### 3. Notice Requirements
Before collecting data for AI processing, provide notice containing:
- Identity and contact details of the Data Fiduciary
- Description of personal data being collected
- Purpose of processing through AI systems
- Rights available to Data Principals
- Grievance redressal mechanism

### 4. Data Principal Rights
Enable the following rights for individuals whose data is used in AI systems:
- Right to access information about data processing
- Right to correction and erasure of personal data
- Right to grievance redressal
- Right to nominate another person

### 5. Data Minimization
- Collect only data necessary for the stated AI processing purpose
- Regularly review and delete unnecessary personal data
- Anonymize data where possible for model training

### 6. Cross-Border Data Transfer
- Verify government-notified restrictions before transferring data outside India
- Maintain records of all cross-border transfers
- Ensure adequate protection in recipient jurisdiction

### 7. Children's Data
- Do not process data of children (under 18) through AI systems without verifiable parental consent
- Prohibit tracking, behavioral monitoring, and targeted advertising at children
- Implement age verification mechanisms

### 8. Data Breach Response
- Notify Data Protection Board of India upon discovering a personal data breach
- Notify affected Data Principals with nature of breach and remedial actions
- Maintain breach register with details and response actions

### 9. Retention and Erasure
- Define retention periods for each category of personal data used in AI
- Automatically delete personal data when purpose is fulfilled
- Ensure complete erasure from AI training datasets upon withdrawal of consent (where technically feasible)

### 10. Significant Data Fiduciary Obligations
If {ORGANIZATION_NAME} is classified as a Significant Data Fiduciary:
- Appoint a Data Protection Officer (DPO) based in India
- Conduct periodic Data Protection Impact Assessments (DPIA)
- Engage independent auditor for compliance audit
- Publish annual transparency report`,
  },
  {
    title: "AI Model Governance Policy",
    category: "model_governance",
    applicable_frameworks: '["BIS-AI","NITI-RAI"]',
    content: `# AI Model Governance Policy

## Organization: {ORGANIZATION_NAME}
## Effective Date: {DATE}

### 1. Model Development Standards
- All AI models must follow documented development lifecycle
- Maintain version control for model code, data, and configurations
- Document model architecture, training methodology, and performance metrics

### 2. Model Risk Classification
Classify all models per Indian risk framework:
- Minimal: Basic automation, no personal data processing
- Limited: Content generation, recommendation systems
- High: Healthcare, financial, legal, employment decisions
- Unacceptable: Social scoring, manipulation (prohibited)

### 3. Testing and Validation
- Conduct bias testing with Indian demographic data before deployment
- Validate model performance across diverse user populations
- Stress test for adversarial inputs and edge cases
- Independent validation for high-risk models

### 4. Deployment Approval
- Document deployment checklist completion
- Security review and penetration testing
- Privacy impact assessment for personal data processing
- Approval from AI Governance Committee for high-risk models

### 5. Monitoring and Drift Detection
- Implement continuous monitoring for model performance
- Set up alerts for data drift and concept drift
- Monitor for discriminatory outcomes
- Track resource usage and environmental impact

### 6. Model Retirement
- Define criteria for model retirement
- Ensure data retention/deletion per DPDP requirements
- Document lessons learned
- Archive model artifacts for audit purposes`,
  },
  {
    title: "AI Incident Response Plan",
    category: "incident_response",
    applicable_frameworks: '["CERT-IN","DPDP-2023"]',
    content: `# AI Incident Response Plan

## Organization: {ORGANIZATION_NAME}
## Effective Date: {DATE}

### 1. Incident Categories
- **Data Breach**: Unauthorized access to personal data used in AI systems
- **Model Failure**: AI system producing incorrect/harmful outputs
- **Bias Incident**: Discriminatory outcomes detected
- **Security Breach**: Adversarial attack on AI infrastructure
- **Privacy Violation**: Non-compliant data processing
- **Safety Issue**: AI output causing physical or financial harm

### 2. Severity Levels
- **Critical**: Immediate threat to safety, large-scale data breach, regulatory violation
- **High**: Significant impact, CERT-In reportable, affects many users
- **Medium**: Moderate impact, contained to specific systems
- **Low**: Minor issues, no significant user impact

### 3. Response Timeline (CERT-In Compliance)
- **T+0**: Incident detected and initial assessment
- **T+1 hour**: Internal escalation and containment initiated
- **T+2 hours**: AI Governance team notified, investigation started
- **T+6 hours**: CERT-In notification (if cyber security incident)
- **T+24 hours**: Affected Data Principals notified (if data breach)
- **T+72 hours**: Detailed incident report completed
- **T+30 days**: Root cause analysis and corrective actions documented

### 4. Communication Protocol
- Internal: Incident Slack channel, escalation to CTO/DPO
- Regulatory: CERT-In portal, Data Protection Board of India
- Public: Press release if significant public impact (approved by legal)
- Affected users: Direct notification per DPDP Act requirements

### 5. Post-Incident Review
- Conduct blameless post-mortem within 5 business days
- Document root cause, impact, and corrective actions
- Update risk register and compliance records
- Implement preventive measures and update this plan`,
  },
  {
    title: "Third-Party AI Vendor Assessment Policy",
    category: "vendor_management",
    applicable_frameworks: '["DPDP-2023","BIS-AI"]',
    content: `# Third-Party AI Vendor Assessment Policy

## Organization: {ORGANIZATION_NAME}
## Effective Date: {DATE}

### 1. Vendor Onboarding Requirements
Before engaging any AI vendor:
- Complete vendor risk assessment questionnaire
- Verify DPDP Act compliance and data processing practices
- Review data processing location (India vs. international)
- Assess security certifications (ISO 27001, SOC 2)
- Review AI model documentation and bias testing results

### 2. Data Processing Agreement (DPA)
All AI vendors processing personal data must sign a DPA containing:
- Purpose and scope of processing
- Data categories and subjects
- Security measures
- Sub-processor requirements
- Data breach notification obligations (within 6 hours)
- Data return/deletion upon termination
- Audit rights for {ORGANIZATION_NAME}

### 3. Risk Classification
- **Critical**: Vendor processes large volumes of sensitive personal data
- **High**: Vendor has access to personal data, international data transfer
- **Medium**: Limited personal data access, India-based processing
- **Low**: No personal data access, supporting infrastructure only

### 4. Periodic Assessment
- Critical vendors: Quarterly assessment
- High risk: Semi-annual assessment
- Medium risk: Annual assessment
- Low risk: Biennial assessment

### 5. DPDP Compliance Checklist for Vendors
- [ ] Valid consent mechanism for data processing
- [ ] Data minimization practices
- [ ] Cross-border transfer compliance
- [ ] Breach notification capability
- [ ] Data Principal rights support
- [ ] Data retention and deletion procedures
- [ ] Security measures documentation`,
  },
  {
    title: "AI Ethics and Transparency Policy",
    category: "ethics",
    applicable_frameworks: '["NITI-RAI","MEITY-AI","INDIAAI"]',
    content: `# AI Ethics and Transparency Policy

## Organization: {ORGANIZATION_NAME}
## Effective Date: {DATE}

### 1. Ethical Principles
{ORGANIZATION_NAME} commits to the following ethical AI principles aligned with NITI Aayog's Responsible AI framework:

**Safety and Reliability**: All AI systems must be safe, secure, and perform reliably.

**Equality and Inclusivity**: AI systems must serve India's diverse population without discrimination based on caste, religion, gender, language, disability, or economic status.

**Transparency**: AI decision-making processes must be transparent and understandable.

**Privacy**: AI systems must respect and protect personal data as per DPDP Act 2023.

**Accountability**: Clear ownership and responsibility for AI system outcomes.

**Human Values**: AI must reinforce positive human values and not undermine democratic processes.

### 2. AI Content Labeling (MeitY Compliance)
- All AI-generated content must be clearly labeled
- Disclose when users are interacting with AI systems
- Prevent use of AI for generating misinformation
- Implement content moderation for generative AI outputs

### 3. Fairness Assessment
- Test AI systems against Indian census demographic data
- Ensure equal performance across all official Indian languages supported
- Monitor for proxy discrimination through indirect features
- Report fairness metrics in AI Trust Center

### 4. Grievance Redressal
- Appoint a Grievance Officer (per MeitY Advisory)
- Provide accessible grievance mechanism for AI-related complaints
- Resolve complaints within 15 days
- Publish grievance statistics quarterly

### 5. AI Literacy
- Conduct quarterly AI awareness training for all employees
- Maintain an AI literacy register
- Educate users on their rights regarding AI-driven decisions`,
  },
];

const assessmentTemplates = [
  {
    name: "AI Model Risk Assessment",
    description: "Comprehensive risk assessment for AI/ML models per Indian regulatory requirements",
    type: "model_assessment",
    scoring_method: "weighted",
    applicable_frameworks: '["NITI-RAI","BIS-AI","DPDP-2023"]',
    questions: JSON.stringify([
      { id: "q1", text: "What is the primary purpose of this AI model?", type: "text", maxScore: 0, category: "overview" },
      { id: "q2", text: "What type of data does the model process?", type: "multi_select", options: ["Personal data", "Sensitive personal data", "Children's data", "Financial data", "Health data", "Anonymized data", "Public data"], maxScore: 0, category: "data" },
      { id: "q3", text: "Does the model make automated decisions that significantly affect individuals?", type: "yes_no", maxScore: 10, category: "risk" },
      { id: "q4", text: "Has the model been tested for bias across Indian demographic groups?", type: "yes_no", maxScore: 15, category: "fairness" },
      { id: "q5", text: "Can the model's decisions be explained to affected individuals?", type: "scale_1_5", maxScore: 10, category: "transparency" },
      { id: "q6", text: "Is there human oversight for high-impact decisions?", type: "yes_no", maxScore: 15, category: "safety" },
      { id: "q7", text: "Are model inputs and outputs logged for audit purposes?", type: "yes_no", maxScore: 10, category: "accountability" },
      { id: "q8", text: "Is there a documented process for handling model failures?", type: "yes_no", maxScore: 10, category: "safety" },
      { id: "q9", text: "Has a Data Protection Impact Assessment been conducted?", type: "yes_no", maxScore: 15, category: "privacy" },
      { id: "q10", text: "Is there continuous monitoring for model drift and performance degradation?", type: "yes_no", maxScore: 10, category: "monitoring" },
      { id: "q11", text: "Rate the security measures protecting the model and its data", type: "scale_1_5", maxScore: 5, category: "security" },
    ]),
  },
  {
    name: "DPDP Act Readiness Assessment",
    description: "Assess organizational readiness for DPDP Act 2023 compliance in AI systems",
    type: "compliance_assessment",
    scoring_method: "weighted",
    applicable_frameworks: '["DPDP-2023"]',
    questions: JSON.stringify([
      { id: "d1", text: "Is there a documented consent management process for AI data processing?", type: "yes_no", maxScore: 15, category: "consent" },
      { id: "d2", text: "Are Data Principal rights (access, correction, erasure) implemented?", type: "scale_1_5", maxScore: 15, category: "rights" },
      { id: "d3", text: "Is a privacy notice provided before AI data collection?", type: "yes_no", maxScore: 10, category: "notice" },
      { id: "d4", text: "Is there a Data Protection Officer appointed (if Significant Data Fiduciary)?", type: "yes_no", maxScore: 10, category: "governance" },
      { id: "d5", text: "Are data breach notification procedures in place?", type: "yes_no", maxScore: 15, category: "breach" },
      { id: "d6", text: "Are cross-border data transfers documented and compliant?", type: "yes_no", maxScore: 10, category: "transfer" },
      { id: "d7", text: "Are children's data processing controls implemented?", type: "yes_no", maxScore: 10, category: "children" },
      { id: "d8", text: "Is there a data retention and erasure policy for AI datasets?", type: "yes_no", maxScore: 10, category: "retention" },
      { id: "d9", text: "Has a DPIA been conducted for high-risk AI processing?", type: "yes_no", maxScore: 5, category: "dpia" },
    ]),
  },
  {
    name: "Vendor AI Due Diligence",
    description: "Assess third-party AI vendor compliance with Indian regulations",
    type: "vendor_assessment",
    scoring_method: "weighted",
    applicable_frameworks: '["DPDP-2023","BIS-AI"]',
    questions: JSON.stringify([
      { id: "v1", text: "Where does the vendor process data?", type: "select", options: ["India only", "India + International", "International only"], maxScore: 10, category: "data_location" },
      { id: "v2", text: "Does the vendor have DPDP Act compliance documentation?", type: "yes_no", maxScore: 15, category: "compliance" },
      { id: "v3", text: "Does the vendor have ISO 27001 or equivalent certification?", type: "yes_no", maxScore: 10, category: "security" },
      { id: "v4", text: "Can the vendor provide bias testing reports for their AI models?", type: "yes_no", maxScore: 10, category: "fairness" },
      { id: "v5", text: "Does the vendor have a data breach notification process within 6 hours?", type: "yes_no", maxScore: 15, category: "breach" },
      { id: "v6", text: "Does the vendor support data deletion/return upon contract termination?", type: "yes_no", maxScore: 10, category: "data_lifecycle" },
      { id: "v7", text: "Does the vendor allow audit access?", type: "yes_no", maxScore: 10, category: "audit" },
      { id: "v8", text: "Rate the vendor's overall AI governance maturity", type: "scale_1_5", maxScore: 10, category: "maturity" },
      { id: "v9", text: "Does the vendor sub-contract AI processing to other parties?", type: "yes_no", maxScore: 10, category: "subprocessor" },
    ]),
  },
];

const seed = async () => {
  const client = await pool.connect();
  try {
    // Seed policy templates
    const existingPolicies = await client.query("SELECT COUNT(*) FROM policy_templates");
    if (parseInt(existingPolicies.rows[0].count) === 0) {
      for (const t of policyTemplates) {
        await client.query(
          `INSERT INTO policy_templates (title, content, category, applicable_frameworks)
           VALUES ($1, $2, $3, $4)`,
          [t.title, t.content, t.category, t.applicable_frameworks]
        );
        console.log(`Seeded policy template: ${t.title}`);
      }
    } else {
      console.log("Policy templates already seeded.");
    }

    // Seed assessment templates
    const existingAssessments = await client.query("SELECT COUNT(*) FROM assessment_templates");
    if (parseInt(existingAssessments.rows[0].count) === 0) {
      for (const t of assessmentTemplates) {
        await client.query(
          `INSERT INTO assessment_templates (name, description, type, questions, scoring_method, applicable_frameworks)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [t.name, t.description, t.type, t.questions, t.scoring_method, t.applicable_frameworks]
        );
        console.log(`Seeded assessment template: ${t.name}`);
      }
    } else {
      console.log("Assessment templates already seeded.");
    }

    console.log("Template seeding complete.");
  } catch (err) {
    console.error("Template seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
