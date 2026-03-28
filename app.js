// app.js (ESM)
const phaseLabel = document.getElementById("phaseLabel");
const phaseScratch = document.getElementById("phaseScratch");
const phaseVote = document.getElementById("phaseVote");
const phaseReveal = document.getElementById("phaseReveal");

const scratchGrid = document.getElementById("scratchGrid");
const scratchDoneEl = document.getElementById("scratchDone");
const scratchTotalEl = document.getElementById("scratchTotal");
const toVoteBtn = document.getElementById("toVoteBtn");

const voteBoyBtn = document.getElementById("voteBoy");
const voteGirlBtn = document.getElementById("voteGirl");
const boyVotesEl = document.getElementById("boyVotes");
const girlVotesEl = document.getElementById("girlVotes");
const boyBar = document.getElementById("boyBar");
const girlBar = document.getElementById("girlBar");
const voteNote = document.getElementById("voteNote");

const revealText = document.getElementById("revealText");

// ========== 1) 徵兆卡內容（你可以自由改） ==========
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

scratchTotalEl.textContent = SIGNS.length;

// ========== 2) 刮刮樂：用 ScratchCard-js ==========
// ScratchCard-js 支援 percentToFinish / enabledPercentUpdate / callback / getPercent / scratch.move[1](https://masth0.github.io/ScratchCard/)[2](https://github.com/Masth0/ScratchCard)

let scratchDoneCount = 0;
const doneFlags = new Array(SIGNS.length).fill(false);

function updateScratchProgress() {
  scratchDoneEl.textContent = String(scratchDoneCount);
  const allDone = scratchDoneCount === SIGNS.length;
  toVoteBtn.disabled = !allDone;
}

function makeCoverDataUrl(w = 600, h = 360) {
  // 生成一張簡單的「灰色刮層」圖片（dataURL）
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  // 背景
  ctx.fillStyle = "#b7c2d8";
  ctx.fillRect(0, 0, w, h);

  // 紋理
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

  // 問號文字
  ctx.fillStyle = "rgba(17,26,46,.65)";
  ctx.font = "900 64px system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("刮開看看", w / 2, h / 2 + 18);

  return c.toDataURL("image/png");
}

const coverDataUrl = makeCoverDataUrl();

function renderScratchCards() {
  scratchGrid.innerHTML = "";

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

    // 建立 ScratchCard instance
    const sc = new window.ScratchCard(overlay, {
      scratchType: window.SCRATCH_TYPE.LINE,
      containerWidth: overlay.clientWidth,
      containerHeight: overlay.clientHeight,
      imageForwardSrc: coverDataUrl,
      imageBackgroundSrc: "",      // 我們用 htmlBackground 展示文字
      htmlBackground: "",          // 背景已在 bg div 中呈現
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

    sc.init().then(() => {
      // 可選：你想顯示即時刮除百分比時可用 sc.getPercent() [1](https://masth0.github.io/ScratchCard/)[2](https://github.com/Masth0/ScratchCard)
      // sc.canvas.addEventListener("scratch.move", () => console.log(sc.getPercent()));
    }).catch((err) => {
      console.error("Scratch init error", err);
    });

    // 讓卡片縮放時重新適配（簡單處理：resize 重新載入）
    window.addEventListener("resize", () => {
      // 重新整理最省事（避免每張卡重新 init 的複雜度）
      // 若你不想刷新，可自己做更細緻的 re-init
    }, { passive: true });
  });
}

renderScratchCards();
updateScratchProgress();

toVoteBtn.addEventListener("click", () => {
  showPhase("vote");
});

// ========== 3) Firestore：票數 + 揭曉控制 ==========
// 你需要把 firebaseConfig 換成你 Firebase 專案的設定。
// 官方文件示例包含 initializeApp + getFirestore [7](https://firebase.google.cn/docs/firestore/manage-data/add-data?hl=zh-cn)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, doc, setDoc, updateDoc, onSnapshot, increment, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  // TODO: 到 Firebase Console 複製你的設定貼在這裡
  // apiKey: "...", authDomain: "...", projectId: "...", ...
};

const REVEAL_DOC_PATH = { col: "reveals", id: "baby-2026" }; // 你可改活動ID
const VOTED_KEY = `revealVoted:${REVEAL_DOC_PATH.id}`;

