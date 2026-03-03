/**
 * Session utility — uses sessionStorage so session clears on browser close.
 * Drop-in replacement for direct localStorage calls for auth data.
 */

export const session = {
  get: (key) => sessionStorage.getItem(key),
  set: (key, value) => sessionStorage.setItem(key, value),
  remove: (key) => sessionStorage.removeItem(key),
  clear: () => sessionStorage.clear(),
};

// Auth-specific helpers
export const getUser = () => ({
  user_id:    sessionStorage.getItem("user_id"),
  user_email: sessionStorage.getItem("user_email"),
});

export const isLoggedIn = () => !!sessionStorage.getItem("user_id");

export const saveSession = (user_id, user_email) => {
  sessionStorage.setItem("user_id", user_id);
  sessionStorage.setItem("user_email", user_email);
};

export const clearSession = () => {
  sessionStorage.clear();
};

// Job data — still localStorage (persists tab to tab but cleared on new login)
export const saveJobData = (jobs, resume_id, total_found, resume_name) => {
  localStorage.setItem("jobs", JSON.stringify(jobs));
  localStorage.setItem("resume_id", resume_id);
  localStorage.setItem("total_found", total_found);
  localStorage.setItem("resume_name", resume_name);
};

export const getJobData = () => ({
  jobs:        JSON.parse(localStorage.getItem("jobs") || "[]"),
  resume_id:   localStorage.getItem("resume_id"),
  total_found: localStorage.getItem("total_found"),
  resume_name: localStorage.getItem("resume_name"),
});

export const clearJobData = () => {
  localStorage.removeItem("jobs");
  localStorage.removeItem("resume_id");
  localStorage.removeItem("total_found");
  localStorage.removeItem("resume_name");
  localStorage.removeItem("cart");
  localStorage.removeItem("cartJobs");
};