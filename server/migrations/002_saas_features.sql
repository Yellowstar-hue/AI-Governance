-- AISafe SaaS Extension Schema
-- Subscriptions, notifications, templates, trust center, webhooks, assessments

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  max_users INTEGER DEFAULT 5,
  max_models INTEGER DEFAULT 10,
  max_vendors INTEGER DEFAULT 10,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Organization Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  plan_id INTEGER REFERENCES subscription_plans(id),
  status VARCHAR(50) DEFAULT 'trial',
  trial_ends_at TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  payment_gateway VARCHAR(50),
  gateway_subscription_id VARCHAR(255),
  gateway_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);

-- Payment History
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  subscription_id INTEGER REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'pending',
  gateway VARCHAR(50),
  gateway_payment_id VARCHAR(255),
  gateway_order_id VARCHAR(255),
  receipt_url TEXT,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  invoice_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  message TEXT,
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- Email Queue
CREATE TABLE IF NOT EXISTS email_queue (
  id SERIAL PRIMARY KEY,
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  template VARCHAR(100) NOT NULL,
  template_data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_status ON email_queue(status);

-- Policy Templates
CREATE TABLE IF NOT EXISTS policy_templates (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  applicable_frameworks TEXT,
  language VARCHAR(50) DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assessment Templates
CREATE TABLE IF NOT EXISTS assessment_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100) NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  scoring_method VARCHAR(50) DEFAULT 'weighted',
  applicable_frameworks TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assessments (instances)
CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES assessment_templates(id),
  organization_id INTEGER REFERENCES organizations(id),
  model_id INTEGER REFERENCES ai_models(id),
  vendor_id INTEGER REFERENCES vendors(id),
  title VARCHAR(500) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  responses JSONB DEFAULT '{}',
  score DECIMAL(5,2),
  risk_rating VARCHAR(50),
  assigned_to INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  completed_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assessments_org ON assessments(organization_id);

-- AI Trust Center (public-facing)
CREATE TABLE IF NOT EXISTS trust_center (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  public_slug VARCHAR(100) UNIQUE,
  company_description TEXT,
  ai_commitment TEXT,
  dpo_name VARCHAR(255),
  dpo_email VARCHAR(255),
  grievance_officer_name VARCHAR(255),
  grievance_officer_email VARCHAR(255),
  published_policies JSONB DEFAULT '[]',
  published_frameworks JSONB DEFAULT '[]',
  custom_sections JSONB DEFAULT '[]',
  theme_color VARCHAR(50) DEFAULT '#1a237e',
  logo_url TEXT,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret VARCHAR(255),
  events JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP,
  failure_count INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_org ON webhooks(organization_id);

-- Webhook Delivery Log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER REFERENCES webhooks(id),
  event VARCHAR(100),
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMP DEFAULT NOW()
);

-- File Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  entity_type VARCHAR(100),
  entity_id INTEGER,
  filename VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(255),
  size_bytes BIGINT,
  storage_path TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);

-- AI Advisor Chat History
CREATE TABLE IF NOT EXISTS ai_advisor_chats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  session_id VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_chats_session ON ai_advisor_chats(session_id);

-- Data Processing Activities (DPDP compliance)
CREATE TABLE IF NOT EXISTS data_processing_activities (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  purpose TEXT,
  data_categories JSONB DEFAULT '[]',
  data_subjects JSONB DEFAULT '[]',
  legal_basis VARCHAR(100),
  retention_period VARCHAR(100),
  cross_border_transfer BOOLEAN DEFAULT false,
  transfer_destinations JSONB DEFAULT '[]',
  security_measures TEXT,
  model_id INTEGER REFERENCES ai_models(id),
  status VARCHAR(50) DEFAULT 'active',
  dpia_required BOOLEAN DEFAULT false,
  dpia_completed BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dpa_org ON data_processing_activities(organization_id);

-- Tags (for organizing any entity)
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#1a237e',
  entity_type VARCHAR(50),
  entity_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tags_entity ON tags(entity_type, entity_id);

-- Scheduled Reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  report_type VARCHAR(100) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  recipients JSONB DEFAULT '[]',
  last_sent TIMESTAMP,
  next_send TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comments (on any entity)
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, max_users, max_models, max_vendors, features) VALUES
('Free', 'free', 'For individuals and small teams getting started with AI governance', 0, 0, 3, 5, 5, '{"frameworks": 3, "reports": "basic", "support": "community", "api_access": false, "webhooks": false, "trust_center": false, "ai_advisor": false}'),
('Starter', 'starter', 'For growing teams that need comprehensive AI governance', 4999, 49990, 10, 25, 25, '{"frameworks": "all", "reports": "standard", "support": "email", "api_access": true, "webhooks": 5, "trust_center": true, "ai_advisor": false, "file_storage_gb": 5}'),
('Professional', 'professional', 'For organizations with advanced compliance needs', 14999, 149990, 50, 100, 100, '{"frameworks": "all", "reports": "advanced", "support": "priority", "api_access": true, "webhooks": 25, "trust_center": true, "ai_advisor": true, "file_storage_gb": 50, "scheduled_reports": true, "custom_assessments": true}'),
('Enterprise', 'enterprise', 'For large enterprises requiring full governance capabilities', 49999, 499990, -1, -1, -1, '{"frameworks": "all", "reports": "enterprise", "support": "dedicated", "api_access": true, "webhooks": -1, "trust_center": true, "ai_advisor": true, "file_storage_gb": 500, "scheduled_reports": true, "custom_assessments": true, "sso": true, "audit_api": true, "sla": "99.9%"}');
