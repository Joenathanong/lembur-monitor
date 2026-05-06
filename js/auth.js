// ============================================================
// AUTH — Login per Divisi
// ============================================================

const AUTH_KEY = 'lembur_session';

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(AUTH_KEY)); } catch { return null; }
}

function setSession(divisi) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify({ divisi, loginAt: Date.now() }));
}

function clearSession() {
  sessionStorage.removeItem(AUTH_KEY);
}

function requireAuth() {
  const s = getSession();
  if (!s) { window.location.href = 'index.html'; return null; }
  return s.divisi;
}

function login(divisi, password) {
  const cred = DIVISI_CREDENTIALS[divisi];
  if (!cred) return false;
  if (cred.password !== password) return false;
  setSession(divisi);
  return true;
}

function logout() {
  clearSession();
  window.location.href = 'index.html';
}
