// ==================== State Management ====================
const state = {
  lyrics: [],
  selectedIndex: 0,
  isPlaying: false,
  audioLoaded: false,
};

// ==================== DOM Elements ====================
const elements = {
  waveform: document.getElementById("waveform"),
  audioFile: document.getElementById("audioFile"),
  btnChooseFile: document.getElementById("btnChooseFile"),
  fileName: document.getElementById("fileName"),
  lyricsInput: document.getElementById("lyricsInput"),
  btnLoadLyrics: document.getElementById("btnLoadLyrics"),
  btnClearLyrics: document.getElementById("btnClearLyrics"),
  lyricsList: document.getElementById("lyricsList"),
  lyricsCount: document.getElementById("lyricsCount"),
  btnPlayPause: document.getElementById("btnPlayPause"),
  btnBackward: document.getElementById("btnBackward"),
  btnForward: document.getElementById("btnForward"),
  playbackSpeed: document.getElementById("playbackSpeed"),
  labelSpeed: document.getElementById("labelSpeed"),
  currentTime: document.getElementById("currentTime"),
  totalTime: document.getElementById("totalTime"),
  btnCopyLRC: document.getElementById("btnCopyLRC"),
  btnClearAll: document.getElementById("btnClearAll"),
  recordModeIndicator: document.getElementById("recordModeIndicator"),
  statusText: document.getElementById("statusText"),
  toast: document.getElementById("toast"),
  titleWaveform: document.getElementById("titleWaveform"),
  titleInput: document.getElementById("titleInput"),
  titleTimeline: document.getElementById("titleTimeline"),
  shortcutPlayPause: document.getElementById("shortcutPlayPause"),
  shortcutSync: document.getElementById("shortcutSync"),
  shortcutNav: document.getElementById("shortcutNav"),
  shortcutSeek: document.getElementById("shortcutSeek"),
  languageSelect: document.getElementById("languageSelect"),
  themeSelect: document.getElementById("themeSelect"),
};

const PLAY_ICON_SVG = `
  <svg class="playback-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M8 5v14l11-7z" fill="currentColor"></path>
  </svg>
`;

const PAUSE_ICON_SVG = `
  <svg class="playback-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M7 5h4v14H7z" fill="currentColor"></path>
    <path d="M13 5h4v14h-4z" fill="currentColor"></path>
  </svg>
`;

function setPlayPauseIcon(isPlaying) {
  if (!elements.btnPlayPause) return;
  elements.btnPlayPause.innerHTML = isPlaying ? PAUSE_ICON_SVG : PLAY_ICON_SVG;
  elements.btnPlayPause.setAttribute(
    "aria-pressed",
    isPlaying ? "true" : "false"
  );
}

// ==================== Settings (Theme / Language) ====================
const SETTINGS_KEYS = {
  theme: "lse-theme",
  lang: "lse-lang",
  lyrics: "lse-lyrics-data",
  audioData: "lse-audio-data",
  audioName: "lse-audio-name",
};

// Use external language files
const i18n = {
  en: window.i18n_en || {},
  vi: window.i18n_vi || {},
};

function getLang() {
  const stored = localStorage.getItem(SETTINGS_KEYS.lang);
  return stored === "vi" || stored === "en" ? stored : "en";
}

function t(key, ...args) {
  const lang = getLang();
  const value = i18n[lang]?.[key] ?? i18n.en[key];
  return typeof value === "function" ? value(...args) : value;
}

