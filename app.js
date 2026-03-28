// app.js (ES Module)
// index.html 必須用：<script type="module" src="./app.js"></script>
// 並且要先載入 ScratchCard：<script src="./vendor/scratchcard.min.js"></script>

console.log("app.js version = 2026-03-28-2");

// ------------------------------
// 0) DOM helpers
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
// 1) Phase control
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
  const isBoy = gender === "boy";
  if (revealText) revealText.textContent = isBoy ? "是「男生」！💙" : "是「女生」！💗";
}

// 初始畫面
showPhase("scratch");

// ------------------------------
// 2) Scratch cards (Stage 1)
// ------------------------------
const SIGNS = [
  { title: "肚子尖尖", desc: "民間說法：肚型比較尖，大家就愛猜「男寶」", tag: "趣味偏向：👦" },
  { title: "肚子圓圓", desc: "民間說法：肚型比較圓，大家就愛猜「女寶」", tag: "趣味偏向：👧" },
  { title: "愛吃酸？", desc: "有人說愛吃酸偏男，也有人說只是口味改變 😆", tag: "趣味偏向：不一定" },
  { title: "孕吐嚴重", desc: "有人說吐得很厲害偏女，但每個人體質差很多", tag: "趣味偏向：不一定" },
  { title: "皮膚變好", desc: "有人說氣色變好偏男；也有人說是保養變勤勞", tag: "趣味偏向：不一定" },
  { title: "皮膚變差", desc: "有人說長痘偏女；也有人說荷爾蒙波動而已", tag: "趣味偏向：不一定" },
  { title: "胎動很早", desc: "傳說胎動早偏男，但真的就是傳說～", tag: "趣味偏向：不一定" },
  { title: "手腳浮腫", desc: "民俗也有各種說法，最重要是好好休息", tag: "趣味偏向：不一定" },
];

let scratchDoneCount = 0;
const doneFlags = new Array(SIGNS.length).fill(false);

if (scratchTotalEl) scratchTotalEl.textContent = String(SIGNS.length);

function updateScratchProgress() {
  if (scratchDoneEl) scratchDoneEl.textContent = String(scratchDoneCount);
  const allDone = scratchDoneCount === SIGNS.length;
  if (toVoteBtn) toVoteBtn.disabled = !allDone;
}

function makeCoverDataUrl(w = 600, h = 360) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#b7c2d8";
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = i % 2 ? "#ffffff" : "#6b7896";
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 6 + Math.random() * 26;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(17,26,46,.65)";
  ctx.font = "900 64px system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("刮開看看", w / 2, h / 2 + 18);

  return c.toDataURL("image/png");
}

function renderScratchCards() {
  if (!scratchGrid) return;

  scratchGrid.innerHTML = "";
  const coverDataUrl = makeCoverDataUrl();

  if (!window.ScratchCard || !window.SCRATCH_TYPE) {
    console.error("ScratchCard library not loaded. Check ./vendor/scratchcard.min.js");
    return;
  }

  SIGNS.forEach((s, idx) => {
    const card = document.createElement("div");
    card.className = "scratchCard";

    const bg = document.createElement("div");
    bg.className = "scratchBg";
    bg.innerHTML = `
      <div class="title">${s.title}</div>
      <div class="desc">${s.desc}</div>
      <div class="tag">${s.tag}（僅供娛樂）</div>
    `;

    const overlay = document.createElement("div");
    overlay.className = "scratchOverlay";
    overlay.id = `sc-${idx}`;

    card.appendChild(bg);
    card.appendChild(overlay);
    scratchGrid.appendChild(card);

    const sc = new window.ScratchCard(overlay, {
      scratchType: window.SCRATCH_TYPE.LINE,
      containerWidth: overlay.clientWidth,
      containerHeight: overlay.clientHeight,
      imageForwardSrc: coverDataUrl,
      imageBackgroundSrc: "",
      htmlBackground: "",
      clearZoneRadius: 26,
      enabledPercentUpdate: true,
      percentToFinish: 55,
      callback: function () {
        if (!doneFlags[idx]) {
          doneFlags[idx] = true;
          scratchDoneCount++;
          updateScratchProgress();
        }
      },
    });

    sc.init().catch((err) => console.error("Scratch init error", err));
  });

  updateScratchProgress();
}

renderScratchCards();
updateScratchProgress();

if (toVoteBtn) {
  toVoteBtn.addEventListener("click", () => showPhase("vote"));
}