let db, revealRef;

async function initFirestore() {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  revealRef = doc(db, REVEAL_DOC_PATH.col, REVEAL_DOC_PATH.id);

  // 若 doc 不存在就建立一份初始資料（用 setDoc）
  // setDoc 的概念與初始化示例可參考官方 add-data 文件 [7](https://firebase.google.cn/docs/firestore/manage-data/add-data?hl=zh-cn)
  const snap = await getDoc(revealRef);
  if (!snap.exists()) {
    await setDoc(revealRef, {
      boyVotes: 0,
      girlVotes: 0,
      phase: "vote",
      revealGender: "boy"
    });
  }

  // 監聽即時變更：官方說明 onSnapshot 會先立刻回呼一次，之後每次內容變動再回呼[3](https://firebase.google.com/docs/firestore/query-data/listen)[4](https://modularfirebase.web.app/common-use-cases/firestore/)
  onSnapshot(revealRef, (docSnap) => {
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    updateVoteUI(data.boyVotes ?? 0, data.girlVotes ?? 0);

    if (data.phase === "reveal") {
      showReveal(data.revealGender);
    }
  });
}

function updateVoteUI(boy, girl) {
  boyVotesEl.textContent = String(boy);
  girlVotesEl.textContent = String(girl);

  const total = Math.max(1, boy + girl);
  const boyPct = Math.round((boy / total) * 100);
  const girlPct = 100 - boyPct;
  boyBar.style.width = `${boyPct}%`;
  girlBar.style.width = `${girlPct}%`;

  const voted = localStorage.getItem(VOTED_KEY);
  if (voted) {
    voteBoyBtn.disabled = true;
    voteGirlBtn.disabled = true;
    voteNote.textContent = `你已投票：${voted === "boy" ? "男生" : "女生"}（可等待揭曉）`;
  }
}

async function castVote(choice) {
  if (!revealRef) return;

  const voted = localStorage.getItem(VOTED_KEY);
  if (voted) return;

  // 原子遞增：increment(1)（避免多人同時投票時互相覆蓋）[5](https://oneuptime.com/blog/post/2026-02-17-how-to-use-field-transforms-in-firestore-for-atomic-increments-and-array-operations/view)[6](https://stackoverflow.com/questions/50762923/how-to-increment-existing-number-field-in-cloud-firestore)
  if (choice === "boy") {
    await updateDoc(revealRef, { boyVotes: increment(1) });
  } else {
    await updateDoc(revealRef, { girlVotes: increment(1) });
  }

  localStorage.setItem(VOTED_KEY, choice);
  voteBoyBtn.disabled = true;
  voteGirlBtn.disabled = true;
  voteNote.textContent = `你已投票：${choice === "boy" ? "男生" : "女生"}（可等待揭曉）`;
}

voteBoyBtn.addEventListener("click", () => castVote("boy"));
voteGirlBtn.addEventListener("click", () => castVote("girl"));

// ========== 4) Phase 切換 ==========
function showPhase(p) {
  phaseScratch.classList.add("hidden");
  phaseVote.classList.add("hidden");
  phaseReveal.classList.add("hidden");

  if (p === "scratch") {
    phaseLabel.textContent = "徵兆刮刮樂";
    phaseScratch.classList.remove("hidden");
  } else if (p === "vote") {
    phaseLabel.textContent = "投票猜測";
    phaseVote.classList.remove("hidden");
  } else {
    phaseLabel.textContent = "揭曉";
    phaseReveal.classList.remove("hidden");
  }
}

// 初始顯示 scratch
showPhase("scratch");

// Firestore 初始化（若 config 沒填會報錯，填好即可）
try {
  await initFirestore();
} catch (e) {
  console.warn("Firestore 尚未完成設定或初始化失敗：", e);
  // 沒 Firestore 時仍可玩第一關；第二關票數功能會不可用
}

// ========== 5) 揭曉 ==========
function showReveal(gender) {
  showPhase("reveal");
  const isBoy = gender === "boy";
  revealText.textContent = isBoy ? "是「男生」！💙" : "是「女生」！💗";
  revealText.style.color = isBoy ? "var(--blue)" : "var(--pink)";
}