function applyLanguage(lang) {
  localStorage.setItem(SETTINGS_KEYS.lang, lang);
  if (elements.languageSelect) elements.languageSelect.value = lang;

  document.title = "Lyric Sync Editor";

  if (elements.titleWaveform)
    elements.titleWaveform.textContent = t("waveformTitle");
  if (elements.titleInput) elements.titleInput.textContent = t("inputTitle");
  if (elements.titleTimeline)
    elements.titleTimeline.textContent = t("timelineTitle");

  if (elements.btnClearAll) elements.btnClearAll.textContent = t("clearAll");
  if (elements.btnChooseFile)
    elements.btnChooseFile.textContent = t("chooseAudio");
  if (
    elements.fileName &&
    elements.fileName.textContent.trim() === "No file selected"
  ) {
    elements.fileName.textContent = t("noFile");
  }
  if (
    elements.fileName &&
    elements.fileName.textContent.trim() === "Chưa chọn file"
  ) {
    elements.fileName.textContent = t("noFile");
  }

  if (elements.lyricsInput) elements.lyricsInput.placeholder = t("placeholder");
  if (elements.btnLoadLyrics)
    elements.btnLoadLyrics.textContent = t("loadLyrics");
  if (elements.btnClearLyrics) elements.btnClearLyrics.textContent = t("clear");

  if (elements.recordModeIndicator) {
    const span = elements.recordModeIndicator.querySelector("span:last-child");
    if (span) span.innerHTML = t("recordMode");
  }

  if (elements.labelSpeed) elements.labelSpeed.textContent = t("speed");
  if (elements.btnCopyLRC) elements.btnCopyLRC.textContent = t("copy");

  if (elements.shortcutPlayPause) {
    elements.shortcutPlayPause.innerHTML = `<kbd>Space</kbd> ${t(
      "shortcutPlayPause"
    )}`;
  }
  if (elements.shortcutSync) {
    elements.shortcutSync.innerHTML = `<kbd>Enter</kbd> ${t("shortcutSync")}`;
  }
  if (elements.shortcutNav) {
    elements.shortcutNav.innerHTML = `<kbd>↑↓</kbd> ${t("shortcutNav")}`;
  }
  if (elements.shortcutSeek) {
    elements.shortcutSeek.innerHTML = `<kbd>←→</kbd> ${t("shortcutSeek")}`;
  }

  if (elements.btnBackward) elements.btnBackward.title = t("backwardTitle");
  if (elements.btnForward) elements.btnForward.title = t("forwardTitle");
  if (elements.btnPlayPause) elements.btnPlayPause.title = t("playPauseTitle");

  // Update select option labels (optional)
  if (elements.themeSelect) {
    const opts = Array.from(elements.themeSelect.options);
    for (const opt of opts) {
      if (opt.value === "system") opt.textContent = t("themeSystem");
      if (opt.value === "dark") opt.textContent = t("themeDark");
      if (opt.value === "light") opt.textContent = t("themeLight");
    }
  }
  if (elements.languageSelect) {
    const opts = Array.from(elements.languageSelect.options);
    for (const opt of opts) {
      if (opt.value === "en") opt.textContent = t("langEnglish");
      if (opt.value === "vi") opt.textContent = t("langVietnamese");
    }
  }

  // Re-render empty state strings if needed
  if (state.lyrics.length === 0) {
    renderLyricsList();
  }

  // Update sync and reset button titles in lyrics list
  const syncButtons = elements.lyricsList.querySelectorAll(".btn-sync");
  const resetButtons = elements.lyricsList.querySelectorAll(".btn-reset");
  syncButtons.forEach((btn) => (btn.title = t("syncActionTitle")));
  resetButtons.forEach((btn) => (btn.title = t("resetActionTitle")));

  updateLyricsCount();
}

