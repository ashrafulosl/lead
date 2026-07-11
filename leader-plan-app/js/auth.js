// =========================================================================
// Auth — email/password sign up, sign in, sign out, session state.
// Also wires up the auth screen's form UI (toggle, submit, errors).
// =========================================================================
import { supabase } from "./supabaseClient.js";

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");
const authError = document.getElementById("authError");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const showSignupBtn = document.getElementById("showSignup");
const showLoginBtn = document.getElementById("showLogin");
const toggleToSignup = document.getElementById("toggleToSignup");
const toggleToLogin = document.getElementById("toggleToLogin");
const logoutBtn = document.getElementById("logoutBtn");

function showError(message) {
  authError.textContent = message;
  authError.hidden = false;
}
function clearError() {
  authError.hidden = true;
  authError.textContent = "";
}
function setBtnLoading(btn, loading, label) {
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait…" : label;
}

// ---- Form toggle (login <-> signup) --------------------------------------
showSignupBtn.addEventListener("click", () => {
  clearError();
  loginForm.hidden = true;
  signupForm.hidden = false;
  toggleToSignup.hidden = true;
  toggleToLogin.hidden = false;
});
showLoginBtn.addEventListener("click", () => {
  clearError();
  signupForm.hidden = true;
  loginForm.hidden = false;
  toggleToLogin.hidden = true;
  toggleToSignup.hidden = false;
});

// ---- Sign in ---------------------------------------------------------------
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const btn = document.getElementById("loginBtn");

  setBtnLoading(btn, true, "Sign In");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setBtnLoading(btn, false, "Sign In");

  if (error) showError(error.message);
  // On success, onAuthStateChange (wired in main.js) handles the screen switch.
});

// ---- Sign up ---------------------------------------------------------------
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const btn = document.getElementById("signupBtn");

  setBtnLoading(btn, true, "Create Account");
  const { data, error } = await supabase.auth.signUp({ email, password });
  setBtnLoading(btn, false, "Create Account");

  if (error) {
    showError(error.message);
    return;
  }

  // If email confirmation is enabled in Supabase (default), there will be
  // no active session yet — let the user know to check their inbox.
  if (data.user && !data.session) {
    showError("Account created. Check your email to confirm, then sign in.");
    signupForm.hidden = true;
    loginForm.hidden = false;
    toggleToLogin.hidden = true;
    toggleToSignup.hidden = false;
  }
});

// ---- Sign out ----------------------------------------------------------
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
});

// ---- Screen switching helper, used by main.js ---------------------------
export function showAuthScreen() {
  authScreen.hidden = false;
  appScreen.hidden = true;
}
export function showAppScreen() {
  authScreen.hidden = true;
  appScreen.hidden = false;
}
