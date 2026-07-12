// =========================================================================
// AI — talks to the gemini-assist Edge Function (never to Gemini directly;
// the API key lives only on the server side). Also reads chat history
// straight from Supabase, since that's just a normal RLS-protected read.
// =========================================================================
import { supabase } from "./supabaseClient.js";
import { SUPABASE_URL } from "./config.js";

const FN_URL = SUPABASE_URL.replace(/\/$/, "") + "/functions/v1/gemini-assist";

async function callFn(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");

  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ctx = { todayStr, dayName, historyStart, historyEnd }
export async function getTodaySuggestion(ctx, forceRefresh = false) {
  const result = await callFn({ mode: "suggest", forceRefresh, ...ctx });
  return result.suggestion;
}

export async function sendChatMessage(ctx, message) {
  const result = await callFn({ mode: "chat", message, ...ctx });
  return result.reply;
}

export async function getChatHistory(limit = 40) {
  const { data, error } = await supabase
    .from("ai_chat_messages")
    .select("role, content, created_at")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