// ------------------------------
// 3) Firebase / Firestore (Stage 2 + Stage 3 control)
// ------------------------------
// ✅ 依照 Firebase Console「Use a <script> tag」(CDN) 建議的 modular imports
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

// ✅ 你提供的 firebaseConfig（原封不動）
const firebaseConfig = {
  apiKey: "AIzaSyAgfPqGcIKyI0iaZ7Cq71Nk5oi1S98u2_k",
  authDomain: "gender-reveal-62aba.firebaseapp.com",
  projectId: "gender-reveal-62aba",
  storageBucket: "gender-reveal-62aba.firebasestorage.app",
  messagingSenderId: "101869590091",
  appId: "1:101869590091:web:3e8f1c87255c30e8741fce",
  measurementId: "G-3ERELW3XR0",
};

// ✅ 防呆：立刻印出 projectId（如果這裡是 undefined 就代表你載到舊版檔案或被覆蓋）
console.log("[Firebase] projectId =", firebaseConfig.projectId);

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// 你投票文件位置（可改 id）
const REVEAL_DOC_PATH = { col: "reveals", id: "baby-2026" };
const revealRef = doc(db, REVEAL_DOC_PATH.col, REVEAL_DOC_PATH.id);
const VOTED_KEY = `revealVoted:${REVEAL_DOC_PATH.id}`;

async function ensureRevealDoc() {
  const snap = await getDoc(revealRef);
  if (!snap.exists()) {
    await setDoc(revealRef, {
      boyVotes: 0,
      girlVotes: 0,
      phase: "vote",        // "vote" or "reveal"
      revealGender: "boy",  // "boy" or "girl"
    });
  }
}

function updateVoteUI(boy, girl) {
  if (boyVotesEl) boyVotesEl.textContent = String(boy);
  if (girlVotesEl) girlVotesEl.textContent = String(girl);

  const total = Math.max(1, boy + girl);
  const boyPct = Math.round((boy / total) * 100);
  const girlPct = 100 - boyPct;

  if (boyBar) boyBar.style.width = `${boyPct}%`;
  if (girlBar) girlBar.style.width = `${girlPct}%`;

  const voted = localStorage.getItem(VOTED_KEY);
  if (voted) {
    if (voteBoyBtn) voteBoyBtn.disabled = true;
    if (voteGirlBtn) voteGirlBtn.disabled = true;
    if (voteNote) voteNote.textContent = `你已投票：${voted === "boy" ? "男生" : "女生"}（等待揭曉）`;
  }
}

function startRevealListener() {
  onSnapshot(
    revealRef,
    (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      updateVoteUI(data.boyVotes ?? 0, data.girlVotes ?? 0);

      if (data.phase === "reveal") {
        showReveal(data.revealGender);
      }
    },
    (err) => {
      console.error(err);
      if (voteNote) voteNote.textContent = "Firestore 監聽失敗：" + (err?.message ?? err);
    }
  );
}

async function castVote(choice) {
  try {
    const voted = localStorage.getItem(VOTED_KEY);
    if (voted) return;

    if (choice === "boy") {
      await updateDoc(revealRef, { boyVotes: increment(1) });
    } else {
      await updateDoc(revealRef, { girlVotes: increment(1) });
    }

    localStorage.setItem(VOTED_KEY, choice);

    if (voteBoyBtn) voteBoyBtn.disabled = true;
    if (voteGirlBtn) voteGirlBtn.disabled = true;
    if (voteNote) voteNote.textContent = `你已投票：${choice === "boy" ? "男生" : "女生"}（等待揭曉）`;
  } catch (err) {
    console.error(err);
    if (voteNote) voteNote.textContent = "投票失敗：" + (err?.message ?? err);
  }
}

function bindVoteButtons() {
  if (voteBoyBtn) voteBoyBtn.addEventListener("click", () => castVote("boy"));
  if (voteGirlBtn) voteGirlBtn.addEventListener("click", () => castVote("girl"));
}

// ------------------------------
// 4) Boot Firestore
// ------------------------------
(async function bootFirestore() {
  try {
    if (voteNote) voteNote.textContent = "Firestore 連線中…";
    await ensureRevealDoc();
    startRevealListener();
    bindVoteButtons();
    if (voteNote) voteNote.textContent = "Firestore 已連線，請投票～";
  } catch (err) {
    console.error(err);
    if (voteNote) voteNote.textContent =
      "Firestore 初始化失敗：" + (err?.message ?? err) +
      "（請確認 Firestore Database 已建立＆Rules 允許）";
  }
})();