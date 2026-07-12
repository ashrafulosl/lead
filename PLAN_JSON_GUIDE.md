# Plan JSON Template & Guide

Use this to generate a routine — by hand, or by giving this whole file to
any AI with your goals and asking it to fill in the template. The output
just needs to be valid JSON matching this shape, importable directly from
the **Plan** tab in the app (Import JSON file → Save Plan).

## The prompt you can give to any AI

> "Here is a JSON schema for a personal routine tracker. Generate a
> complete, valid JSON plan matching this exact structure for someone
> whose goal is: [describe your goal, constraints, equipment, schedule,
> etc.]. Return ONLY the JSON, no explanation, no markdown code fences."

Then paste the schema below (everything in the "Schema" section) after
that prompt.

---

## Schema

```
{
  "identity": string,
  // One paragraph describing the goal / motivation. Shown at the top of
  // the Plan tab as context. Optional but recommended.

  "startDate": "YYYY-MM-DD",
  // The first day of the plan.

  "totalDays": number,
  // How many days the plan runs, e.g. 90.

  "week": {
    // One entry per day name: Mon, Tue, Wed, Thu, Fri, Sat, Sun.
    // Every day must be present, even rest days.
    "Mon": {
      "focus": string,          // short label shown as the day's title, e.g. "Push — Chest, Shoulders"
      "rest": boolean,          // true = rest day, shows "note" instead of exercises. Omit or false for a training day.
      "note": string,           // only used when rest is true — what to do instead (walk, stretch, etc.)
      "exercises": [            // only used when rest is false/omitted
        {
          "name": string,       // exercise name, e.g. "Push-ups"
          "note": string,       // short how-to / equipment note, e.g. "Floor"
          "sr": string          // sets x reps as a display string, e.g. "3 × 12–15"
        }
        // ...more exercises for this day
      ]
    }
    // ...repeat for Tue, Wed, Thu, Fri, Sat, Sun
  },

  "nutrition": {
    // Any number of named meal blocks, each an array of food items (strings).
    "Breakfast": ["3 eggs", "Milk"],
    "Lunch": ["Rice", "Chicken / Fish", "Vegetables"]
    // ...add or rename blocks freely (e.g. "Pre-workout", "Post-workout")
  },

  "appearance": {
    // Any number of named checklist groups, each an array of item strings.
    // These show as weekly (not daily) checkboxes in the "More" tab.
    "Grooming": ["Haircut on schedule", "Skin: cleanse + moisturize"],
    "Presence": ["Practiced posture today"]
  },

  "mentalBoard": [
    // Any number of study/reading periods, shown as a table in "More".
    {
      "month": string,     // e.g. "Month 1 (Day 1–30)"
      "focus": string,     // e.g. "Character & Integrity"
      "figures": string,   // e.g. "Umar ibn al-Khattab, Ratan Tata"
      "input": string      // e.g. "Biography reading, ~10 pages daily"
    }
  ],

  "milestones": [
    // Any number of checkpoints, shown as cards in "More".
    { "day": "Day 30", "text": "What should be true by this point." }
  ]
}
```

## Rules that matter

- Every field name is **case-sensitive** and must match exactly (`week`, not `Week`).
- `week` must have all 7 day names, even if a day is just `{ "rest": true, "focus": "Rest", "note": "..." }`.
- `totalDays` should realistically match how many days you actually intend to run this for — the Progress tab's 90-day-style grid and streak math are driven directly by this number and `startDate`.
- If you rename an exercise between imports, its checkbox history under the old name won't carry over — new name means a fresh tracking key. Dates and streaks are unaffected.
- The importer only checks that `startDate` and `week` exist before accepting a file — malformed nested data (e.g. a day missing `exercises`) will just render blank for that section rather than crash, so double-check the output before relying on it.

## Minimal valid example

This is the smallest file that will import successfully — a 1-week loop as a starting point you can extend:

```json
{
  "identity": "Building consistency before intensity.",
  "startDate": "2026-08-01",
  "totalDays": 7,
  "week": {
    "Mon": { "focus": "Full Body", "exercises": [
      { "name": "Push-ups", "note": "Floor", "sr": "3 × 12" }
    ]},
    "Tue": { "rest": true, "focus": "Rest", "note": "Walk 20 minutes." },
    "Wed": { "focus": "Full Body", "exercises": [
      { "name": "Squats", "note": "Bodyweight", "sr": "3 × 15" }
    ]},
    "Thu": { "rest": true, "focus": "Rest", "note": "Stretch." },
    "Fri": { "focus": "Full Body", "exercises": [
      { "name": "Pull-ups", "note": "Doorframe bar", "sr": "3 × 6" }
    ]},
    "Sat": { "rest": true, "focus": "Light", "note": "Mobility work." },
    "Sun": { "rest": true, "focus": "Complete Rest", "note": "" }
  },
  "nutrition": {
    "Breakfast": ["Eggs", "Milk"],
    "Lunch": ["Rice", "Protein", "Vegetables"]
  },
  "appearance": {
    "Grooming": ["Basic grooming check"]
  },
  "mentalBoard": [
    { "month": "Week 1", "focus": "Getting started", "figures": "—", "input": "Daily reflection" }
  ],
  "milestones": [
    { "day": "Day 7", "text": "Completed the first full loop." }
  ]
}
```

Save any generated JSON as a `.json` file, then in the app: **Plan tab → Import JSON file** → review it in the editor → **Save Plan**.
