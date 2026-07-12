// =========================================================================
// CONFIG — edit this file to customize the app.
// =========================================================================

// ---- Supabase connection -------------------------------------------------
// Get these from: Supabase Dashboard → Project Settings → API
// The anon/public key is safe to expose in frontend code — Row Level
// Security (see sql/schema.sql) is what actually protects each user's data.
//
// IMPORTANT: paste your real values back in here — this file was
// regenerated to add the DEFAULT_PLAN changes below.
export const SUPABASE_URL = "https://trerfumyggjzrxabvyxi.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZXJmdW15Z2dqenJ4YWJ2eXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzkzOTIsImV4cCI6MjA5OTM1NTM5Mn0.tZqUeVDRJ-0WZf4QpI1t02OF36vkUfSPUWaN6RRNV-0";

// ---- Default plan content --------------------------------------------
// This is now only a FALLBACK / starting template. The first time you log
// in, this gets copied into the `plan_config` table in Supabase, and from
// then on the app reads and writes YOUR live copy there — editable from
// the "Plan" tab in the app itself, no code changes needed.
//
// If you ever want to wipe your live plan and start over, use "Reset to
// Default" in the Plan tab — it reloads exactly what's written here.
export const DEFAULT_PLAN = {
  identity: "My aspiration is to become a principled, intellectually curious, and quietly ambitious leader who earns respect through competence, integrity, and consistent execution.",

  startDate: "2026-07-10",   // YYYY-MM-DD
  totalDays: 90,

  // Mon–Sun. rest:true days show a rest card instead of exercises.
  week: {
    Mon: { focus: "Push — Chest, Shoulders, Triceps", exercises: [
      { name: "Push-ups", note: "Floor", sr: "3 × 12–15" },
      { name: "Pike push-ups", note: "Feet elevated on chair for more difficulty", sr: "3 × 8–12" },
      { name: "Backpack shoulder press", note: "Loaded backpack, overhead", sr: "3 × 10–12" },
      { name: "Chair dips", note: "Between two sturdy chairs / bed edge", sr: "3 × 10–12" },
      { name: "Backpack lateral raises", note: "Light backpack or water bottles", sr: "3 × 12–15" }
    ]},
    Tue: { focus: "Pull — Back, Biceps, Forearms", exercises: [
      { name: "Pull-ups / chin-ups", note: "Doorframe bar", sr: "3 × 6–10" },
      { name: "Inverted rows", note: "Under sturdy table or low bar", sr: "3 × 10–12" },
      { name: "Backpack rows", note: "Bent-over, one or both arms", sr: "3 × 10–12" },
      { name: "Resistance band rows", note: "If you have a band", sr: "3 × 12–15" },
      { name: "Backpack curls", note: "Loaded backpack or water bottles", sr: "3 × 10–15" },
      { name: "Hammer curls", note: "Water bottles, neutral grip", sr: "3 × 10–15" }
    ]},
    Wed: { rest: true, focus: "Rest", note: "Walk, stretch, read, recover. No equipment." },
    Thu: { focus: "Legs", exercises: [
      { name: "Squats", note: "Bodyweight, or backpack at chest", sr: "3 × 12–15" },
      { name: "Romanian deadlifts", note: "Loaded backpack in front, hinge at hips", sr: "3 × 10–12" },
      { name: "Walking lunges", note: "Down a hallway", sr: "3 × 10 / leg" },
      { name: "Calf raises", note: "Stand on a stair edge", sr: "3 × 15–20" },
      { name: "Plank", note: "Floor", sr: "3 × 30–45 sec" }
    ]},
    Fri: { focus: "Upper Body (Full) + Direct Arm Work", exercises: [
      { name: "Pull-ups", note: "Doorframe bar", sr: "3 × 6–10" },
      { name: "Push-ups", note: "Floor", sr: "3 × 12–15" },
      { name: "Backpack rows", note: "Bent-over", sr: "3 × 10–12" },
      { name: "Backpack shoulder press", note: "Overhead", sr: "3 × 10–12" },
      { name: "Backpack curls", note: "One or both arms", sr: "3 × 10–15" },
      { name: "Hammer curls", note: "Water bottles", sr: "3 × 10–15" },
      { name: "Chair dips", note: "Triceps focus", sr: "3 × 10–15" }
    ]},
    Sat: { rest: true, focus: "Light", note: "30-minute walk, mobility, stretching. No equipment." },
    Sun: { rest: true, focus: "Complete Rest", note: "Full recovery day." }
  },

  nutrition: {
    "Breakfast": ["3 eggs", "Milk"],
    "Lunch": ["Rice", "Chicken / Fish", "Vegetables"],
    "Snack": ["Banana", "Peanuts"],
    "Dinner": ["Rice", "Beef / Fish / Chicken", "Vegetables"],
    "Before Bed": ["Milk"]
  },

  appearance: {
    "Grooming": ["Haircut on schedule (every 3–4 wks)", "Shave / beard shaped", "Skin: cleanse + moisturize"],
    "Presence": ["Practiced posture today", "One conversation with deliberate pace/pauses"],
    "Clothing / Shoes": ["Clothes clean & well-fitted", "Shoes cleaned"]
  },

  mentalBoard: [
    { month: "Month 1 (Day 1–30)", focus: "Character & Integrity", figures: "Umar ibn al-Khattab, Ratan Tata", input: "Biography reading/video, ~10 pages daily" },
    { month: "Month 2 (Day 31–60)", focus: "Strategic Judgment & Mental Models", figures: "Warren Buffett, Charlie Munger", input: "Letters/interviews, one model applied weekly" },
    { month: "Month 3 (Day 61–90)", focus: "Leadership & Industrial Vision", figures: "Satya Nadella, Narayana Murthy, Jensen Huang", input: "Talks/interviews, tie to RMG production knowledge" }
  ],

  milestones: [
    { day: "Day 30", text: "Habits run without needing willpower to start. Posture correction noticeable to you." },
    { day: "Day 60", text: "Visible firmness in shoulders/arms. Strength up on core lifts. Communication feels more natural." },
    { day: "Day 90", text: "Others comment on physique or presence unprompted. Full 90-day track record to plan the next quarter." }
  ]
};
