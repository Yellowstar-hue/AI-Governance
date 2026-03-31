import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aisafe_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("aisafe_token");
      localStorage.removeItem("aisafe_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  changePassword: (data) => api.put("/auth/password", data),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get("/dashboard"),
};

// Models
export const modelsAPI = {
  list: (params) => api.get("/models", { params }),
  get: (id) => api.get(`/models/${id}`),
  create: (data) => api.post("/models", data),
  update: (id, data) => api.put(`/models/${id}`, data),
  delete: (id) => api.delete(`/models/${id}`),
};

// Risks
export const risksAPI = {
  list: (params) => api.get("/risks", { params }),
  get: (id) => api.get(`/risks/${id}`),
  create: (data) => api.post("/risks", data),
  update: (id, data) => api.put(`/risks/${id}`, data),
};

// Compliance
export const complianceAPI = {
  overview: () => api.get("/compliance/overview"),
  score: () => api.get("/compliance/score"),
  requirements: (frameworkId) =>
    api.get(`/compliance/frameworks/${frameworkId}/requirements`),
  updateRequirement: (id, data) => api.put(`/compliance/requirements/${id}`, data),
};

// Frameworks
export const frameworksAPI = {
  list: () => api.get("/frameworks"),
  get: (id) => api.get(`/frameworks/${id}`),
  initialize: (id) => api.post(`/frameworks/${id}/initialize`),
};

// Vendors
export const vendorsAPI = {
  list: () => api.get("/vendors"),
  get: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post("/vendors", data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
};

// Incidents
export const incidentsAPI = {
  list: (params) => api.get("/incidents", { params }),
  get: (id) => api.get(`/incidents/${id}`),
  create: (data) => api.post("/incidents", data),
  update: (id, data) => api.put(`/incidents/${id}`, data),
};

// Policies
export const policiesAPI = {
  list: () => api.get("/policies"),
  get: (id) => api.get(`/policies/${id}`),
  create: (data) => api.post("/policies", data),
  update: (id, data) => api.put(`/policies/${id}`, data),
};

// Evidence
export const evidenceAPI = {
  list: (params) => api.get("/evidence", { params }),
  create: (data) => api.post("/evidence", data),
  delete: (id) => api.delete(`/evidence/${id}`),
};

// Reports
export const reportsAPI = {
  complianceSummary: () => api.get("/reports/compliance-summary"),
  riskAssessment: () => api.get("/reports/risk-assessment"),
  vendorAssessment: () => api.get("/reports/vendor-assessment"),
};

// Audit
export const auditAPI = {
  logs: (params) => api.get("/audit/logs", { params }),
  entityHistory: (type, id) => api.get(`/audit/entity/${type}/${id}`),
};

// Users
export const usersAPI = {
  list: () => api.get("/users"),
  invite: (data) => api.post("/users/invite", data),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  deactivate: (id) => api.delete(`/users/${id}`),
};

// Organizations
export const organizationsAPI = {
  get: () => api.get("/organizations"),
  update: (data) => api.put("/organizations", data),
  stats: () => api.get("/organizations/stats"),
};

// Subscriptions
export const subscriptionsAPI = {
  plans: () => api.get("/subscriptions/plans"),
  current: () => api.get("/subscriptions/current"),
  subscribe: (data) => api.post("/subscriptions/subscribe", data),
  cancel: () => api.post("/subscriptions/cancel"),
  payments: () => api.get("/subscriptions/payments"),
};

// Notifications
export const notificationsAPI = {
  list: (params) => api.get("/notifications", { params }),
  count: () => api.get("/notifications/count"),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
};

// AI Advisor
export const aiAdvisorAPI = {
  newSession: () => api.post("/ai-advisor/sessions"),
  chat: (data) => api.post("/ai-advisor/chat", data),
  history: (sessionId) => api.get(`/ai-advisor/sessions/${sessionId}`),
};

// Trust Center
export const trustCenterAPI = {
  get: () => api.get("/trust-center"),
  update: (data) => api.put("/trust-center", data),
  public: (slug) => api.get(`/trust-center/public/${slug}`),
};

// Assessments
export const assessmentsAPI = {
  templates: () => api.get("/assessments/templates"),
  list: (params) => api.get("/assessments", { params }),
  get: (id) => api.get(`/assessments/${id}`),
  create: (data) => api.post("/assessments", data),
  updateResponses: (id, responses) => api.put(`/assessments/${id}/responses`, { responses }),
  complete: (id) => api.post(`/assessments/${id}/complete`),
};

// Search
export const searchAPI = {
  query: (q) => api.get("/search", { params: { q } }),
};

// Comments
export const commentsAPI = {
  list: (entityType, entityId) => api.get(`/comments/${entityType}/${entityId}`),
  add: (entityType, entityId, content) => api.post(`/comments/${entityType}/${entityId}`, { content }),
  delete: (id) => api.delete(`/comments/${id}`),
};

// Data Processing Activities
export const dataProcessingAPI = {
  list: () => api.get("/data-processing"),
  get: (id) => api.get(`/data-processing/${id}`),
  create: (data) => api.post("/data-processing", data),
  update: (id, data) => api.put(`/data-processing/${id}`, data),
};

// Policy Templates
export const policyTemplatesAPI = {
  list: () => api.get("/policy-templates"),
  get: (id) => api.get(`/policy-templates/${id}`),
  use: (id) => api.post(`/policy-templates/${id}/use`),
};

// Webhooks
export const webhooksAPI = {
  list: () => api.get("/webhooks"),
  create: (data) => api.post("/webhooks", data),
  update: (id, data) => api.put(`/webhooks/${id}`, data),
  delete: (id) => api.delete(`/webhooks/${id}`),
  deliveries: (id) => api.get(`/webhooks/${id}/deliveries`),
};

// File Uploads
export const uploadsAPI = {
  upload: (entityType, entityId, files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    return api.post(`/uploads/${entityType}/${entityId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  list: (entityType, entityId) => api.get(`/uploads/${entityType}/${entityId}`),
  delete: (id) => api.delete(`/uploads/${id}`),
};

// Export Reports
export const reportsExportAPI = {
  complianceFull: () => api.get("/reports-export/compliance-full"),
  dpia: (modelId) => api.get(`/reports-export/dpia/${modelId}`),
};

export default api;
