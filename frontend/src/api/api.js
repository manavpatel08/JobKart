import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE_URL;

// Auto-attach user_id from sessionStorage (browser-session only)
axios.interceptors.request.use((config) => {
  const user_id = sessionStorage.getItem("user_id");
  if (user_id) config.headers["x-user-id"] = user_id;
  return config;
});

// ── AUTH ───────────────────────────────────────────────────
export const sendOTP = async (email) => {
  const res = await axios.post(`${BASE}/api/auth/send-otp`, { email });
  return res.data;
};

export const verifyOTP = async (email, otp) => {
  const res = await axios.post(`${BASE}/api/auth/verify-otp`, { email, otp });
  return res.data;
};

// ── RESUMES ────────────────────────────────────────────────
export const uploadResume = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post(`${BASE}/api/resume/upload`, form);
  return res.data;
};

export const getResumes = async () => {
  const res = await axios.get(`${BASE}/api/resumes`);
  return res.data;
};

export const deleteResume = async (resume_id) => {
  const res = await axios.delete(`${BASE}/api/resume/${resume_id}`);
  return res.data;
};

// ── JOBS ───────────────────────────────────────────────────
export const searchJobs = async (resume_id) => {
  const res = await axios.post(`${BASE}/api/jobs/search`, { resume_id });
  const data = res.data;

  // Save paginated structure to localStorage for JobResultsPage
  if (data.jobs) {
    localStorage.setItem("jobs", JSON.stringify({
      jobs:              data.jobs              || [],
      aspirational_jobs: data.aspirational_jobs || [],
      remaining_jobs:    data.remaining_jobs    || [],
    }));
    localStorage.setItem("total_found", data.total_found || 0);
  }

  return data;
};

export const customSearch = async (query, location = "India", resume_id = null) => {
  const res = await axios.post(`${BASE}/api/jobs/custom-search`, {
    query, location, resume_id,
  });
  return res.data;
};

export const analyzeJobSkills = async (resume_id, job_title, job_description, base_match_score) => {
  const res = await axios.post(`${BASE}/api/jobs/analyze-skills`, {
    resume_id, job_title, job_description, base_match_score,
  });
  return res.data;
};

// ── APPLICATIONS ───────────────────────────────────────────
export const markApplied = async (resume_id, job_data) => {
  const res = await axios.post(`${BASE}/api/applications/mark-applied`, {
    resume_id, job_data,
  });
  return res.data;
};

export const addToQueue = async (resume_id, job_data) => {
  const res = await axios.post(`${BASE}/api/applications/add-to-queue`, {
    resume_id, job_data,
  });
  return res.data;
};

export const removeApplication = async (application_id) => {
  const res = await axios.delete(`${BASE}/api/applications/${application_id}`);
  return res.data;
};

export const updateApplication = async (application_id, data) => {
  const res = await axios.patch(`${BASE}/api/applications/${application_id}`, {
    application_id,
    ...data,
  });
  return res.data;
};

export const getApplications = async (status = null) => {
  const url = status
    ? `${BASE}/api/applications?status=${status}`
    : `${BASE}/api/applications`;
  const res = await axios.get(url);
  return res.data;
};

// ── STATS ──────────────────────────────────────────────────
export const getStats = async () => {
  const res = await axios.get(`${BASE}/api/stats`);
  return res.data;
};

// ── RESUME SCORE ───────────────────────────────────────────
export const scoreResume = async (resume_id) => {
  const res = await axios.post(`${BASE}/api/resume/score`, { resume_id });
  return res.data;
};

export const getCachedScore = async (resume_id) => {
  const res = await axios.get(`${BASE}/api/resume/${resume_id}/score`);
  return res.data;
};

export const resumeChat = async (resume_id, message, conversation_history = []) => {
  const res = await axios.post(`${BASE}/api/resume/chat`, {
    resume_id, message, conversation_history,
  });
  return res.data;
};