function cssVar(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

function applyTheme(theme) {
  const mode =
    theme === "dark" || theme === "light" || theme === "system"
      ? theme
      : "system";
  localStorage.setItem(SETTINGS_KEYS.theme, mode);
  document.documentElement.setAttribute("data-theme", mode);
  if (elements.themeSelect) elements.themeSelect.value = mode;
  updateWaveSurferTheme();
}

function updateWaveSurferTheme() {
  if (!wavesurfer) return;
  const accent = cssVar("--accent-color") || "#58a6ff";
  const waveColor = cssVar("--wave-color") || "#4a5568";

  if (typeof wavesurfer.setOptions === "function") {
    wavesurfer.setOptions({
      waveColor,
      progressColor: accent,
      cursorColor: accent,
    });
  }
}

// ==================== WaveSurfer Setup ====================
let wavesurfer = null;
let currentAudioObjectUrl = null;

// Track auto-scroll to prevent jitter
let lastHighlightedIndex = -1;
let lastAutoScrollIndex = -1;
let lastAutoScrollAt = 0;

function initWaveSurfer() {
  const accent = cssVar("--accent-color") || "#58a6ff";
  const waveColor = cssVar("--wave-color") || "#4a5568";

  wavesurfer = WaveSurfer.create({
    container: "#waveform",
    waveColor,
    progressColor: accent,
    cursorColor: accent,
    cursorWidth: 2,
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    height: 100,
    responsive: true,
    normalize: true,
    backend: "WebAudio",
  });

  wavesurfer.on("ready", () => {
    state.audioLoaded = true;
    elements.totalTime.textContent = formatTime(wavesurfer.getDuration());
    updateStatus(t("statusAudioLoaded"));
    showToast(t("toastAudioLoaded"), "success");
  });

  wavesurfer.on("audioprocess", () => {
    const currentTime = wavesurfer.getCurrentTime();
    elements.currentTime.textContent = formatTime(currentTime);
    highlightCurrentLyric(currentTime);
  });

  wavesurfer.on("seek", () => {
    const currentTime = wavesurfer.getCurrentTime();
    elements.currentTime.textContent = formatTime(currentTime);
    highlightCurrentLyric(currentTime);
  });

  wavesurfer.on("play", () => {
    state.isPlaying = true;
    setPlayPauseIcon(true);
    elements.recordModeIndicator.classList.add("active");
  });

  wavesurfer.on("pause", () => {
    state.isPlaying = false;
    setPlayPauseIcon(false);
    elements.recordModeIndicator.classList.remove("active");
  });

  wavesurfer.on("finish", () => {
    state.isPlaying = false;
    setPlayPauseIcon(false);
    elements.recordModeIndicator.classList.remove("active");
  });
}

// ==================== Utility Functions ====================
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00.00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}.${String(ms).padStart(2, "0")}`;
}

function formatLRCTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "[00:00.00]";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `[${String(mins).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}.${String(ms).padStart(2, "0")}]`;
}

function showToast(message, type = "") {
  elements.toast.textContent = message;
  elements.toast.className = "toast show" + (type ? ` ${type}` : "");
  window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 3000);
}

function updateStatus(text) {
  elements.statusText.textContent = text;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function scrollLyricIntoView(index, { center = false, smooth = false } = {}) {
  const item = elements.lyricsList.querySelector(`[data-index="${index}"]`);
  if (!item) return;

  const container = elements.lyricsList;
  const containerRect = container.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();

  const padding = 16;

  // Already comfortably visible
  if (
    itemRect.top >= containerRect.top + padding &&
    itemRect.bottom <= containerRect.bottom - padding
  ) {
    return;
  }

  // Compute target scrollTop inside the lyrics container (avoid page scroll)
  const itemTopInContainer =
    itemRect.top - containerRect.top + container.scrollTop;

  let targetTop = container.scrollTop;

  if (center) {
    targetTop =
      itemTopInContainer - (container.clientHeight / 2 - item.clientHeight / 2);
  } else {
    if (itemRect.top < containerRect.top + padding) {
      targetTop = itemTopInContainer - padding;
    } else if (itemRect.bottom > containerRect.bottom - padding) {
      targetTop =
        itemTopInContainer -
        (container.clientHeight - item.clientHeight) +
        padding;
    }
  }

  container.scrollTo({
    top: Math.max(0, targetTop),
    behavior: smooth ? "smooth" : "auto",
  });
}

// ==================== Audio Functions ====================
function loadAudioFile(file) {
  if (!file) return;

  if (currentAudioObjectUrl) {
    try {
      URL.revokeObjectURL(currentAudioObjectUrl);
    } catch {
      // ignore
    }
  }

  currentAudioObjectUrl = URL.createObjectURL(file);
  wavesurfer.load(currentAudioObjectUrl);
  elements.fileName.textContent = file.name;
  updateStatus(t("statusLoading", file.name));

  // Save audio to localStorage as base64
  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    try {
      localStorage.setItem(SETTINGS_KEYS.audioData, base64);
      localStorage.setItem(SETTINGS_KEYS.audioName, file.name);
    } catch (error) {
      console.error("Failed to save audio to localStorage:", error);
      showToast(t("toastStorageError"), "error");
    }
  };
  reader.readAsDataURL(file);
}

// ==================== Lyrics Functions ====================
function parseLrcTimestamp(token) {
  // token like [mm:ss.xx] or [m:ss.xx]
  const m = token.match(/^\[(\d{1,3}):(\d{2})(?:\.(\d{1,2}))?\]$/);
  if (!m) return null;
  const mins = Number.parseInt(m[1], 10);
  const secs = Number.parseInt(m[2], 10);
  const cs = m[3] ? Number.parseInt(m[3].padEnd(2, "0"), 10) : 0;
  if (Number.isNaN(mins) || Number.isNaN(secs) || Number.isNaN(cs)) return null;
  return mins * 60 + secs + cs / 100;
}

function parseLyricLine(rawLine) {
  const line = rawLine.trim();
  if (!line) return null;

  // Skip common LRC metadata tags
  if (/^\[(ti|ar|al|by|offset|length|re|ve):/i.test(line)) return null;

  // Strip all leading timestamps and keep the first one for our single-line model
  let rest = line;
  let firstTime = null;

  // Match repeated leading [mm:ss.xx]
  while (rest.startsWith("[")) {
    const end = rest.indexOf("]");
    if (end === -1) break;
    const token = rest.slice(0, end + 1);
    const ts = parseLrcTimestamp(token);
    if (ts === null) break;
    if (firstTime === null) firstTime = ts;
    rest = rest.slice(end + 1).trimStart();
  }

  const text = rest.trim();
  if (!text) return null;

  return { time: firstTime, text };
}

function loadLyrics() {
  const text = elements.lyricsInput.value.trim();
  if (!text) {
    showToast(t("toastPasteFirst"));
    return;
  }

  const lines = text.split("\n").filter((line) => line.trim() !== "");
  const parsed = lines
    .map((lineText) => parseLyricLine(lineText))
    .filter(Boolean);

  state.lyrics = parsed.map((p, index) => ({
    id: index,
    time: p.time ?? null,
    text: p.text,
  }));

  state.selectedIndex = 0;
  lastHighlightedIndex = -1;
  lastAutoScrollIndex = -1;

  renderLyricsList();
  updateLyricsCount();
  showToast(t("toastLoaded", state.lyrics.length), "success");
  updateStatus(t("statusLyricsLoaded", state.lyrics.length));
  saveState();
}

function renderLyricsList() {
  if (state.lyrics.length === 0) {
    elements.lyricsList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/>
        </svg>
        <p>${escapeHtml(t("emptyTitle"))}</p>
        <p>${escapeHtml(t("emptyHint"))}</p>
      </div>
    `;
    return;
  }

  elements.lyricsList.innerHTML = state.lyrics
    .map(
      (lyric, index) => `
        <div class="lyric-item ${
          index === state.selectedIndex ? "selected" : ""
        }" data-index="${index}">
          <span class="lyric-index">${index + 1}</span>
          <span class="lyric-time ${lyric.time === null ? "unset" : ""}">${
        lyric.time !== null ? formatLRCTime(lyric.time) : "[--:--.--]"
      }</span>
          <span class="lyric-text">${escapeHtml(lyric.text)}</span>
          <div class="lyric-actions">
            <button class="btn btn-sync" data-action="sync" data-index="${index}" title="${escapeHtml(
        t("syncActionTitle")
      )}">⏱️</button>
            <button class="btn btn-reset" data-action="reset" data-index="${index}" title="${escapeHtml(
        t("resetActionTitle")
      )}">↩️</button>
          </div>
        </div>
      `
    )
    .join("");

  elements.lyricsList.querySelectorAll(".lyric-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".lyric-actions")) return;
      const index = Number.parseInt(item.dataset.index, 10);
      selectLyric(index, { smooth: true });
    });
  });

  elements.lyricsList.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const index = Number.parseInt(btn.dataset.index, 10);

      if (action === "sync") {
        syncLyricAtIndex(index);
      } else if (action === "reset") {
        resetLyricTime(index);
      }
    });
  });
}

