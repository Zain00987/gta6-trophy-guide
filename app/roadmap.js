// The road to the platinum, in the order PowerPyx's roadmap lays it out:
// story first, then the 100% checklist, then strangers and cleanup.
// Counts and chapter facts come from the official trophy descriptions.
export const ROADMAP = [
  {
    stage: "Stage 1 — Play the story (60–80 hours)",
    time: "Chapters 1–5",
    trophyIds: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    text: "Finish all five chapters. Twelve trophies pop automatically from missions and chapter endings: Gone Fishing, the four chapter trophies, the final mission, and Breakfast Run, The Cartel Heist, Child's Play, Headliners, VCIA Takedown and Operation Savage Glory. There are no mission medals and no mission replay, so keep a manual save at the start of each chapter. Do side content as it appears — progress already counts toward the 100% checklist."
  },
  {
    stage: "Stage 1 warning — the one missable trophy",
    time: "Chapter 1 only",
    trophyIds: [28],
    text: "Positive Mental Attitude is the only trophy reported as possibly missable. In Chapter 1, after the mission Down to Earth, talk to Lucia in the kitchen in the morning: she says she is going to meditate and walks to the balcony. Follow her and choose Accept. PowerPyx says it is still unconfirmed whether this meditation is required, so do it anyway and keep a Chapter 1 save."
  },
  {
    stage: "Stage 2 — Side questlines (during the story)",
    time: "Chapters 1–4",
    trophyIds: [22, 23, 24, 26, 27, 29, 25],
    text: "Finish the optional questlines as they are marked: Kenton in Chapter 1, Billy in Chapter 2, Andy and Randy and Tyrone in Chapter 3, and Bret after Chapter 2. Their final missions each carry a trophy, and Strangers & Freaks wants 8 stranger strands. Every quest giver stays available after the story, so nothing here locks you out."
  },
  {
    stage: "Stage 3 — Activities, races and collectibles",
    time: "Any time, best in free-roam",
    trophyIds: [15, 16, 17, 18, 19, 20, 21, 30, 31, 35],
    text: "Grind the counted activities: 250 of 397 stunts, gold in all 42 Shooting Range challenges, a Top Fun drone win at all 14 locations, 20 different race wins, the fishing challenge against Cal, one arcade game, 3 card sets, 100 WAiNK scans and 100 vehicles discovered. The 100% checklist wants more of most of these, so keep going past the trophy counts."
  },
  {
    stage: "Stage 4 — Robberies, crime and money",
    time: "Chapters 3–4, then free-roam",
    trophyIds: [33, 34, 36, 37, 38, 39, 40, 41, 43, 52, 53, 54, 55],
    text: "Unlock the robbery systems in order: Yasmani's Jewelry Jobs in Chapter 3 opens jewelry robberies and the Snap Gun; That's Where The Money Is in Chapter 4 opens bank vaults and counts as the armored truck. Then rob 5 vaults, one illegal operation per gang (9 gangs, 39 operations), launder $250,000 in marked bills, spend $100,000, buy the 8 garages and register 10 vehicles."
  },
  {
    stage: "Stage 5 — One-off moments",
    time: "Any time after the unlocks",
    trophyIds: [44, 45, 46, 47, 48, 49, 50, 51],
    text: "Eight hidden one-off trophies: a cocktail on Ocean Beach, the blue Banshee through the showroom window, the three valuables at Kingpin Bowling, maximum strength on both characters, 500 criminal-profile actions, and the UFO easter egg. Two are still unconfirmed by the sources (Bad Luck, I Guess and Ten Pin) — this guide says so rather than guessing."
  },
  {
    stage: "Stage 6 — 100% completion and the platinum",
    time: "About 100 hours after the story",
    trophyIds: [14, 32, 42, 1],
    text: "After the story, open Progress, Stats, 100% Completion and work the checklist: it is about 60% of everything in the game — any 200 of 277 vehicles, any 100 of 255 animals, any 70 of 80 challenges, any 100 optional missions. Nothing on it is missable. A Long Road (gold) pops at 100%, and Vice Got a Price! (platinum) follows once the last trophy lands. Total time to platinum: about 200 hours (PowerPyx), up to 300 hours (Push Square)."
  }
];

export function renderRoadmap(trophies, earned) {
  const byId = new Map(trophies.map((t) => [t.id, t]));
  const wrap = document.createElement("div");
  wrap.className = "roadmap";
  for (const step of ROADMAP) {
    const card = document.createElement("section");
    card.className = "stage";
    const head = document.createElement("h3");
    head.textContent = step.stage;
    const when = document.createElement("p");
    when.className = "stage-time";
    when.textContent = step.time;
    const body = document.createElement("p");
    body.textContent = step.text;
    const list = document.createElement("ul");
    list.className = "stage-trophies";
    for (const id of step.trophyIds) {
      const t = byId.get(id);
      if (!t) continue;
      const li = document.createElement("li");
      li.textContent = (earned.has(t.name) ? "✓ " : "○ ") + t.name + " — " + t.grade;
      if (earned.has(t.name)) li.className = "done";
      list.append(li);
    }
    card.append(head, when, body, list);
    wrap.append(card);
  }
  return wrap;
}
