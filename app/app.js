// GTA VI trophy tracker, round 2: checklist saved in localStorage, export/import,
// filters by kind and grade, search, spoiler mode, a detail view per trophy with
// a numbered multi-step guide (each step cites its outlet), count trackers for
// the grind trophies, a live citation summary, a Sources tab with a source
// matrix, and a missable tab that groups timing warnings by chapter/stage.
import { renderRoadmap } from "./roadmap.js";

const KEY = "gta6-trophy-checklist";
const SPOILER_KEY = "gta6-trophy-spoiler";
const COUNTER_KEY = "gta6-trophy-counters";
const params = new URLSearchParams(location.search);

const doc = await (await fetch("data/trophies.json")).json();
const trophies = doc.trophies;

// The outlets this guide cites, in the order the Sources tab lists them.
const OUTLETS = ["PowerPyx", "Exophase", "Push Square", "GTABase"];

// Demo seeding for screenshots only: ?earned=5 ticks the first five trophies
// when there is no saved progress yet. Real use never touches this.
let spoiler = localStorage.getItem(SPOILER_KEY) === "on" || params.get("spoiler") === "on";
let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
let counters = JSON.parse(localStorage.getItem(COUNTER_KEY) ?? "{}");
if (earned.size === 0 && params.has("earned")) {
  const n = Math.min(Number(params.get("earned")) || 0, trophies.length);
  earned = new Set(trophies.slice(0, n).map((t) => t.name));
  save();
}

let kindFilter = "all";
let gradeFilter = "all";
let query = "";
let earnedOnly = false;
let selectedId = null;

const listEl = document.getElementById("list");
const detailEl = document.getElementById("detail");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");
const countsEl = document.getElementById("counts");

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
  localStorage.setItem(SPOILER_KEY, spoiler ? "on" : "off");
  localStorage.setItem(COUNTER_KEY, JSON.stringify(counters));
}

function storyHidden(t) {
  return spoiler && t.kind === "story" && !earned.has(t.name);
}

function gradeBadge(t) {
  const s = document.createElement("span");
  s.className = "grade grade-" + t.grade;
  s.textContent = t.grade;
  return s;
}

function kindBadge(t) {
  const s = document.createElement("span");
  s.className = "kind";
  s.textContent = t.kind + (t.missable ? " · missable" : "") + (t.hidden ? " · hidden" : "");
  return s;
}

function counterValue(t) {
  return Math.max(0, Math.min(counters[t.id] ?? 0, t.tracker ? t.tracker.target : 0));
}

function counterRow(t) {
  const wrap = document.createElement("div");
  wrap.className = "counter" + (counterValue(t) >= t.tracker.target ? " done" : "");
  const minus = document.createElement("button");
  minus.type = "button";
  minus.textContent = "−";
  minus.setAttribute("aria-label", "Decrease count for " + t.name);
  minus.addEventListener("click", () => {
    counters[t.id] = Math.max(0, counterValue(t) - 1);
    save();
    render();
  });
  const value = document.createElement("span");
  value.textContent = counterValue(t) + " / " + t.tracker.target + " " + t.tracker.unit;
  const plus = document.createElement("button");
  plus.type = "button";
  plus.textContent = "+";
  plus.setAttribute("aria-label", "Increase count for " + t.name);
  plus.addEventListener("click", () => {
    counters[t.id] = Math.min(t.tracker.target, counterValue(t) + 1);
    save();
    render();
  });
  const label = document.createElement("span");
  label.className = "counter-label";
  label.textContent = t.tracker.label;
  wrap.append(minus, value, plus, label);
  return wrap;
}