function selectLyric(index, { smooth = false, seek = true } = {}) {
  if (index < 0 || index >= state.lyrics.length) return;
  state.selectedIndex = index;

  // Clear any 'next-up' markers when manually selecting
  elements.lyricsList.querySelectorAll(".lyric-item").forEach((item, i) => {
    item.classList.toggle("selected", i === index);
    item.classList.remove("next-up");
  });

  scrollLyricIntoView(index, { center: true, smooth });

  if (seek && state.audioLoaded && state.lyrics[index].time !== null) {
    // Only seek when explicitly allowed (avoid jumping during auto-advance)
    wavesurfer.setTime(state.lyrics[index].time);
  }
}

function syncCurrentLyric() {
  if (!state.audioLoaded) {
    showToast(t("toastLoadAudioFirst"));
    return;
  }

  if (state.lyrics.length === 0) {
    showToast(t("toastLoadLyricsFirst"));
    return;
  }

  const syncedIndex = state.selectedIndex;
  const currentTime = wavesurfer.getCurrentTime();
  state.lyrics[syncedIndex].time = currentTime;

  const lyricItem = elements.lyricsList.querySelector(
    `[data-index="${syncedIndex}"]`
  );
  if (lyricItem) {
    const timeSpan = lyricItem.querySelector(".lyric-time");
    timeSpan.textContent = formatLRCTime(currentTime);
    timeSpan.classList.remove("unset");
  }

  updateLyricsCount();

  if (syncedIndex < state.lyrics.length - 1) {
    // Avoid smooth scroll during rapid record mode and prevent auto-seek
    selectLyric(syncedIndex + 1, { smooth: false, seek: false });
    // Mark the upcoming lyric with a green border to indicate it's the next to sync
    setNextUpIndex(syncedIndex + 1);
  }

  updateStatus(t("syncedLineStatus", syncedIndex + 1, formatTime(currentTime)));
  saveState();
}

