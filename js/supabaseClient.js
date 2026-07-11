// =========================================================================
// Supabase client — single shared instance used by every other module.
// Loaded from CDN as an ES module so no build step / npm install is needed,
// which keeps this deployable as-is on GitHub Pages.
// =========================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

if (SUPABASE_URL.includes("YOUR_SUPABASE") || SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")) {
  console.warn(
    "[config] Supabase credentials are still placeholders. " +
    "Edit js/config.js with your project URL and anon key."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
