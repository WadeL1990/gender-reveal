// app.js (ES Module) — Refresh always restarts from scratch.
// Requirements:
// 1) index.html must load ScratchCard first: <script src="./vendor/scratchcard.min.js"></script>
// 2) then load this file as module: <script type="module" src="./app.js"></script>

console.log("app.js version = 2026-03-28-refresh-reset");

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

const babyImg = $("babyImg");
const revealText = $("revealText");

// ------------------------------
// 1) Local UI state — refresh always resets
// ------------------------------
let votedThisRun = false; // Only prevents double-click in the same page run. Refresh resets it.
let cachedRevealGender = "girl"; // Default / main architecture = girl

function showPhase(p) {
  // hide all
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

// Always start from scratch on refresh
showPhase("scratch");

// ------------------------------
// 2) Scratch cards (Stage 1)
// ------------------------------
const SIGNS = [
  { title: "肚子形狀", desc: "肚型較尖, 可能是「男寶」特徵", tag: "Care 1" },
  { title: "飲食口味", desc: "愛吃酸的, 不愛吃辣的, 可能是「男寶」特徵", tag: "Care 2" },
  { title: "皮膚狀況", desc: "沒長痘痘, 皮膚也沒變差, 可能是「女寶」特徵", tag: "Care 3" },
  { title: "寶寶心跳", desc: "寶寶心跳快,可能傳是「女寶」特徵", tag: "Care 4" },
  ];

let scratchDoneCount = 0;
const doneFlags = new Array(SIGNS.length).fill(false);

if (scratchTotalEl) scratchTotalEl.textContent = String(SIGNS.length);

function updateScratchProgress() {
  if (scratchDoneEl) scratchDoneEl.textContent = String(scratchDoneCount);
  if (toVoteBtn) toVoteBtn.disabled = scratchDoneCount !== SIGNS.length;
}

function makeCoverDataUrl(label, w = 600, h = 360) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  // 背景底色
  ctx.fillStyle = "#b7c2d8";
  ctx.fillRect(0, 0, w, h);

  // 紋理（跟你原本一樣）
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

  // 字樣顏色
  ctx.fillStyle = "rgba(17,26,46,.75)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 讓文字自動縮放以塞進卡片
  const text = String(label ?? "").trim() || "刮開看看";
  const maxWidth = w * 0.86;

  // 先用較大的字試，太寬就縮小
  let fontSize = 64;
  ctx.font = `900 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && fontSize > 28) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC, sans-serif`;
  }

  // 若仍太長（例如很多字），就簡單換兩行（依空白/標點拆）
  const tooLong = ctx.measureText(text).width > maxWidth;
  if (!tooLong) {
    ctx.fillText(text, w / 2, h / 2);
  } else {
    // 很簡單的兩行切分：中間切一刀（你可自行更精緻）
    const mid = Math.floor(text.length / 2);
    const line1 = text.slice(0, mid);
    const line2 = text.slice(mid);

    ctx.fillText(line1, w / 2, h / 2 - fontSize * 0.55);
    ctx.fillText(line2, w / 2, h / 2 + fontSize * 0.55);
  }

  // 小提示（可選）
  ctx.globalAlpha = 0.9;
  ctx.font = `700 18px system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC, sans-serif`;
  ctx.fillText("用手指刮開", w / 2, h * 0.82);
  ctx.globalAlpha = 1;

  return c.toDataURL("image/png");
}