function syncLyricAtIndex(index) {
  if (!state.audioLoaded) {
    showToast(t("toastLoadAudioFirst"));
    return;
  }

  const currentTime = wavesurfer.getCurrentTime();
  state.lyrics[index].time = currentTime;

  const lyricItem = elements.lyricsList.querySelector(
    `[data-index="${index}"]`
  );
  if (lyricItem) {
    const timeSpan = lyricItem.querySelector(".lyric-time");
    timeSpan.textContent = formatLRCTime(currentTime);
    timeSpan.classList.remove("unset");
  }

  updateLyricsCount();
  showToast(t("lineSyncedToast", index + 1, formatTime(currentTime)));
  saveState();
}

function resetLyricTime(index) {
  state.lyrics[index].time = null;

  const lyricItem = elements.lyricsList.querySelector(
    `[data-index="${index}"]`
  );
  if (lyricItem) {
    const timeSpan = lyricItem.querySelector(".lyric-time");
    timeSpan.textContent = "[--:--.--]";
    timeSpan.classList.add("unset");
  }

  updateLyricsCount();
  showToast(t("lineResetToast", index + 1));
  saveState();
}

function highlightCurrentLyric(currentTime) {
  if (state.lyrics.length === 0) return;

  let currentIndex = -1;
  for (let i = state.lyrics.length - 1; i >= 0; i--) {
    if (state.lyrics[i].time !== null && currentTime >= state.lyrics[i].time) {
      currentIndex = i;
      break;
    }
  }

  if (currentIndex === lastHighlightedIndex) return;
  lastHighlightedIndex = currentIndex;

  elements.lyricsList.querySelectorAll(".lyric-item").forEach((item, i) => {
    item.classList.toggle("current", i === currentIndex);
  });

  // Auto-scroll: only when index changes, throttled, and never scroll the page
  const now = Date.now();
  if (currentIndex >= 0 && state.isPlaying) {
    if (currentIndex !== lastAutoScrollIndex && now - lastAutoScrollAt > 150) {
      lastAutoScrollIndex = currentIndex;
      lastAutoScrollAt = now;
      scrollLyricIntoView(currentIndex, { center: false, smooth: false });
    }
  }
}

