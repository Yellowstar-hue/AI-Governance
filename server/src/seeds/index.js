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

const frameworks = [
  {
    name: "Digital Personal Data Protection Act (DPDP) 2023",
    short_code: "DPDP-2023",
    description: "India's comprehensive data protection law governing the processing of digital personal data. Establishes rights of data principals, obligations of data fiduciaries, and the Data Protection Board of India.",
    category: "Data Protection",
    issuing_body: "Ministry of Electronics and Information Technology (MeitY)",
    effective_date: "2023-08-11",
    version: "1.0",
    requirements: [
      { section: "1.1", title: "Lawful Purpose for Data Processing", description: "Ensure all personal data processing has a lawful purpose and is done in accordance with the provisions of this Act." },
      { section: "1.2", title: "Consent Management", description: "Obtain free, specific, informed, unconditional and unambiguous consent from the Data Principal before processing personal data." },
      { section: "1.3", title: "Notice Requirements", description: "Provide notice to Data Principals with description of personal data, purpose of processing, and grievance redressal mechanisms." },
      { section: "1.4", title: "Data Principal Rights", description: "Enable Data Principals to exercise their rights including access, correction, erasure, and grievance redressal." },
      { section: "1.5", title: "Obligations of Data Fiduciary", description: "Implement appropriate technical and organizational measures to ensure compliance, data accuracy, and completeness." },
      { section: "1.6", title: "Significant Data Fiduciary Obligations", description: "If classified as Significant Data Fiduciary, appoint DPO, conduct DPIA, and ensure independent audit." },
      { section: "1.7", title: "Data Breach Notification", description: "Notify the Data Protection Board and affected Data Principals of any personal data breach." },
      { section: "1.8", title: "Cross-border Data Transfer", description: "Ensure personal data transfer outside India complies with government-notified restrictions." },
      { section: "1.9", title: "Children's Data Protection", description: "Obtain verifiable parental consent before processing children's data. Do not track, behaviorally monitor, or target advertisements at children." },
      { section: "1.10", title: "Data Retention and Erasure", description: "Erase personal data when consent is withdrawn or purpose is fulfilled, unless retention is required by law." },
    ],
  },
  {
    name: "NITI Aayog Responsible AI Principles",
    short_code: "NITI-RAI",
    description: "India's national AI strategy principles for responsible AI development and deployment, established by NITI Aayog.",
    category: "AI Ethics",
    issuing_body: "NITI Aayog",
    effective_date: "2021-02-01",
    version: "2.0",
    requirements: [
      { section: "2.1", title: "Safety and Reliability", description: "AI systems must be safe, reliable, and perform consistently under expected conditions." },
      { section: "2.2", title: "Equality and Inclusivity", description: "AI systems must not discriminate and should be inclusive across diverse populations of India." },
      { section: "2.3", title: "Transparency and Explainability", description: "AI systems should be transparent in their functioning and provide explainable outputs." },
      { section: "2.4", title: "Privacy and Security", description: "AI systems must protect user privacy and maintain robust security measures." },
      { section: "2.5", title: "Accountability", description: "Clear accountability mechanisms for AI system outcomes with defined responsibility chains." },
      { section: "2.6", title: "Protection of Positive Human Values", description: "AI systems must reinforce positive human values and not undermine democratic processes." },
      { section: "2.7", title: "Non-maleficence", description: "AI systems must not cause harm to individuals, communities, or the environment." },
    ],
  },
  {
    name: "MeitY AI Advisory Guidelines 2024",
    short_code: "MEITY-AI",
    description: "Advisory from MeitY on governance of AI platforms, intermediaries, and AI-generated content in India.",
    category: "AI Regulation",
    issuing_body: "Ministry of Electronics and Information Technology (MeitY)",
    effective_date: "2024-03-01",
    version: "1.0",
    requirements: [
      { section: "3.1", title: "Platform Labeling", description: "AI platforms must clearly label AI-generated content to prevent misinformation." },
      { section: "3.2", title: "Bias Testing Before Deployment", description: "AI models must undergo thorough bias testing before deployment in the Indian market." },
      { section: "3.3", title: "Government Approval for Untested AI", description: "AI platforms deploying under-tested or unreliable AI must seek explicit government permission." },
      { section: "3.4", title: "Content Moderation", description: "AI systems generating content must have robust content moderation to prevent unlawful outputs." },
      { section: "3.5", title: "User Consent for AI Interaction", description: "Users must be informed when they are interacting with AI systems." },
      { section: "3.6", title: "Grievance Officer Appointment", description: "AI platform operators must appoint a grievance officer for user complaints." },
    ],
  },
  {
    name: "BIS AI Standards (IS/ISO 42001)",
    short_code: "BIS-AI",
    description: "Bureau of Indian Standards adoption of ISO 42001 for AI Management System requirements.",
    category: "Standards",
    issuing_body: "Bureau of Indian Standards (BIS)",
    effective_date: "2024-01-01",
    version: "1.0",
    requirements: [
      { section: "4.1", title: "AI Management System Scope", description: "Define the scope of the AI management system including boundaries and applicability." },
      { section: "4.2", title: "Leadership Commitment", description: "Top management must demonstrate leadership and commitment to the AI management system." },
      { section: "4.3", title: "AI Risk Assessment", description: "Establish and maintain an AI risk assessment process to identify, analyze, and evaluate AI risks." },
      { section: "4.4", title: "AI Impact Assessment", description: "Conduct impact assessments for AI systems considering effects on individuals and society." },
      { section: "4.5", title: "Operational Controls", description: "Implement operational controls for AI system development, deployment, and monitoring." },
      { section: "4.6", title: "Performance Evaluation", description: "Monitor, measure, analyze, and evaluate AI management system performance." },
      { section: "4.7", title: "Continuous Improvement", description: "Continually improve the suitability, adequacy, and effectiveness of the AI management system." },
    ],
  },
  {
    name: "CERT-In AI Incident Reporting",
    short_code: "CERT-IN",
    description: "CERT-In requirements for reporting cybersecurity and AI-related incidents affecting Indian users and infrastructure.",
    category: "Incident Reporting",
    issuing_body: "Indian Computer Emergency Response Team (CERT-In)",
    effective_date: "2022-04-28",
    version: "1.0",
    requirements: [
      { section: "5.1", title: "6-Hour Incident Reporting", description: "Report cybersecurity incidents to CERT-In within 6 hours of noticing the incident." },
      { section: "5.2", title: "Log Retention", description: "Maintain logs of all ICT systems for a rolling period of 180 days within Indian jurisdiction." },
      { section: "5.3", title: "Point of Contact", description: "Designate a point of contact for CERT-In communication available 24x7." },
      { section: "5.4", title: "Incident Classification", description: "Classify and report AI-related incidents including model poisoning, data breaches, and adversarial attacks." },
      { section: "5.5", title: "Synchronized System Clocks", description: "Ensure ICT system clocks are synchronized with NTP servers for accurate incident tracking." },
    ],
  },
  {
    name: "RBI AI/ML Guidelines for Financial Services",
    short_code: "RBI-AIML",
    description: "Reserve Bank of India guidelines for use of AI and ML in financial services including banking, payments, and lending.",
    category: "Financial Services",
    issuing_body: "Reserve Bank of India (RBI)",
    effective_date: "2023-06-01",
    version: "1.0",
    requirements: [
      { section: "6.1", title: "Model Governance Framework", description: "Establish a comprehensive model governance framework for AI/ML models used in financial decisions." },
      { section: "6.2", title: "Fairness in Lending", description: "Ensure AI/ML models used in credit decisions do not discriminate based on caste, religion, gender, or other protected characteristics." },
      { section: "6.3", title: "Model Validation", description: "Independent validation of AI/ML models before deployment and periodic re-validation." },
      { section: "6.4", title: "Customer Explanation", description: "Provide meaningful explanations to customers for AI-driven decisions that affect them." },
      { section: "6.5", title: "Audit Trail", description: "Maintain complete audit trails for AI/ML model decisions in financial services." },
      { section: "6.6", title: "Board Oversight", description: "Board-level oversight and accountability for AI/ML model risks." },
    ],
  },
  {
    name: "SEBI AI Disclosure Framework",
    short_code: "SEBI-AI",
    description: "SEBI requirements for disclosure and governance of AI systems used in securities markets.",
    category: "Securities",
    issuing_body: "Securities and Exchange Board of India (SEBI)",
    effective_date: "2024-01-01",
    version: "1.0",
    requirements: [
      { section: "7.1", title: "Algorithm Disclosure", description: "Disclose use of algorithmic trading and AI-based investment advisory systems." },
      { section: "7.2", title: "Risk Controls", description: "Implement appropriate risk controls for AI-driven trading systems." },
      { section: "7.3", title: "Market Manipulation Prevention", description: "Ensure AI systems do not engage in or facilitate market manipulation." },
      { section: "7.4", title: "Investor Protection", description: "Protect investor interests when using AI for investment recommendations." },
    ],
  },
  {
    name: "IRDAI AI Guidelines for Insurance",
    short_code: "IRDAI-AI",
    description: "IRDAI guidelines governing the use of AI in insurance underwriting, claims, and customer service.",
    category: "Insurance",
    issuing_body: "Insurance Regulatory and Development Authority of India (IRDAI)",
    effective_date: "2024-06-01",
    version: "1.0",
    requirements: [
      { section: "8.1", title: "Underwriting Fairness", description: "AI-based underwriting must be fair, transparent, and non-discriminatory." },
      { section: "8.2", title: "Claims Processing Transparency", description: "Provide clear explanations for AI-driven claims decisions." },
      { section: "8.3", title: "Data Usage Consent", description: "Obtain explicit consent for use of personal data in AI-driven insurance processes." },
      { section: "8.4", title: "Model Documentation", description: "Maintain comprehensive documentation of AI models used in insurance operations." },
    ],
  },
  {
    name: "IndiaAI Mission Compliance",
    short_code: "INDIAAI",
    description: "Compliance requirements under the IndiaAI Mission for organizations receiving government AI funding or partnerships.",
    category: "Government",
    issuing_body: "IndiaAI Mission / MeitY",
    effective_date: "2024-03-07",
    version: "1.0",
    requirements: [
      { section: "9.1", title: "Ethical AI Development", description: "Follow ethical AI development practices as outlined in the IndiaAI Ethics Framework." },
      { section: "9.2", title: "Data Sovereignty", description: "Ensure training data and AI models respect Indian data sovereignty requirements." },
      { section: "9.3", title: "Inclusive AI", description: "Develop AI systems that work across India's diverse languages, cultures, and demographics." },
      { section: "9.4", title: "Compute Reporting", description: "Report compute usage and efficiency metrics for AI systems using government infrastructure." },
      { section: "9.5", title: "Open Source Contribution", description: "Contribute to India's AI ecosystem through open datasets and models where applicable." },
    ],
  },
  {
    name: "IT Act 2000 - AI Relevant Sections",
    short_code: "IT-ACT",
    description: "Sections of the Information Technology Act 2000 relevant to AI systems, automated decision-making, and electronic governance.",
    category: "Legislation",
    issuing_body: "Government of India",
    effective_date: "2000-10-17",
    version: "2.0",
    requirements: [
      { section: "10.1", title: "Reasonable Security Practices", description: "Implement reasonable security practices (Section 43A) for AI systems handling sensitive personal data." },
      { section: "10.2", title: "Due Diligence", description: "Exercise due diligence (Section 79) as an intermediary when deploying AI-generated content." },
      { section: "10.3", title: "Cyber Security Compliance", description: "Ensure AI systems comply with cyber security requirements under the IT Act and its rules." },
      { section: "10.4", title: "Electronic Records", description: "Maintain proper electronic records for AI system decisions as per Section 4 and 5." },
    ],
  },
];

const seed = async () => {
  const client = await pool.connect();
  try {
    // Check if already seeded
    const existing = await client.query("SELECT COUNT(*) FROM frameworks");
    if (parseInt(existing.rows[0].count) > 0) {
      console.log("Frameworks already seeded. Skipping.");
      return;
    }

    for (const fw of frameworks) {
      const fwResult = await client.query(
        `INSERT INTO frameworks (name, short_code, description, category, issuing_body, effective_date, version)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [fw.name, fw.short_code, fw.description, fw.category, fw.issuing_body, fw.effective_date, fw.version]
      );
      const fwId = fwResult.rows[0].id;

      for (const req of fw.requirements) {
        await client.query(
          `INSERT INTO framework_requirements_template (framework_id, section_number, title, description)
           VALUES ($1,$2,$3,$4)`,
          [fwId, req.section, req.title, req.description]
        );
      }

      console.log(`Seeded: ${fw.name} (${fw.requirements.length} requirements)`);
    }

    console.log("Seed completed successfully.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
