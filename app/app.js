// GTA VI trophy tracker: checklist saved in localStorage, export/import,
// filters by kind and grade, search, spoiler mode, and a detail view per trophy.
import { renderRoadmap } from "./roadmap.js";

const KEY = "gta6-trophy-checklist";
const SPOILER_KEY = "gta6-trophy-spoiler";
const params = new URLSearchParams(location.search);

const doc = await (await fetch("data/trophies.json")).json();
const trophies = doc.trophies;

// Demo seeding for screenshots only: ?earned=5 ticks the first five trophies
// when there is no saved progress yet. Real use never touches this.
let spoiler = localStorage.getItem(SPOILER_KEY) === "on" || params.get("spoiler") === "on";
let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
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
  const guide = document.createElement("p");
  guide.className = "guide-text";
  guide.textContent = t.guide;
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
  panel.append(head, sub, flags, guideHead, guide, srcHead, srcList, close);
  detailEl.append(panel);
}

function visibleTrophies() {
  return trophies.filter((t) => {
    if (kindFilter !== "all" && t.kind !== kindFilter) return false;
    if (gradeFilter !== "all" && t.grade !== gradeFilter) return false;
    if (earnedOnly && !earned.has(t.name)) return false;
    if (query) {
      const hay = (t.name + " " + t.description + " " + t.guide).toLowerCase();
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
  const payload = { game: "Grand Theft Auto VI", exportedAt: new Date().toISOString(), earned: [...earned] };
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
    save();
    render();
  }
});
for (const tab of document.querySelectorAll(".tab")) {
  tab.addEventListener("click", () => showTab(tab.dataset.tab));
}

document.getElementById("pane-roadmap").append(renderRoadmap(trophies, earned));

const missList = document.getElementById("missable-list");
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

// Screenshot entry points: ?shot=roadmap, ?shot=missable, ?shot=detail&id=28
const shot = params.get("shot");
if (shot === "roadmap") showTab("roadmap");
else if (shot === "missable") showTab("missable");
if (params.get("id")) {
  selectedId = Number(params.get("id"));
  showTab("tracker");
}

render();