// Mark which lyric is upcoming (next to be synced)
function setNextUpIndex(index) {
  elements.lyricsList.querySelectorAll(".lyric-item").forEach((item, i) => {
    item.classList.toggle("next-up", i === index);
  });
}

function updateLyricsCount() {
  const synced = state.lyrics.filter((l) => l.time !== null).length;
  elements.lyricsCount.textContent = t(
    "lyricsCount",
    synced,
    state.lyrics.length
  );
}

// ==================== Export Functions ====================
function generateLRC() {
  if (state.lyrics.length === 0) {
    showToast(t("toastNoLyricsExport"));
    return null;
  }

  const sortedLyrics = [...state.lyrics].sort((a, b) => {
    if (a.time === null && b.time === null) return 0;
    if (a.time === null) return 1;
    if (b.time === null) return -1;
    return a.time - b.time;
  });

  return sortedLyrics
    .map((lyric) => {
      const time =
        lyric.time !== null ? formatLRCTime(lyric.time) : "[00:00.00]";
      return `${time}${lyric.text}`;
    })
    .join("\n");
}

function copyLRCToClipboard() {
  const lrcContent = generateLRC();
  if (!lrcContent) return;

  navigator.clipboard
    .writeText(lrcContent)
    .then(() => {
      showToast(t("toastCopied"), "success");
      updateStatus(t("statusCopied"));
    })
    .catch(() => {
      showToast(t("toastCopyFailed"));
    });
}

function clearAll() {
  if (state.lyrics.length > 0 || state.audioLoaded) {
    if (!confirm(t("confirmClearAll"))) return;
  }

  state.lyrics = [];
  state.selectedIndex = 0;
  state.audioLoaded = false;
  state.isPlaying = false;

  lastHighlightedIndex = -1;
  lastAutoScrollIndex = -1;
  lastAutoScrollAt = 0;

  elements.lyricsInput.value = "";
  elements.fileName.textContent = t("noFile");
  elements.currentTime.textContent = "00:00.00";
  elements.totalTime.textContent = "00:00.00";

  if (wavesurfer) {
    wavesurfer.empty();
  }

  if (currentAudioObjectUrl) {
    try {
      URL.revokeObjectURL(currentAudioObjectUrl);
    } catch {
      // ignore
    }
    currentAudioObjectUrl = null;
  }

  // Clear audio from localStorage
  localStorage.removeItem(SETTINGS_KEYS.audioData);
  localStorage.removeItem(SETTINGS_KEYS.audioName);

  renderLyricsList();
  updateLyricsCount();
  showToast(t("toastAllCleared"));
  updateStatus(t("statusReady"));
  saveState();
}

