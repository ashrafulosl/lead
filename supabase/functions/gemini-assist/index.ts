// =========================================================================
// gemini-assist — Supabase Edge Function (Deno runtime)
//
// This is the ONLY place the Gemini API key ever exists. The frontend
// never sees it. Every request must carry the caller's Supabase session
// token, which is used to build a Supabase client scoped to that exact
// user — so every database read/write in this function is still subject
// to the same Row Level Security as the rest of the app. This function
// has no special access; it can only ever see what the calling user
// could already see themselves.
//
// Two modes, both POSTed as JSON:
//   { mode: "suggest", todayStr, dayName, historyStart, historyEnd, forceRefresh? }
//   { mode: "chat",     message, todayStr, dayName, historyStart, historyEnd }
//
// Deploy with: supabase functions deploy gemini-assist
// Requires one secret: supabase secrets set GEMINI_API_KEY=...
// (SUPABASE_URL and SUPABASE_ANON_KEY are auto-injected by the platform.)
// =========================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_MODEL = "gemini-2.5-flash"; // free-tier, stable as of 2026
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    // Scoped to the caller — RLS applies to every query this client makes.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return json({ error: "Invalid or expired session" }, 401);

    const body = await req.json();

    if (body.mode === "suggest") return await handleSuggest(supabase, user.id, body);
    if (body.mode === "chat") return await handleChat(supabase, user.id, body);
    return json({ error: "mode must be 'suggest' or 'chat'" }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: String(err?.message || err) }, 500);
  }
});

// ---------------------------------------------------------------------
async function handleSuggest(supabase: any, userId: string, body: any) {
  const { todayStr, dayName, historyStart, historyEnd, forceRefresh } = body;
  if (!todayStr || !dayName || !historyStart || !historyEnd) {
    return json({ error: "suggest requires todayStr, dayName, historyStart, historyEnd" }, 400);
  }

  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from("ai_daily_suggestions")
      .select("suggestion")
      .eq("user_id", userId)
      .eq("suggestion_date", todayStr)
      .maybeSingle();
    if (cached) return json({ suggestion: cached.suggestion, cached: true });
  }

  const context = await buildContext(supabase, userId, dayName, historyStart, historyEnd);

  const prompt =
    "Based on the context below, write today's focus for this person — 3 to 5 short sentences, " +
    "plain text, no headers or bullet lists. Cover more than just workout and nutrition: weigh in " +
    "on appearance, presence, or character too if the recent history suggests something worth " +
    "noting (a dropped streak, lapsed logging, an approaching milestone). Be specific and " +
    "encouraging, but honest rather than generic — reference the actual numbers below.\n\n" + context;

  const suggestion = await callGemini({ contents: [{ role: "user", parts: [{ text: prompt }] }] });

  await supabase.from("ai_daily_suggestions").upsert(
    { user_id: userId, suggestion_date: todayStr, suggestion },
    { onConflict: "user_id,suggestion_date" }
  );

  return json({ suggestion, cached: false });
}

// ---------------------------------------------------------------------
async function handleChat(supabase: any, userId: string, body: any) {
  const { message, todayStr, dayName, historyStart, historyEnd } = body;
  if (!message || !todayStr) return json({ error: "chat requires message and todayStr" }, 400);

  await supabase.from("ai_chat_messages").insert({ user_id: userId, role: "user", content: message });

  const { data: recent } = await supabase
    .from("ai_chat_messages")
    .select("role, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const history = (recent || []).reverse();
  const contents = history.map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const context = await buildContext(supabase, userId, dayName, historyStart, historyEnd);

  const reply = await callGemini({
    system_instruction: {
      parts: [{
        text:
          "You are a calm, direct personal coach helping this person execute their 90-day " +
          "self-development plan (physique, appearance, presence, character). Keep replies short " +
          "(2-6 sentences), practical, and grounded in the context below — don't repeat generic " +
          "advice they haven't asked for.\n\n" + context,
      }],
    },
    contents,
  });

  await supabase.from("ai_chat_messages").insert({ user_id: userId, role: "assistant", content: reply });

  return json({ reply });
}

// ---------------------------------------------------------------------
// Builds a compact TEXT summary — identity + today's planned routine +
// a condensed recent-history digest — instead of shipping raw JSON rows.
// This is what keeps every Gemini call small, fast, and cheap regardless
// of how many days of history exist.
async function buildContext(supabase: any, userId: string, dayName: string, historyStart: string, historyEnd: string) {
  const { data: planRow } = await supabase
    .from("plan_config").select("plan").eq("user_id", userId).maybeSingle();
  const plan = planRow?.plan || {};

  const { data: records } = await supabase
    .from("day_records")
    .select("record_date, level, note")
    .eq("user_id", userId)
    .gte("record_date", historyStart)
    .lte("record_date", historyEnd)
    .order("record_date", { ascending: true });

  const rows = records || [];
  const trackable = rows.length;
  const logged = rows.filter((r: any) => r.level > 0).length;
  const fullDays = rows.filter((r: any) => r.level === 3).length;
  const notes =
    rows.filter((r: any) => r.note && r.note.trim())
      .map((r: any) => `${r.record_date}: "${r.note.trim()}"`)
      .join("; ") || "none logged";

  const todayPlan = plan.week?.[dayName];
  const todayPlanText = !todayPlan
    ? "not defined for this day"
    : todayPlan.rest
    ? `Rest day (${todayPlan.focus}) — ${todayPlan.note || ""}`
    : `${todayPlan.focus} — ${(todayPlan.exercises || []).map((e: any) => e.name).join(", ")}`;

  return [
    `IDENTITY / GOAL: ${plan.identity || "not set"}`,
    `TODAY (${dayName}): ${todayPlanText}`,
    `LAST ${trackable} TRACKED DAYS: ${logged}/${trackable} logged, ${fullDays} marked fully complete.`,
    `RECENT NOTES: ${notes}`,
  ].join("\n");
}

// ---------------------------------------------------------------------
async function callGemini(requestBody: unknown): Promise<string> {
  const res = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
  return text.trim() || "(no response from model)";
}
