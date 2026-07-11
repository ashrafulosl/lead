// =========================================================================
// Entry point — loaded via <script type="module" src="js/main.js"> in
// index.html. Listens for auth state and switches screens accordingly.
// =========================================================================
import { supabase } from "./supabaseClient.js";
import { showAuthScreen, showAppScreen } from "./auth.js"; // also wires up form handlers as a side effect
import { initApp } from "./app.js";

let appInitialized = false;

supabase.auth.onAuthStateChange((_event, session) => {
  if (session && session.user) {
    showAppScreen();
    if (!appInitialized) {
      appInitialized = true;
      initApp(session.user);
    }
  } else {
    appInitialized = false;
    showAuthScreen();
  }
});

// Check for an existing session on first load (e.g. user already logged in
// from a previous visit — Supabase persists the session in local storage
// by default, this is just the auth token, not app data).
supabase.auth.getSession().then(({ data }) => {
  if (data.session && data.session.user) {
    showAppScreen();
    if (!appInitialized) {
      appInitialized = true;
      initApp(data.session.user);
    }
  } else {
    showAuthScreen();
  }
});