function renderScratchCards() {
  if (!scratchGrid) return;

  scratchGrid.innerHTML = "";

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
    <div class="tag">${s.tag} (僅供參考) </div>
  `;

  const overlay = document.createElement("div");
  overlay.className = "scratchOverlay";
  overlay.id = `sc-${idx}`;

  card.appendChild(bg);
  card.appendChild(overlay);
  scratchGrid.appendChild(card);

  // ✅ 每張卡用自己的 title 生成專屬封面
  const w = overlay.clientWidth || 600;
  const h = overlay.clientHeight || 360;
  const coverDataUrl = makeCoverDataUrl(s.title, 600, 360); 
  // ↑ 你也可以用 (w*2, h*2) 讓 retina 更清晰，例如 makeCoverDataUrl(s.title, w*2, h*2)

  const sc = new window.ScratchCard(overlay, {
    scratchType: window.SCRATCH_TYPE.LINE,
    containerWidth: w,
    containerHeight: h,
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
  toVoteBtn.addEventListener("click", () => {
    showPhase("vote");
  });
}

// ------------------------------
// 3) Firebase / Firestore (CDN v12.11.0)
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
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgfPqGcIKyI0iaZ7Cq71Nk5oi1S98u2_k",
  authDomain: "gender-reveal-62aba.firebaseapp.com",
  projectId: "gender-reveal-62aba",
  storageBucket: "gender-reveal-62aba.firebasestorage.app",
  messagingSenderId: "101869590091",
  appId: "1:101869590091:web:3e8f1c87255c30e8741fce",
  measurementId: "G-3ERELW3XR0",
};

console.log("[Firebase] projectId =", firebaseConfig.projectId);

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Firestore doc path
const REVEAL_DOC_ID = "baby-2026";
const revealRef = doc(db, "reveals", REVEAL_DOC_ID);

// Ensure doc exists; default revealGender = girl (main architecture)
async function ensureRevealDoc() {
  const snap = await getDoc(revealRef);
  if (!snap.exists()) {
    await setDoc(revealRef, {
      boyVotes: 0,
      girlVotes: 0,
      // You control this in Firebase Console; default is girl
      revealGender: "girl",
      updatedAt: serverTimestamp(),
    });
  }
}

// Normalize gender values (supports boy/girl, male/female, zh)
function normalizeGender(v) {
  const s = String(v || "").toLowerCase().trim();
  if (["girl", "female", "f", "女生", "女", "女兒"].includes(s)) return "girl";
  if (["boy", "male", "m", "男生", "男", "兒子"].includes(s)) return "boy";
  // Default to girl as requested
  return "girl";
}

function updateVoteUI(boy, girl) {
  if (boyVotesEl) boyVotesEl.textContent = String(boy);
  if (girlVotesEl) girlVotesEl.textContent = String(girl);

  const total = Math.max(1, boy + girl);
  const boyPct = Math.round((boy / total) * 100);
  const girlPct = 100 - boyPct;

  if (boyBar) boyBar.style.width = `${boyPct}%`;
  if (girlBar) girlBar.style.width = `${girlPct}%`;
}

// Reveal UI (only local navigation; refresh always starts from scratch)
function renderRevealUI(gender) {
  const g = normalizeGender(gender);
  cachedRevealGender = g;

  if (revealText) {
    revealText.textContent = g === "girl" ? "是「女寶」！💗" : "是「男生」！💙";
  }

  // Optional: swap image if you later prepare two assets
  if (babyImg) babyImg.src = "./assets/baby.jpg";
}

// Listener: ONLY updates counts + cached revealGender (DO NOT jump phases)
function startRevealListener() {
  onSnapshot(
    revealRef,
    (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      updateVoteUI(data.boyVotes ?? 0, data.girlVotes ?? 0);

      // You control revealGender in Firebase Console
      if (data.revealGender) {
        cachedRevealGender = normalizeGender(data.revealGender);
        // If we are already on reveal screen, update text immediately
        if (!phaseReveal?.classList.contains("hidden")) {
          renderRevealUI(cachedRevealGender);
        }
      }
    },
    (err) => {
      console.error(err);
      if (voteNote) voteNote.textContent = "Firestore 監聽失敗：" + (err?.message ?? err);
    }
  );
}

// Vote: increments counters and then moves to reveal screen locally.
// No permanent vote-lock; only prevents double click within same page run.
async function castVote(choice) {
  try {
    if (votedThisRun) return;
    votedThisRun = true;

    // Disable buttons to avoid double click in this run (refresh resets)
    if (voteBoyBtn) voteBoyBtn.disabled = true;
    if (voteGirlBtn) voteGirlBtn.disabled = true;

    // 更新票數
    if (choice === "boy") {
      await updateDoc(revealRef, { boyVotes: increment(1), updatedAt: serverTimestamp() });
    } else {
      await updateDoc(revealRef, { girlVotes: increment(1), updatedAt: serverTimestamp() });
    }

    // ✅ 轉場遮罩
    const overlay = document.getElementById("revealTransition");
    if (overlay) overlay.classList.add("show");

    // ✅ 等一下再進入揭曉（儀式感）
    setTimeout(() => {
      if (overlay) overlay.classList.remove("show");

      // 進入揭曉畫面（本機）
      showPhase("reveal");

      // 淡入揭曉區
      if (phaseReveal) phaseReveal.classList.add("fade-in");

      // 更新文字與圖片
      renderRevealUI(cachedRevealGender);

      // ✅ 寶寶照片輕微放大（可重播）
      if (babyImg) {
        babyImg.classList.remove("zoom-in");
        void babyImg.offsetWidth; // 強制 reflow，確保動畫可重播 [1](https://blog.csdn.net/gusushantang/article/details/150603953)[2](https://geek-docs.com/css/css-ask-answer/323_css_restart_animation_in_css3_any_better_way_than_removing_the_element.html)
        babyImg.classList.add("zoom-in");
      }

      if (voteNote) voteNote.textContent = "已投票，揭曉中…";
    }, 900);

  } catch (err) {
    console.error(err);
    votedThisRun = false;
    if (voteBoyBtn) voteBoyBtn.disabled = false;
    if (voteGirlBtn) voteGirlBtn.disabled = false;
    if (voteNote) voteNote.textContent = "投票失敗：" + (err?.message ?? err);
  }
}

if (voteBoyBtn) voteBoyBtn.addEventListener("click", () => castVote("boy"));
if (voteGirlBtn) voteGirlBtn.addEventListener("click", () => castVote("girl"));

// Boot Firestore
(async function bootFirestore() {
  try {
    if (voteNote) voteNote.textContent = "Firestore 連線中…";
    await ensureRevealDoc();
    startRevealListener();
    if (voteNote) voteNote.textContent = "請投票～（重新整理會重頭開始）";
  } catch (err) {
    console.error(err);
    if (voteNote) voteNote.textContent =
      "Firestore 初始化失敗：" + (err?.message ?? err);
  }
})();
