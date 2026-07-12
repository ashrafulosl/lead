// =========================================================================
// Theme — light / dark / system, persisted in localStorage.
// The actual FIRST paint decision happens in a tiny inline script in
// index.html's <head> (to avoid a flash of the wrong theme before this
// module even loads). This file just wires up the toggle button(s) and
// keeps things in sync if the OS theme changes while "system" is active.
// =========================================================================

const STORAGE_KEY = "theme"; // "light" | "dark" | "system"
const ORDER = ["system", "light", "dark"];

const ICONS = {
  system: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  light: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
  dark: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
};

function getPref() {
  return localStorage.getItem(STORAGE_KEY) || "system";
}

function effectiveMode(pref) {
  if (pref === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return pref;
}

function apply(pref) {
  const mode = effectiveMode(pref);
  document.documentElement.setAttribute("data-theme", mode);
  document.documentElement.setAttribute("data-theme-pref", pref);
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.innerHTML = ICONS[pref];
    btn.setAttribute("title", "Theme: " + pref + " (click to change)");
    btn.setAttribute("aria-label", "Change theme, currently " + pref);
  });
}

function cycle() {
  const current = getPref();
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  localStorage.setItem(STORAGE_KEY, next);
  apply(next);
}

export function initTheme() {
  apply(getPref());

  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.addEventListener("click", cycle);
  });

  // If the user's OS theme changes while "system" is selected, follow it live.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getPref() === "system") apply("system");
  });
}