function trophyCard(t) {
  const card = document.createElement("article");
  card.className = "card" + (earned.has(t.name) ? " earned" : "");
  card.dataset.id = String(t.id);

  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = earned.has(t.name);
  box.setAttribute("aria-label", "Mark earned: " + t.name);
  box.addEventListener("change", () => {
    if (box.checked) earned.add(t.name);
    else earned.delete(t.name);
    save();
    render();
  });

  const main = document.createElement("div");
  main.className = "card-main";
  const title = document.createElement("h3");
  title.textContent = storyHidden(t) ? "Hidden trophy — earn it to reveal" : t.name;
  const desc = document.createElement("p");
  desc.className = "desc";
  desc.textContent = storyHidden(t)
    ? "A story trophy. Its name and description stay hidden while spoiler mode is on."
    : t.description;
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.append(gradeBadge(t), kindBadge(t));
  const stage = document.createElement("span");
  stage.className = "stage-tag";
  stage.textContent = t.roadmap;
  meta.append(stage);
  main.append(title, desc, meta);
  if (t.tracker && !storyHidden(t)) main.append(counterRow(t));

  const open = document.createElement("button");
  open.type = "button";
  open.className = "guide-btn";
  open.textContent = storyHidden(t) ? "Hidden" : "Guide";
  open.disabled = storyHidden(t);
  open.addEventListener("click", () => {
    selectedId = t.id;
    renderDetail();
    detailEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  card.append(box, main, open);
  return card;
}

function renderDetail() {
  detailEl.replaceChildren();
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) return;
  const panel = document.createElement("section");
  panel.className = "detail-panel";
  const head = document.createElement("h2");
  head.textContent = t.name;
  const sub = document.createElement("p");
  sub.className = "desc";
  sub.textContent = t.description + " — " + t.grade + " trophy.";
  const flags = document.createElement("p");
  flags.className = "flags";
  flags.textContent =
    "Roadmap: " + t.roadmap +
    " · Kind: " + t.kind +
    " · Missable: " + (t.missable ? "YES — see the guide" : "No") +
    " · Hidden on PlayStation: " + (t.hidden ? "Yes" : "No");
  const guideHead = document.createElement("h3");
  guideHead.textContent = "How to get it";
  const steps = document.createElement("ol");
  steps.className = "step-list";
  for (const s of t.steps || []) {
    const li = document.createElement("li");
    li.textContent = s.text;
    const src = document.createElement("span");
    src.className = "step-sources";
    src.textContent = "Source: " + (s.sources || []).join(", ");
    if (s.unconfirmed) {
      const flag = document.createElement("span");
      flag.className = "unconfirmed";
      flag.textContent = " · Unconfirmed — the source lists this as not yet confirmed";
      src.append(flag);
    }
    li.append(src);
    steps.append(li);
  }
  if (!t.steps || t.steps.length === 0) {
    const fallback = document.createElement("p");
    fallback.className = "guide-text";
    fallback.textContent = t.guide;
    panel.append(head, sub, flags, guideHead, fallback);
  } else {
    panel.append(head, sub, flags, guideHead, steps);
  }
  if (t.tracker) {
    const counterHead = document.createElement("h3");
    counterHead.textContent = "Count tracker";
    panel.append(counterHead, counterRow(t));
    if (counterValue(t) >= t.tracker.target) {
      const note = document.createElement("p");
      note.className = "reached-note";
      note.textContent = "✓ Target reached — the trophy should pop; tick it earned when it does.";
      panel.append(note);
    }
  }
  const srcHead = document.createElement("h3");
  srcHead.textContent = "Sources";
  const srcList = document.createElement("ul");
  srcList.className = "sources";
  for (const s of t.sources || []) {
    const li = document.createElement("li");
    if (s.url) {
      const a = document.createElement("a");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = s.name;
      li.append(a);
    } else {
      li.textContent = s.name;
    }
    srcList.append(li);
  }
  const close = document.createElement("button");
  close.type = "button";
  close.className = "guide-btn";
  close.textContent = "Close guide";
  close.addEventListener("click", () => {
    selectedId = null;
    renderDetail();
  });
  panel.append(srcHead, srcList, close);
  detailEl.append(panel);
}

function visibleTrophies() {
  return trophies.filter((t) => {
    if (kindFilter !== "all" && t.kind !== kindFilter) return false;
    if (gradeFilter !== "all" && t.grade !== gradeFilter) return false;
    if (earnedOnly && !earned.has(t.name)) return false;
    if (query) {
      const stepsText = (t.steps || []).map((s) => s.text).join(" ");
      const hay = (t.name + " " + t.description + " " + t.guide + " " + stepsText).toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

function renderCounts() {
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { total: 0, done: 0 };
    byGrade[t.grade].total += 1;
    if (earned.has(t.name)) byGrade[t.grade].done += 1;
  }
  countsEl.replaceChildren();
  for (const g of ["platinum", "gold", "silver", "bronze"]) {
    const c = byGrade[g];
    if (!c) continue;
    const chip = document.createElement("span");
    chip.className = "count-chip";
    chip.textContent = g + ": " + c.done + "/" + c.total;
    countsEl.append(chip);
  }
  const miss = trophies.filter((t) => t.missable && !earned.has(t.name)).length;
  const warn = document.createElement("span");
  warn.className = "count-chip warn";
  warn.textContent = miss > 0 ? "⚠ 1 missable trophy not yet earned" : "✓ missable trophy earned";
  countsEl.append(warn);
  const tracked = trophies.filter((t) => t.tracker);
  const trackedDone = tracked.filter((t) => counterValue(t) >= t.tracker.target).length;
  const trackChip = document.createElement("span");
  trackChip.className = "count-chip";
  trackChip.textContent = "count trackers at target: " + trackedDone + "/" + tracked.length;
  countsEl.append(trackChip);
}

// Live citation coverage, computed from the guide data itself: total cited
// steps, steps backed by two or more outlets, and distinct outlets cited.
function citationStats() {
  let total = 0;
  let backed = 0;
  const outlets = new Set();
  for (const t of trophies) {
    for (const s of t.steps || []) {
      total += 1;
      const srcs = s.sources || [];
      for (const o of srcs) outlets.add(o);
      if (srcs.length >= 2) backed += 1;
    }
  }
  return { total, backed, outlets: [...outlets] };
}

function renderCiteStats() {
  const el = document.getElementById("cite-stats");
  if (!el) return;
  const { total, backed, outlets } = citationStats();
  el.replaceChildren();
  const chips = [
    total + " cited guide steps",
    backed + " backed by 2+ sources",
    outlets.length + " outlets cited",
  ];
  for (const text of chips) {
    const chip = document.createElement("span");
    chip.className = "cite-chip";
    const [num, ...rest] = text.split(" ");
    const b = document.createElement("b");
    b.textContent = num;
    chip.append(b, document.createTextNode(" " + rest.join(" ")));
    el.append(chip);
  }
}

function renderSourcesTab() {
  const summaryEl = document.getElementById("sources-summary");
  const matrixEl = document.getElementById("sources-matrix");
  if (!summaryEl || !matrixEl) return;
  const { total, backed, outlets } = citationStats();
  summaryEl.replaceChildren();
  const summary = document.createElement("div");
  summary.className = "source-summary";
  const perOutlet = OUTLETS.map((o) => {
    const n = trophies.filter((t) => (t.steps || []).some((s) => (s.sources || []).includes(o))).length;
    return { outlet: o, trophies: n };
  });
  const chips = [
    "Total cited steps: " + total,
    "Steps backed by 2+ sources: " + backed,
    "Outlets: " + outlets.length,
    ...perOutlet.map((p) => p.outlet + " covers " + p.trophies + " trophies"),
  ];
  for (const text of chips) {
    const chip = document.createElement("span");
    chip.className = "source-chip";
    chip.textContent = text;
    summary.append(chip);
  }
  summaryEl.append(summary);

  const table = document.createElement("table");
  const head = document.createElement("tr");
  for (const h of ["Trophy", ...OUTLETS, "Steps"]) {
    const th = document.createElement("th");
    th.textContent = h;
    head.append(th);
  }
  table.append(head);
  for (const t of trophies) {
    const tr = document.createElement("tr");
    const name = document.createElement("td");
    name.textContent = t.name;
    tr.append(name);
    for (const o of OUTLETS) {
      const td = document.createElement("td");
      const cited = (t.steps || []).some((s) => (s.sources || []).includes(o));
      td.className = cited ? "tick" : "miss";
      td.textContent = cited ? "✓" : "—";
      tr.append(td);
    }
    const count = document.createElement("td");
    count.className = "count";
    count.textContent = String((t.steps || []).length);
    tr.append(count);
    table.append(tr);
  }
  const wrap = document.createElement("div");
  wrap.className = "matrix";
  wrap.append(table);
  matrixEl.replaceChildren(wrap);
}

// Timing warnings grouped by chapter/stage. Only one trophy is missable, but
// several others only unlock in a given chapter, so each group says when its
// trophies open and whether they stay available afterwards.
const TIMING_GROUPS = [
  {
    title: "⚠ Chapter 1 — do it now or lose it",
    note: "The one possibly missable trophy. Keep a manual save from the start of Chapter 1.",
    ids: [28],
    risk: true,
  },
  {
    title: "Chapter 1 unlocks",
    note: "Questlines and activities that open in Chapter 1 and stay available after the story.",
    ids: [2, 3, 20, 21, 23],
    risk: false,
  },
  {
    title: "Chapter 2 unlocks",
    note: "Opens after Coffee Break: two characters together, garages, the Scooter Bros app.",
    ids: [4, 8, 24, 29, 46, 54, 55],
    risk: false,
  },
  {
    title: "Chapter 3 unlocks",
    note: "Jewelry robberies, the Snap Gun and the Key Cloner all open here.",
    ids: [5, 9, 22, 26, 27, 34, 39, 45],
    risk: false,
  },
  {
    title: "Chapter 4 unlocks",
    note: "Bank vaults and the armored truck open with That's Where The Money Is.",
    ids: [6, 10, 11, 12, 40, 41],
    risk: false,
  },
  {
    title: "Chapter 5 and the finale",
    note: "The last story trophies; nothing here is missable.",
    ids: [13, 7],
    risk: false,
  },
  {
    title: "Any time — free-roam cleanup",
    note: "No chapter lock. Most of the grind lives here; do it after the story.",
    ids: [14, 15, 16, 17, 18, 19, 25, 30, 31, 32, 35, 36, 37, 38, 42, 43, 44, 47, 48, 49, 50, 51, 52, 53],
    risk: false,
  },
];

function renderMissableTab() {
  const missList = document.getElementById("missable-list");
  if (!missList) return;
  missList.replaceChildren();
  const miss = trophies.find((t) => t.missable);
  const missCard = document.createElement("article");
  missCard.className = "card missable-card";
  const missTitle = document.createElement("h3");
  missTitle.textContent = "⚠ " + miss.name + " — the only possibly missable trophy";
  const missGuide = document.createElement("p");
  missGuide.className = "guide-text";
  missGuide.textContent = miss.guide;
  const missNote = document.createElement("p");
  missNote.textContent = "Every other trophy can be earned after the story in free-roam: there is no mission replay, but nothing else is locked by story progress. Keep a manual save at the start of each chapter (15 manual save slots) as a safety net.";
  missCard.append(missTitle, missGuide, missNote);
  missList.append(missCard);

  const grid = document.createElement("div");
  grid.className = "timing-grid";
  const byId = new Map(trophies.map((t) => [t.id, t]));
  for (const group of TIMING_GROUPS) {
    const card = document.createElement("section");
    card.className = "timing-group" + (group.risk ? " risk" : "");
    const head = document.createElement("h3");
    head.textContent = group.title;
    const note = document.createElement("p");
    note.className = "timing-note";
    note.textContent = group.note;
    const list = document.createElement("ul");
    for (const id of group.ids) {
      const t = byId.get(id);
      if (!t) continue;
      const li = document.createElement("li");
      li.textContent = (earned.has(t.name) ? "✓ " : "○ ") + t.name + " — " + t.grade + (t.missable ? " · missable" : "");
      list.append(li);
    }
    card.append(head, note, list);
    grid.append(card);
  }
  missList.append(grid);
}

function render() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  for (const t of shown) listEl.append(trophyCard(t));
  const empty = document.createElement("p");
  empty.className = "empty";
  empty.textContent = shown.length === 0
    ? "No trophies match these filters."
    : "Showing " + shown.length + " of " + trophies.length + " trophies.";
  listEl.append(empty);
  const pct = Math.round((earned.size / trophies.length) * 100);
  progressText.textContent = earned.size + " of " + trophies.length + " earned — " + pct + "% to platinum";
  progressFill.style.width = pct + "%";
  document.getElementById("spoiler-toggle").checked = spoiler;
  renderCounts();
  renderDetail();
}

function showTab(name) {
  for (const tab of document.querySelectorAll(".tab")) {
    tab.classList.toggle("active", tab.dataset.tab === name);
  }
  for (const pane of document.querySelectorAll(".pane")) {
    pane.classList.toggle("active", pane.id === "pane-" + name);
  }
}

document.getElementById("kind").addEventListener("change", (e) => {
  kindFilter = e.target.value;
  render();
});
document.getElementById("grade").addEventListener("change", (e) => {
  gradeFilter = e.target.value;
  render();
});
document.getElementById("search").addEventListener("input", (e) => {
  query = e.target.value.trim().toLowerCase();
  render();
});
document.getElementById("earned-only").addEventListener("change", (e) => {
  earnedOnly = e.target.checked;
  render();
});
document.getElementById("spoiler-toggle").addEventListener("change", (e) => {
  spoiler = e.target.checked;
  save();
  render();
});
document.getElementById("export").addEventListener("click", () => {
  const payload = { game: "Grand Theft Auto VI", exportedAt: new Date().toISOString(), earned: [...earned], counters };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  a.download = "gta6-trophy-progress.json";
  a.click();
});
document.getElementById("import").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set((names || []).filter((n) => known.has(n)));
    if (data.counters) {
      counters = {};
      for (const [id, value] of Object.entries(data.counters)) {
        const t = trophies.find((x) => x.id === Number(id));
        if (t && t.tracker) counters[Number(id)] = Math.max(0, Math.min(Number(value) || 0, t.tracker.target));
      }
    }
    save();
    render();
  } catch {
    alert("That file is not a valid trophy progress export.");
  }
  e.target.value = "";
});
document.getElementById("reset").addEventListener("click", () => {
  if (confirm("Clear all earned trophies?")) {
    earned = new Set();
    counters = {};
    save();
    render();
  }
});
for (const tab of document.querySelectorAll(".tab")) {
  tab.addEventListener("click", () => showTab(tab.dataset.tab));
}

document.getElementById("pane-roadmap").append(renderRoadmap(trophies, earned));
renderMissableTab();
renderSourcesTab();
renderCiteStats();

// Screenshot entry points: ?shot=roadmap, ?shot=missable, ?shot=sources,
// ?shot=detail&id=28
const shot = params.get("shot");
if (shot === "roadmap") showTab("roadmap");
else if (shot === "missable") showTab("missable");
else if (shot === "sources") showTab("sources");
if (params.get("id")) {
  selectedId = Number(params.get("id"));
  showTab("tracker");
}

render();
