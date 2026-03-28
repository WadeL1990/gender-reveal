// app.js
console.log("app.js version = 2026-03-28-auto-reveal");

// ------------------------------
// DOM helpers
// ------------------------------
const $ = (id) => document.getElementById(id);

const phaseLabel = $("phaseLabel");
const phaseScratch = $("phaseScratch");
const phaseVote = $("phaseVote");
const phaseReveal = $("phaseReveal");

const scratchGrid = $("scratchGrid");
const scratchDoneEl = $("scratchDone");
const scratchTotalEl = $("scratchTotal");
const toVoteBtn = $("toVoteBtn");

const voteBoyBtn = $("voteBoy");
const voteGirlBtn = $("voteGirl");
const boyVotesEl = $("boyVotes");
const girlVotesEl = $("girlVotes");
const boyBar = $("boyBar");
const girlBar = $("girlBar");
const voteNote = $("voteNote");

const revealText = $("revealText");

// ------------------------------
// Phase control
// ------------------------------
function showPhase(p) {
  if (phaseScratch) phaseScratch.classList.add("hidden");
  if (phaseVote) phaseVote.classList.add("hidden");
  if (phaseReveal) phaseReveal.classList.add("hidden");

  if (p === "scratch") {
    if (phaseLabel) phaseLabel.textContent = "徵兆刮刮樂";
    if (phaseScratch) phaseScratch.classList.remove("hidden");
  } else if (p === "vote") {
    if (phaseLabel) phaseLabel.textContent = "投票猜測";
    if (phaseVote) phaseVote.classList.remove("hidden");
  } else if (p === "reveal") {
    if (phaseLabel) phaseLabel.textContent = "揭曉";
    if (phaseReveal) phaseReveal.classList.remove("hidden");
  }
}

function showReveal(gender) {
  showPhase("reveal");
  if (revealText) {
    revealText.textContent =
      gender === "boy" ? "是「男生」！💙" : "是「女生」！💗";
  }
}

// 初始畫面
showPhase("scratch");

// ------------------------------
// Scratch cards（第一關）
// ------------------------------
const SIGNS = [
  { title: "肚子尖尖", desc: "民間說法，僅供娛樂", tag: "👦?" },
  { title: "肚子圓圓", desc: "民間說法，僅供娛樂", tag: "👧?" },
  { title: "愛吃酸", desc: "民間說法，僅供娛樂", tag: "?" },
  { title: "孕吐明顯", desc: "民間說法，僅供娛樂", tag: "?" },
  { title: "皮膚變好", desc: "民間說法，僅供娛樂", tag: "?" },
  { title: "皮膚變差", desc: "民間說法，僅供娛樂", tag: "?" },
  { title: "胎動早", desc: "民間說法，僅供娛樂", tag: "?" },
  { title: "手腳水腫", desc: "民間說法，僅供娛樂", tag: "?" },
];

let scratchDoneCount = 0;
const doneFlags = new Array(SIGNS.length).fill(false);

if (scratchTotalEl) scratchTotalEl.textContent = SIGNS.length;

function updateScratchProgress() {
  if (scratchDoneEl) scratchDoneEl.textContent = scratchDoneCount;
  if (toVoteBtn) toVoteBtn.disabled = scratchDoneCount !== SIGNS.length;
}

function renderScratchCards() {
  if (!scratchGrid || !window.ScratchCard) return;

  scratchGrid.innerHTML = "";
  SIGNS.forEach((s, idx) => {
    const card = document.createElement("div");
    card.className = "scratchCard";

    const bg = document.createElement("div");
    bg.className = "scratchBg";
    bg.innerHTML = `<b>${s.title}</b><p>${s.desc}</p>`;

    const overlay = document.createElement("div");
    overlay.className = "scratchOverlay";

    card.appendChild(bg);
    card.appendChild(overlay);
    scratchGrid.appendChild(card);

    const sc = new window.ScratchCard(overlay, {
      scratchType: window.SCRATCH_TYPE.LINE,
      containerWidth: 300,
      containerHeight: 200,
      imageForwardSrc: overlay.toDataURL?.() ?? "",
      percentToFinish: 50,
      callback: () => {
        if (!doneFlags[idx]) {
          doneFlags[idx] = true;
          scratchDoneCount++;
          updateScratchProgress();
        }
      },
    });

    sc.init();
  });

  updateScratchProgress();
}

renderScratchCards();

if (toVoteBtn) {
  toVoteBtn.addEventListener("click", () => showPhase("vote"));
}

// ------------------------------
// Firebase / Firestore
// ------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  increment,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgfPqGcIKyI0iaZ7Cq71Nk5oi1S98u2_k",
  authDomain: "gender-reveal-62aba.firebaseapp.com",
  projectId: "gender-reveal-62aba",
  storageBucket: "gender-reveal-62aba.firebasestorage.app",
  messagingSenderId: "101869590091",
  appId: "1:101869590091:web:3e8f1c87255c30e8741fce",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const revealRef = doc(db, "reveals", "baby-2026");
const VOTED_KEY = "voted-baby-2026";

async function ensureDoc() {
  const snap = await getDoc(revealRef);
  if (!snap.exists()) {
    await setDoc(revealRef, {
      boyVotes: 0,
      girlVotes: 0,
      phase: "vote",
      revealGender: "boy",
    });
  }
}

function updateVoteUI(boy, girl) {
  if (boyVotesEl) boyVotesEl.textContent = boy;
  if (girlVotesEl) girlVotesEl.textContent = girl;

  const total = Math.max(1, boy + girl);
  if (boyBar) boyBar.style.width = `${Math.round((boy / total) * 100)}%`;
  if (girlBar) girlBar.style.width = `${Math.round((girl / total) * 100)}%`;
}

onSnapshot(revealRef, (snap) => {
  if (!snap.exists()) return;
  const data = snap.data();
  updateVoteUI(data.boyVotes ?? 0, data.girlVotes ?? 0);

  if (data.phase === "reveal") {
    showReveal(data.revealGender);
  }
});

// ✅ 關鍵：投票後直接切換 phase
async function castVote(choice) {
  try {
    if (localStorage.getItem(VOTED_KEY)) return;

    if (choice === "boy") {
      await updateDoc(revealRef, { boyVotes: increment(1) });
    } else {
      await updateDoc(revealRef, { girlVotes: increment(1) });
    }

    // ✅ 解法二：自動進入揭曉階段
    await updateDoc(revealRef, { phase: "reveal" });

    localStorage.setItem(VOTED_KEY, choice);
    if (voteNote) voteNote.textContent = "已投票，準備揭曉…";
  } catch (err) {
    console.error(err);
    if (voteNote) voteNote.textContent = "投票失敗：" + err.message;
  }
}

if (voteBoyBtn) voteBoyBtn.addEventListener("click", () => castVote("boy"));
if (voteGirlBtn) voteGirlBtn.addEventListener("click", () => castVote("girl"));

ensureDoc();