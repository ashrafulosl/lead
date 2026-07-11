// =========================================================================
// App — renders the four views and wires up all user interaction.
// Called once per login (see main.js) with the authenticated user.
// =========================================================================
import { PLAN } from "./config.js";
import {
  getDayRecord,
  getDayRecordsRange,
  saveDayRecord,
  getAppearanceChecks,
  setAppearanceCheck
} from "./data.js";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const start = new Date(PLAN.startDate + "T00:00:00");
const end = new Date(start);
end.setDate(end.getDate() + PLAN.totalDays - 1);
const today = new Date();
today.setHours(0, 0, 0, 0);

const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const iso = (d) => d.toISOString().slice(0, 10);
const dayNameOf = (d) => DAY_NAMES[d.getDay()];

const globalError = document.getElementById("globalError");
const globalLoading = document.getElementById("globalLoading");

function showLoading(on) {
  globalLoading.hidden = !on;
}
function showError(msg) {
  globalError.textContent = msg;
  globalError.hidden = false;
  setTimeout(() => { globalError.hidden = true; }, 5000);
}
async function guarded(fn, errMsg) {
  try {
    return await fn();
  } catch (err) {
    console.error(err);
    showError(errMsg || "Something went wrong. Please try again.");
    return null;
  }
}

let user = null;
let rangeCache = new Map();      // dateStr -> row, for the whole 90-day span
let appearanceCache = new Map(); // item_key -> checked

// Small debounce helper for the free-text note field.
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export async function initApp(authedUser) {
  user = authedUser;

  document.getElementById("startLabel").textContent = fmt(start);
  document.getElementById("endLabel").textContent = fmt(end);
  const dayNum = Math.floor((today - start) / 86400000) + 1;
  document.getElementById("dayLabel").textContent =
    dayNum >= 1 && dayNum <= PLAN.totalDays ? dayNum : dayNum < 1 ? "pre-start" : "complete";

  setupNav();

  showLoading(true);
  await guarded(async () => {
    rangeCache = await getDayRecordsRange(user.id, iso(start), iso(end));
    appearanceCache = await getAppearanceChecks(user.id);
  }, "Couldn't load your saved progress.");
  showLoading(false);

  await renderToday();
  renderWeek();
  renderCalendar();
  renderOther();
}

// ---- NAV ------------------------------------------------------------------
function setupNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll("section.view").forEach((v) => v.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("view-" + btn.dataset.view).classList.add("active");
    });
  });
}

// ---- TODAY VIEW -------------------------------------------------------
async function renderToday() {
  const dstr = iso(today);
  const dname = dayNameOf(today);
  const plan = PLAN.week[dname];
  const card = document.getElementById("todayWorkoutCard");

  card.innerHTML = `<p class="muted">Loading today's plan…</p>`;
  const rec = await guarded(() => getDayRecord(user.id, dstr), "Couldn't load today's record.");
  if (!rec) return;

  if (plan.rest) {
    card.innerHTML = `
      <div class="today-focus"><h2>${dname} — ${plan.focus}</h2><span class="tag">${dstr}</span></div>
      <div class="restday"><div class="big">Rest day</div>${plan.note}</div>`;
  } else {
    const rows = plan.exercises.map((ex) => {
      const checked = rec.exercises[ex.name] ? "checked" : "";
      return `<li class="${checked}">
        <input type="checkbox" data-ex="${ex.name}" ${checked}>
        <div class="exname">${ex.name}<small>${ex.note}</small></div>
        <div class="exsr">${ex.sr}</div>
      </li>`;
    }).join("");

    card.innerHTML = `
      <div class="today-focus"><h2>${dname} — ${plan.focus}</h2><span class="tag">${dstr}</span></div>
      <ul class="exlist">${rows}</ul>
      <button class="btn btn-primary btn-block" id="markDoneBtn">
        ${rec.level === 3 ? "Marked as full day ✓" : "Mark today as full workout done"}
      </button>`;

    card.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", async () => {
        rec.exercises[cb.dataset.ex] = cb.checked;
        cb.closest("li").classList.toggle("checked", cb.checked);
        await guarded(
          () => saveDayRecord(user.id, dstr, { exercises: rec.exercises }),
          "Couldn't save that — check your connection."
        );
        rangeCache.set(dstr, { ...(rangeCache.get(dstr) || {}), exercises: rec.exercises, record_date: dstr });
      });
    });

    document.getElementById("markDoneBtn").addEventListener("click", async () => {
      rec.level = rec.level === 3 ? 0 : 3;
      if (rec.level === 3) plan.exercises.forEach((ex) => (rec.exercises[ex.name] = true));
      await guarded(
        () => saveDayRecord(user.id, dstr, { level: rec.level, exercises: rec.exercises }),
        "Couldn't save that — check your connection."
      );
      rangeCache.set(dstr, { ...(rangeCache.get(dstr) || {}), level: rec.level, exercises: rec.exercises, record_date: dstr });
      await renderToday();
      renderCalendar();
    });
  }

  // Nutrition checklist
  const ng = document.getElementById("nutriGrid");
  ng.innerHTML = Object.entries(PLAN.nutrition).map(([block, items]) => {
    const opts = items.map((item) => {
      const key = block + "::" + item;
      const checked = rec.nutrition[key] ? "checked" : "";
      return `<label><input type="checkbox" data-nut="${key}" ${checked}>${item}</label>`;
    }).join("");
    return `<div class="checkblock"><h4>${block}</h4>${opts}</div>`;
  }).join("");

  ng.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", async () => {
      rec.nutrition[cb.dataset.nut] = cb.checked;
      await guarded(
        () => saveDayRecord(user.id, dstr, { nutrition: rec.nutrition }),
        "Couldn't save that — check your connection."
      );
    });
  });

  // Note field (debounced save)
  const noteEl = document.getElementById("dayNote");
  noteEl.value = rec.note || "";
  const saveNote = debounce(async () => {
    await guarded(
      () => saveDayRecord(user.id, dstr, { note: noteEl.value }),
      "Couldn't save your note — check your connection."
    );
  }, 600);
  noteEl.oninput = saveNote;
}

