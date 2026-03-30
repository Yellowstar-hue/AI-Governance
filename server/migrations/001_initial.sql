-- AISafe Database Schema
-- Multi-tenant SaaS for AI Governance in India

-- Organizations (tenants)
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  size VARCHAR(50),
  website VARCHAR(255),
  gstin VARCHAR(20),
  cin VARCHAR(25),
  plan VARCHAR(50) DEFAULT 'trial',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  organization_id INTEGER REFERENCES organizations(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org ON users(organization_id);

-- Regulatory Frameworks
CREATE TABLE IF NOT EXISTS frameworks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  short_code VARCHAR(50) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  issuing_body VARCHAR(255),
  country VARCHAR(50) DEFAULT 'India',
  effective_date DATE,
  version VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Framework requirements template (master list)
CREATE TABLE IF NOT EXISTS framework_requirements_template (
  id SERIAL PRIMARY KEY,
  framework_id INTEGER REFERENCES frameworks(id),
  section_number VARCHAR(50),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  priority VARCHAR(50) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Per-organization compliance requirements
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id SERIAL PRIMARY KEY,
  framework_id INTEGER REFERENCES frameworks(id),
  organization_id INTEGER REFERENCES organizations(id),
  section_number VARCHAR(50),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'not_assessed',
  notes TEXT,
  evidence_ids TEXT,
  assigned_to INTEGER REFERENCES users(id),
  last_assessed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_compliance_org ON compliance_requirements(organization_id);
CREATE INDEX idx_compliance_framework ON compliance_requirements(framework_id);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  risk_level VARCHAR(50) DEFAULT 'medium',
  country VARCHAR(100),
  services_provided TEXT,
  data_processing_location VARCHAR(50),
  dpdp_compliant BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active',
  assessment_notes TEXT,
  last_assessment_date DATE,
  organization_id INTEGER REFERENCES organizations(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vendors_org ON vendors(organization_id);

-- AI Models
CREATE TABLE IF NOT EXISTS ai_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  model_type VARCHAR(100),
  risk_level VARCHAR(50) DEFAULT 'limited',
  purpose TEXT,
  vendor_id INTEGER REFERENCES vendors(id),
  data_sources TEXT,
  deployment_env VARCHAR(50) DEFAULT 'development',
  status VARCHAR(50) DEFAULT 'active',
  organization_id INTEGER REFERENCES organizations(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_models_org ON ai_models(organization_id);

-- Risks
CREATE TABLE IF NOT EXISTS risks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  model_id INTEGER REFERENCES ai_models(id),
  mitigation_plan TEXT,
  owner_id INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'identified',
  resolution_notes TEXT,
  organization_id INTEGER REFERENCES organizations(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_risks_org ON risks(organization_id);
CREATE INDEX idx_risks_model ON risks(model_id);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  model_id INTEGER REFERENCES ai_models(id),
  affected_users INTEGER DEFAULT 0,
  cert_in_reportable BOOLEAN DEFAULT false,
  cert_in_reported BOOLEAN DEFAULT false,
  cert_in_report_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'reported',
  resolution TEXT,
  root_cause TEXT,
  corrective_actions TEXT,
  reported_by INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incidents_org ON incidents(organization_id);

-- Policies
CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  category VARCHAR(100),
  version VARCHAR(50) DEFAULT '1.0',
  applicable_frameworks TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  approved_by INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_policies_org ON policies(organization_id);

-- Evidence
CREATE TABLE IF NOT EXISTS evidence (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(100),
  folder VARCHAR(255) DEFAULT 'General',
  framework_id INTEGER REFERENCES frameworks(id),
  requirement_id INTEGER REFERENCES compliance_requirements(id),
  url TEXT,
  file_path TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evidence_org ON evidence(organization_id);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