// ==================== Event Listeners ====================
function setupEventListeners() {
  if (elements.languageSelect) {
    elements.languageSelect.addEventListener("change", (e) => {
      applyLanguage(e.target.value);
    });
  }

  if (elements.themeSelect) {
    elements.themeSelect.addEventListener("change", (e) => {
      applyTheme(e.target.value);
    });
  }

  elements.btnChooseFile.addEventListener("click", () => {
    elements.audioFile.click();
  });

  elements.audioFile.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) loadAudioFile(file);
  });

  elements.btnLoadLyrics.addEventListener("click", loadLyrics);
  elements.btnClearLyrics.addEventListener("click", () => {
    elements.lyricsInput.value = "";
  });

  elements.btnPlayPause.addEventListener("click", () => {
    if (state.audioLoaded) {
      wavesurfer.playPause();
    } else {
      showToast(t("toastLoadAudioFirst"));
    }
  });

  elements.btnBackward.addEventListener("click", () => {
    if (state.audioLoaded) wavesurfer.skip(-2);
  });

  elements.btnForward.addEventListener("click", () => {
    if (state.audioLoaded) wavesurfer.skip(2);
  });

  elements.playbackSpeed.addEventListener("change", (e) => {
    if (wavesurfer) {
      wavesurfer.setPlaybackRate(Number.parseFloat(e.target.value));
    }
  });

  elements.btnCopyLRC.addEventListener("click", copyLRCToClipboard);

  elements.btnClearAll.addEventListener("click", clearAll);

  document.addEventListener("keydown", (e) => {
    // Ignore when typing in input-like elements or composing text (IME)
    if (e.isComposing) return;
    if (e.target) {
      const tag = e.target.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || e.target.isContentEditable)
        return;
    }

    switch (e.code) {
      case "Space":
        e.preventDefault();
        if (state.audioLoaded) wavesurfer.playPause();
        break;

      case "Enter":
        e.preventDefault();
        syncCurrentLyric();
        break;

      case "ArrowUp":
        e.preventDefault();
        if (state.lyrics.length > 0 && state.selectedIndex > 0) {
          selectLyric(state.selectedIndex - 1, { smooth: false });
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        if (
          state.lyrics.length > 0 &&
          state.selectedIndex < state.lyrics.length - 1
        ) {
          selectLyric(state.selectedIndex + 1, { smooth: false });
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        if (state.audioLoaded) wavesurfer.skip(-2);
        break;

      case "ArrowRight":
        e.preventDefault();
        if (state.audioLoaded) wavesurfer.skip(2);
        break;
    }
  });

  // Drag & drop audio
  document.body.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  document.body.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("audio/")) {
      loadAudioFile(files[0]);
    }
  });
}

// ==================== LocalStorage Persistence ====================
function saveState() {
  try {
    const data = {
      lyrics: state.lyrics,
      selectedIndex: state.selectedIndex,
      fileName: elements.fileName ? elements.fileName.textContent : "",
    };
    localStorage.setItem(SETTINGS_KEYS.lyrics, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}

function restoreState() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEYS.lyrics);
    if (!saved) return false;

    const data = JSON.parse(saved);
    if (data.lyrics && Array.isArray(data.lyrics) && data.lyrics.length > 0) {
      state.lyrics = data.lyrics;
      state.selectedIndex = data.selectedIndex || 0;

      if (data.fileName && data.fileName !== t("noFile") && elements.fileName) {
        elements.fileName.textContent = data.fileName;
      }

      renderLyricsList();
      updateLyricsCount();
      showToast(t("toastDataRestored"), "success");
      return true;
    }
  } catch (e) {
    console.error("Failed to restore state:", e);
  }
  return false;
}

function restoreAudio() {
  try {
    const audioData = localStorage.getItem(SETTINGS_KEYS.audioData);
    const audioName = localStorage.getItem(SETTINGS_KEYS.audioName);
    if (audioData && audioName) {
      // Convert base64 to blob
      const byteString = atob(audioData.split(",")[1]);
      const mimeString = audioData.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      // Load the blob
      if (currentAudioObjectUrl) {
        URL.revokeObjectURL(currentAudioObjectUrl);
      }
      currentAudioObjectUrl = URL.createObjectURL(blob);
      wavesurfer.load(currentAudioObjectUrl);
      elements.fileName.textContent = audioName;
      updateStatus(t("statusAudioRestored"));
      return true;
    }
  } catch (e) {
    console.error("Failed to restore audio:", e);
  }
  return false;
}

// ==================== Initialize ====================
function init() {
  // Default settings
  const savedTheme = localStorage.getItem(SETTINGS_KEYS.theme) || "system";
  const savedLang = getLang();
  applyTheme(savedTheme);
  applyLanguage(savedLang);

  initWaveSurfer();
  setupEventListeners();

  // Restore saved audio
  restoreAudio();

  // Restore saved lyrics data
  const restored = restoreState();
  if (!restored) {
    updateStatus(t("statusReady"));
  }
}

document.addEventListener("DOMContentLoaded", init);