// ---- WEEK VIEW (static reference, no DB calls needed) --------------------
function renderWeek() {
  const wg = document.getElementById("weekGrid");
  wg.innerHTML = WEEK_ORDER.map((dname) => {
    const plan = PLAN.week[dname];
    if (plan.rest) {
      return `<div class="daycard restcard"><h3>${dname}</h3><div class="foc">${plan.focus}</div><p class="muted">${plan.note}</p></div>`;
    }
    const rows = plan.exercises.map((ex) => `<tr><td>${ex.name}</td><td>${ex.sr}</td></tr>`).join("");
    return `<div class="daycard"><h3>${dname}</h3><div class="foc">${plan.focus}</div><table>${rows}</table></div>`;
  }).join("");
}

// ---- PROGRESS / CALENDAR --------------------------------------------------
function renderCalendar() {
  const cal = document.getElementById("calGrid");
  cal.innerHTML = "";
  let loggedCount = 0, sumLevel = 0, trackableDays = 0;

  for (let i = 0; i < PLAN.totalDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dstr = iso(d);
    const dname = dayNameOf(d);
    const isRest = PLAN.week[dname].rest;
    const rec = rangeCache.get(dstr);
    const level = rec ? rec.level : 0;

    const cell = document.createElement("div");
    cell.className =
      "cell" +
      (isRest ? " rest" : level > 0 ? " l" + level : "") +
      (dstr === iso(today) ? " today" : "");
    cell.dataset.d = dstr + (isRest ? " (rest)" : "");

    if (!isRest) {
      trackableDays++;
      if (level > 0) loggedCount++;
      sumLevel += level;
      cell.addEventListener("click", async () => {
        const current = rangeCache.get(dstr) || { record_date: dstr, level: 0, exercises: {}, nutrition: {}, note: "" };
        current.level = (current.level + 1) % 4;
        rangeCache.set(dstr, current);
        renderCalendar();
        await guarded(
          () => saveDayRecord(user.id, dstr, { level: current.level }),
          "Couldn't save that — check your connection."
        );
        if (dstr === iso(today)) renderToday();
      });
    }
    cal.appendChild(cell);
  }

  document.getElementById("statDone").textContent = loggedCount;
  document.getElementById("statPct").textContent =
    trackableDays ? Math.round((sumLevel / (trackableDays * 3)) * 100) + "%" : "0%";

  // Streak: walk backward from today over trackable days until one has level 0.
  let streak = 0;
  let cursor = new Date(today);
  while (cursor >= start) {
    const dname = dayNameOf(cursor);
    if (PLAN.week[dname].rest) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    const rec = rangeCache.get(iso(cursor));
    if (rec && rec.level > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  document.getElementById("statStreak").textContent = streak;
}

// ---- APPEARANCE / CHARACTER VIEW ------------------------------------------
function renderOther() {
  const ag = document.getElementById("appearanceGrid");
  ag.innerHTML = Object.entries(PLAN.appearance).map(([block, items]) => {
    const opts = items.map((item) => {
      const key = block + "::" + item;
      const checked = appearanceCache.get(key) ? "checked" : "";
      return `<label><input type="checkbox" data-app="${key}" ${checked}>${item}</label>`;
    }).join("");
    return `<div class="checkblock"><h4>${block}</h4>${opts}</div>`;
  }).join("");

  ag.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", async () => {
      appearanceCache.set(cb.dataset.app, cb.checked);
      await guarded(
        () => setAppearanceCheck(user.id, cb.dataset.app, cb.checked),
        "Couldn't save that — check your connection."
      );
    });
  });

  document.getElementById("boardTable").innerHTML = `
    <tr><th>Period</th><th>Focus</th><th>Figures</th><th>Input</th></tr>
    ${PLAN.mentalBoard.map((m) => `<tr><td>${m.month}</td><td>${m.focus}</td><td>${m.figures}</td><td>${m.input}</td></tr>`).join("")}
  `;

  document.getElementById("milestoneRow").innerHTML = PLAN.milestones.map(
    (m) => `<div class="mscard"><div class="day">${m.day}</div><p>${m.text}</p></div>`
  ).join("");
}
