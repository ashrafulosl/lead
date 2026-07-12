// =========================================================================
// Data access — every read/write to Supabase lives here. Each function
// throws on error so callers can catch and show a message; nothing here
// touches the DOM directly.
// =========================================================================
import { supabase } from "./supabaseClient.js";

// ---- day_records ------------------------------------------------------

// Fetch a single day's record. Returns a default empty shape if none exists
// yet (nothing is written to the DB until the user actually checks something).
export async function getDayRecord(userId, dateStr) {
  const { data, error } = await supabase
    .from("day_records")
    .select("*")
    .eq("user_id", userId)
    .eq("record_date", dateStr)
    .maybeSingle();

  if (error) throw error;

  return data || {
    record_date: dateStr,
    level: 0,
    exercises: {},
    nutrition: {},
    note: ""
  };
}

// Fetch every record in a date range in one call (used for the 90-day grid).
// Returns a Map keyed by date string for fast lookup while rendering.
export async function getDayRecordsRange(userId, startDate, endDate) {
  const { data, error } = await supabase
    .from("day_records")
    .select("*")
    .eq("user_id", userId)
    .gte("record_date", startDate)
    .lte("record_date", endDate);

  if (error) throw error;

  const map = new Map();
  (data || []).forEach((row) => map.set(row.record_date, row));
  return map;
}

// Upsert (insert or update) a day record. Pass only the fields changing;
// existing fields are merged in by the caller before calling this.
export async function saveDayRecord(userId, dateStr, patch) {
  const { error } = await supabase
    .from("day_records")
    .upsert(
      {
        user_id: userId,
        record_date: dateStr,
        ...patch
      },
      { onConflict: "user_id,record_date" }
    );

  if (error) throw error;
}

// ---- appearance_checks --------------------------------------------------

// Fetch all appearance checklist items for this user as a Map<item_key, checked>.
export async function getAppearanceChecks(userId) {
  const { data, error } = await supabase
    .from("appearance_checks")
    .select("item_key, checked")
    .eq("user_id", userId);

  if (error) throw error;

  const map = new Map();
  (data || []).forEach((row) => map.set(row.item_key, row.checked));
  return map;
}

export async function setAppearanceCheck(userId, itemKey, checked) {
  const { error } = await supabase
    .from("appearance_checks")
    .upsert(
      { user_id: userId, item_key: itemKey, checked },
      { onConflict: "user_id,item_key" }
    );

  if (error) throw error;
}

// ---- plan_config ----------------------------------------------------
// The user's entire editable routine (goal, week plan, nutrition,
// appearance checklist, mental board, milestones) lives here as one
// JSON blob. Returns null if the user has never saved one yet — the
// caller falls back to DEFAULT_PLAN from config.js in that case.
export async function getPlanConfig(userId) {
  const { data, error } = await supabase
    .from("plan_config")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? data.plan : null;
}

export async function savePlanConfig(userId, planObj) {
  const { error } = await supabase
    .from("plan_config")
    .upsert(
      { user_id: userId, plan: planObj },
      { onConflict: "user_id" }
    );

  if (error) throw error;
}
