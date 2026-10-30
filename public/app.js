// Name-Shahr-Shohrat Frontend Logic — Modern Party Game UI
const socket = io();

// State variables
let currentRoom = null;
let myPlayer = null;
let isHost = false;
let soundEnabled = true;
let currentAnswers = {};
let currentCategories = [];
let avatarIndex = 0;

// Standard categories pool
let categoriesPool = [
  'نام', 'شهر', 'شهرت', 'کشور', 'غذا', 'میوه', 'حیوان', 'اشیاء', 'ماشین', 'گل', 'شغل'
];
let activeCategories = ['نام', 'شهر', 'شهرت', 'کشور', 'غذا', 'میوه'];

// HTML Escaping Utility for XSS immunity
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// DOM elements
const views = {
  home: document.getElementById('view-home'),
  lobby: document.getElementById('view-lobby'),
  reveal: document.getElementById('view-letter-reveal'),
  playing: document.getElementById('view-playing'),
  voting: document.getElementById('view-voting'),
  summary: document.getElementById('view-round-summary'),
  gameOver: document.getElementById('view-game-over'),
};

function switchView(viewName) {
  Object.keys(views).forEach(k => {
    views[k].classList.add('hidden');
  });
  if (views[viewName]) {
    views[viewName].classList.remove('hidden');
  }
  refreshLucideIcons();
}

function refreshLucideIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// ================= THEME & AUDIO VOLUME ENGINE =================
function initTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
  const iconContainer = document.getElementById('btn-theme-toggle');
  if (iconContainer) {
    iconContainer.innerHTML = `<i data-lucide="${isDark ? 'moon' : 'sun'}" class="w-4 h-4"></i>`;
    refreshLucideIcons();
  }
}

function toggleTheme() {
  window.sounds.playClick();
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
  showToast(isDark ? 'تم تاریک فعال شد' : 'تم روشن فعال شد');
}

// Audio Volume Slider & Toggle
function changeVolume(val) {
  const vol = parseInt(val) / 100;
  window.sounds.setVolume(vol);
  updateSoundIcon(vol > 0 && soundEnabled);
}

function updateSoundIcon(isActive) {
  const btn = document.getElementById('btn-sound-toggle');
  if (btn) {
    const iconName = (!isActive || window.sounds.volume <= 0.01) ? 'volume-x' : (window.sounds.volume < 0.5 ? 'volume-1' : 'volume-2');
    btn.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4"></i>`;
    refreshLucideIcons();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  window.sounds.muted = !soundEnabled;
  updateSoundIcon(soundEnabled);
  showToast(soundEnabled ? 'صداهای بازی فعال شد' : 'صداهای بازی قطع شد');
}

// Show Toast
function showToast(text, duration = 3000) {
  const toast = document.getElementById('toast-box');
  const toastText = document.getElementById('toast-text');
  if (toastText) toastText.innerText = text;
  toast.classList.remove('opacity-0', 'translate-y-3', 'pointer-events-none');
  toast.classList.add('opacity-100', 'translate-y-0');
  refreshLucideIcons();
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-3', 'pointer-events-none');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, duration);
}

// ================= PERSISTENT NICKNAME & VECTOR AVATAR =================
function updateSelectedAvatarDisplay() {
  const currentAvatar = AVATAR_LIST[avatarIndex];
  const container = document.getElementById('player-avatar-container');
  const nameEl = document.getElementById('player-avatar-name');
  if (container) {
    container.innerHTML = renderAvatarHtml(currentAvatar.id, 'w-12 h-12');
  }
  if (nameEl) {
    nameEl.innerText = currentAvatar.name;
  }
  localStorage.setItem('player_avatar_id', currentAvatar.id);
}

function cycleAvatar() {
  avatarIndex = (avatarIndex + 1) % AVATAR_LIST.length;
  updateSelectedAvatarDisplay();
  window.sounds.playClick();
}

// Check saved nickname, avatar, and URL query parameters
window.addEventListener('DOMContentLoaded', () => {
  initTheme();

  const slider = document.getElementById('sound-volume-slider');
  if (slider && window.sounds) {
    slider.value = Math.round(window.sounds.volume * 100);
    updateSoundIcon(true);
  }

  const savedName = localStorage.getItem('player_nickname');
  if (savedName) {
    const inputName = document.getElementById('input-player-name');
    if (inputName) inputName.value = savedName;
  }

  const savedAvatarId = localStorage.getItem('player_avatar_id');
  if (savedAvatarId) {
    const idx = AVATAR_LIST.findIndex(a => a.id === savedAvatarId);
    if (idx !== -1) avatarIndex = idx;
  }

  updateSelectedAvatarDisplay();
  refreshLucideIcons();

  const urlParams = new URLSearchParams(window.location.search);
  const roomCodeParam = urlParams.get('room');
  if (roomCodeParam) {
    document.getElementById('join-room-section').classList.remove('hidden');
    document.getElementById('input-room-code').value = roomCodeParam.toUpperCase().slice(0, 8);
    showToast(`کد اتاق ${escapeHtml(roomCodeParam)} بارگذاری شد`);
  }
});

// UI: Open Join Section
function openJoinSection() {
  window.sounds.playClick();
  const sec = document.getElementById('join-room-section');
  sec.classList.toggle('hidden');
  refreshLucideIcons();
  if (!sec.classList.contains('hidden')) {
    document.getElementById('input-room-code').focus();
  }
}

// UI: Open Create Settings Modal
function openCreateModal() {
  window.sounds.playClick();
  const name = document.getElementById('input-player-name').value.trim();
  if (!name) {
    showToast('لطفاً نام مستعارت رو وارد کن!');
    document.getElementById('input-player-name').focus();
    return;
  }
  localStorage.setItem('player_nickname', name);
  openSettingsModal(true);
}

function openSettingsModal(isCreating = false) {
  window.sounds.playClick();
  renderModalCategories();
  document.getElementById('modal-settings').classList.remove('hidden');
  document.getElementById('modal-settings').dataset.isCreating = isCreating ? 'true' : 'false';
  refreshLucideIcons();
}

function closeSettingsModal() {
  window.sounds.playClick();
  document.getElementById('modal-settings').classList.add('hidden');
}

function renderModalCategories() {
  const container = document.getElementById('modal-categories-list');
  container.innerHTML = '';
  categoriesPool.forEach(cat => {
    const isChecked = activeCategories.includes(cat);
    const label = document.createElement('label');
    label.className = `flex items-center gap-2 p-2.5 rounded-2xl border-2 text-xs cursor-pointer transition select-none ${
      isChecked
        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-black'
        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold'
    }`;
    label.innerHTML = `
      <input type="checkbox" value="${escapeHtml(cat)}" ${isChecked ? 'checked' : ''} class="accent-indigo-600 w-4 h-4 rounded cursor-pointer" onchange="toggleCategorySelection(this)">
      <span>${escapeHtml(cat)}</span>
    `;
    container.appendChild(label);
  });
}

function toggleCategorySelection(checkbox) {
  const cat = checkbox.value;
  if (checkbox.checked) {
    if (!activeCategories.includes(cat)) activeCategories.push(cat);
  } else {
    if (activeCategories.length <= 3) {
      checkbox.checked = true;
      showToast('حداقل ۳ فیلد باید انتخاب شود!');
      return;
    }
    activeCategories = activeCategories.filter(c => c !== cat);
  }
  renderModalCategories();
}

function addCustomCategory() {
  const input = document.getElementById('input-custom-category');
  const val = input.value.trim().slice(0, 20);
  if (!val) return;
  if (!categoriesPool.includes(val)) {
    categoriesPool.push(val);
    activeCategories.push(val);
    input.value = '';
    renderModalCategories();
    showToast(`فیلد «${escapeHtml(val)}» اضافه شد`);
  }
}

function saveSettingsModal() {
  window.sounds.playClick();
  const rounds = parseInt(document.getElementById('modal-select-rounds').value) || 5;
  const time = parseInt(document.getElementById('modal-select-time').value) || 60;
  const isCreating = document.getElementById('modal-settings').dataset.isCreating === 'true';

  closeSettingsModal();

  if (isCreating) {
    const name = document.getElementById('input-player-name').value.trim();
    const avatarId = AVATAR_LIST[avatarIndex].id;
    localStorage.setItem('player_nickname', name);

    socket.emit('create_room', {
      hostName: name,
      avatar: avatarId,
      settings: {
        categories: activeCategories,
        roundTime: time,
        totalRounds: rounds
      }
    }, (res) => {
      if (res.success) {
        handleJoinedRoom(res);
      } else {
        showToast(res.message || 'خطا در ساخت اتاق');
      }
    });
  } else {
    socket.emit('update_settings', {
      settings: {
        categories: activeCategories,
        roundTime: time,
        totalRounds: rounds
      }
    });
  }
}

// Join Room from input
function joinRoomFromInput() {
  window.sounds.playClick();
  const name = document.getElementById('input-player-name').value.trim();
  const code = document.getElementById('input-room-code').value.trim().toUpperCase();
  const avatarId = AVATAR_LIST[avatarIndex].id;

  if (!name) {
    showToast('لطفاً نام مستعارت رو بنویس!');
    document.getElementById('input-player-name').focus();
    return;
  }
  if (!code || code.length < 3) {
    showToast('کد اتاق را صحیح وارد کن!');
    document.getElementById('input-room-code').focus();
    return;
  }

  localStorage.setItem('player_nickname', name);

  socket.emit('join_room', { roomCode: code, playerName: name, avatar: avatarId }, (res) => {
    if (res.success) {
      handleJoinedRoom(res);
    } else {
      showToast(res.message || 'خطا در ورود به اتاق!');
    }
  });
}

function handleJoinedRoom(res) {
  currentRoom = res.room;
  myPlayer = res.player;
  isHost = myPlayer.isHost;

  document.getElementById('nav-room-badge').classList.remove('hidden');
  document.getElementById('nav-room-badge').classList.add('inline-flex');
  document.getElementById('nav-room-code').innerText = res.roomCode;
  document.getElementById('lobby-code-display').innerText = res.roomCode;

  updateLobbyView(currentRoom);
  switchView('lobby');
  window.sounds.playSuccess();
}

function updateLobbyView(room) {
  currentRoom = room;
  isHost = room.hostId === myPlayer.id;

  document.getElementById('lobby-player-count').innerText = room.players.length;
  const list = document.getElementById('lobby-players-list');
  list.innerHTML = '';
  room.players.forEach(p => {
    const isMe = p.id === myPlayer.id;
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 transition-colors';
    li.innerHTML = `
      <div class="flex items-center gap-3">
        ${renderAvatarHtml(p.avatar, 'w-10 h-10')}
        <div>
          <span class="font-black text-sm block ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}">
            ${escapeHtml(p.name)} ${isMe ? '(شما)' : ''}
          </span>
          <span class="text-[10px] text-slate-400 block">${escapeHtml(getAvatarById(p.avatar).name)}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        ${p.score > 0
          ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 text-xs font-black font-mono">
               ${p.score} امتیاز 🏆
             </span>`
          : ''}
        ${p.isHost
          ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 text-[11px] font-black">
               <i data-lucide="crown" class="w-3.5 h-3.5 fill-indigo-500"></i>
               <span>میزبان</span>
             </span>`
          : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[11px] font-black">
               <i data-lucide="check" class="w-3.5 h-3.5 stroke-[3]"></i>
               <span>آماده</span>
             </span>`
        }
      </div>
    `;
    list.appendChild(li);
  });

  document.getElementById('lobby-setting-rounds').innerText = `${room.settings.totalRounds} دور`;
  document.getElementById('lobby-setting-time').innerText = room.settings.roundTime > 0 ? `${room.settings.roundTime} ثانیه` : 'نامحدود (فقط استپ)';

  const chips = document.getElementById('lobby-categories-chips');
  chips.innerHTML = '';
  room.settings.categories.forEach(cat => {
    const chip = document.createElement('span');
    chip.className = 'px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs shadow-sm';
    chip.innerText = cat;
    chips.appendChild(chip);
  });

  if (isHost) {
    document.getElementById('btn-host-edit-settings').classList.remove('hidden');
    document.getElementById('btn-start-game').classList.remove('hidden');
    document.getElementById('lobby-waiting-notice').classList.add('hidden');
  } else {
    document.getElementById('btn-host-edit-settings').classList.add('hidden');
    document.getElementById('btn-start-game').classList.add('hidden');
    document.getElementById('lobby-waiting-notice').classList.remove('hidden');
  }

  refreshLucideIcons();
}

// Universal Clipboard Copy with Fallback
function copyTextToClipboard(text, successToastMsg) {
  window.sounds.playClick();
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successToastMsg);
    }).catch(() => {
      fallbackExecCopy(text, successToastMsg);
    });
  } else {
    fallbackExecCopy(text, successToastMsg);
  }
}

function fallbackExecCopy(text, successToastMsg) {
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    el.style.top = '-9999px';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    el.setSelectionRange(0, 99999);
    const successful = document.execCommand('copy');
    document.body.removeChild(el);
    if (successful) {
      showToast(successToastMsg);
    } else {
      prompt('لطفاً متن زیر را به صورت دستی کپی کنید:', text);
    }
  } catch (e) {
    prompt('لطفاً متن زیر را به صورت دستی کپی کنید:', text);
  }
}

function copyRoomCode() {
  if (!currentRoom) return;
  copyTextToClipboard(currentRoom.code, `کد اتاق «${currentRoom.code}» کپی شد`);
}

function copyInviteLink() {
  if (!currentRoom) return;
  const link = `${window.location.origin}/?room=${encodeURIComponent(currentRoom.code)}`;
  copyTextToClipboard(link, 'لینک مستقیم اتاق کپی شد');
}

function startGame() {
  window.sounds.playClick();
  socket.emit('start_game');
}

// ================= GLOBAL LEADERBOARD =================
function openLeaderboardModal() {
  window.sounds.playClick();
  socket.emit('get_global_leaderboard', (list) => {
    renderLeaderboard(list || []);
  });
  document.getElementById('modal-leaderboard').classList.remove('hidden');
  refreshLucideIcons();
}

function closeLeaderboardModal() {
  window.sounds.playClick();
  document.getElementById('modal-leaderboard').classList.add('hidden');
}

function renderLeaderboard(list) {
  const container = document.getElementById('global-leaderboard-list');
  container.innerHTML = '';

  if (!list || list.length === 0) {
    container.innerHTML = `<li class="p-6 text-center text-xs text-slate-400">هنوز امتیازی در لیدربرد ثبت نشده است. اولین بازی را شروع کنید!</li>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  list.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 transition';
    li.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-base font-black w-6 text-center">${idx < 3 ? medals[idx] : `#${idx + 1}`}</span>
        ${renderAvatarHtml(item.avatar, 'w-10 h-10')}
        <div>
          <span class="font-black text-sm block text-slate-900 dark:text-white">${escapeHtml(item.name)}</span>
          <span class="text-[10px] text-slate-400 block">${item.roundsPlayed} دور بازی</span>
        </div>
      </div>
      <div>
        <span class="font-mono font-black text-base text-amber-500">${item.totalScore} امتیاز</span>
      </div>
    `;
    container.appendChild(li);
  });
  refreshLucideIcons();
}

// ================= SOCKET EVENT LISTENERS =================

socket.on('room_updated', (room) => {
  if (!currentRoom || currentRoom.code !== room.code) return;
  currentRoom = room;
  if (room.gameState === 'LOBBY') {
    updateLobbyView(room);
  }
});

socket.on('returned_to_lobby', () => {
  isFieldWritingActive = false;
  switchView('lobby');
  if (currentRoom) {
    updateLobbyView(currentRoom);
  }
});

socket.on('system_message', ({ text }) => {
  showToast(text);
});

// Phase: Letter Revealing
socket.on('letter_revealing', ({ round, totalRounds, letter }) => {
  switchView('reveal');
  document.getElementById('reveal-round-num').innerText = round;
  const letterEl = document.getElementById('reveal-letter');
  letterEl.innerText = '؟';

  window.sounds.playTick();
  setTimeout(() => {
    letterEl.innerText = letter;
    window.sounds.playLetterReveal();
  }, 1500);
});

// Phase: Round Started
socket.on('round_started', ({ round, totalRounds, letter, roundTime, categories }) => {
  switchView('playing');
  currentCategories = categories;
  currentAnswers = {};
  isFieldWritingActive = true;
  cheatReportSent = false;

  document.getElementById('play-current-letter').innerText = letter;
  document.getElementById('play-current-round').innerText = round;
  document.getElementById('play-total-rounds').innerText = totalRounds;
  document.getElementById('play-timer-seconds').innerText = roundTime > 0 ? roundTime : '∞';

  const grid = document.getElementById('play-inputs-grid');
  grid.innerHTML = '';

  const letterHint = (letter === 'الف') ? 'شروع با «آ» یا «ا»' : `شروع با «${letter}»`;

  categories.forEach((cat, index) => {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-[#121826] border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1.5 focus-within:border-indigo-500 shadow-sm transition';
    card.innerHTML = `
      <label class="block text-xs font-black text-slate-800 dark:text-slate-200">${escapeHtml(cat)}:</label>
      <input type="text" data-cat="${escapeHtml(cat)}" data-idx="${index}"
        placeholder="${escapeHtml(letterHint)}"
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        class="cat-input w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 transition">
    `;
    grid.appendChild(card);
  });

  const inputs = document.querySelectorAll('.cat-input');
  if (inputs.length > 0) inputs[0].focus();

  inputs.forEach(input => {
    // Anti-Cheat: Prevent Paste
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      if (window.sounds) window.sounds.playVote(false);
      showToast('⚠️ چسباندن متن (Paste) مسدود است! کلمه را دستی تایپ کنید.', 3000);
    });

    // Anti-Cheat: Prevent Drop
    input.addEventListener('drop', (e) => {
      e.preventDefault();
      if (window.sounds) window.sounds.playVote(false);
    });

    // Anti-Cheat: Prevent Right-Click Context Menu
    input.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showToast('⚠️ راست‌کلیک در حین مسابقه غیرفعال است.', 2000);
    });

    input.addEventListener('input', () => {
      const cat = input.dataset.cat;
      currentAnswers[cat] = input.value;

      const filledCount = Object.values(currentAnswers).filter(v => v && v.trim().length > 0).length;
      socket.emit('update_progress', { filledCount });
    });

    input.addEventListener('keydown', (e) => {
      // Anti-Cheat: Block Ctrl+V / Cmd+V / Shift+Insert
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'v' || e.code === 'KeyV')) {
        e.preventDefault();
        if (window.sounds) window.sounds.playVote(false);
        showToast('⚠️ کپی-پیست در مسابقه غیرمجاز است!', 2500);
        return;
      }
      if (e.shiftKey && e.key === 'Insert') {
        e.preventDefault();
        if (window.sounds) window.sounds.playVote(false);
        showToast('⚠️ کپی-پیست در مسابقه غیرمجاز است!', 2500);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const nextIdx = parseInt(input.dataset.idx) + 1;
        if (nextIdx < inputs.length) {
          inputs[nextIdx].focus();
        } else {
          document.getElementById('btn-stop-action').focus();
        }
      }
    });
  });

  refreshLucideIcons();
});

socket.on('timer_tick', ({ secondsLeft }) => {
  const timerEl = document.getElementById('play-timer-seconds');
  timerEl.innerText = secondsLeft;
  if (secondsLeft <= 10) {
    timerEl.classList.add('text-red-500');
    window.sounds.playTick();
  } else {
    timerEl.classList.remove('text-red-500');
  }
});

// The Stop Button Action
function triggerStopAction() {
  window.sounds.playStopAlarm();
  document.querySelectorAll('.cat-input').forEach(inp => {
    currentAnswers[inp.dataset.cat] = inp.value;
  });
  socket.emit('submit_answers', { answers: currentAnswers });
  socket.emit('press_stop');
}

// Stop Countdown Triggered
socket.on('stop_triggered', ({ stopper, secondsLeft }) => {
  window.sounds.playStopAlarm();
  document.getElementById('stop-caller-name').innerText = stopper;
  document.getElementById('stop-seconds-left').innerText = secondsLeft;
  document.getElementById('stop-overlay-banner').classList.remove('hidden');
  refreshLucideIcons();
});

socket.on('stop_countdown_tick', ({ secondsLeft }) => {
  window.sounds.playTick();
  document.getElementById('stop-seconds-left').innerText = secondsLeft;
});

// Final collection before voting
socket.on('time_up_collect_answers', () => {
  document.getElementById('stop-overlay-banner').classList.add('hidden');
  document.querySelectorAll('.cat-input').forEach(inp => {
    currentAnswers[inp.dataset.cat] = inp.value;
  });
  socket.emit('submit_answers', { answers: currentAnswers });
});

// Phase: Voting & Dispute Screen (Democratic voting system)
socket.on('voting_started', ({ letter, evaluation, stopper, players }) => {
  isFieldWritingActive = false;
  switchView('voting');
  window.sounds.playVote(true);

  if (isHost) {
    document.getElementById('voting-host-actions').classList.remove('hidden');
  } else {
    document.getElementById('voting-host-actions').classList.add('hidden');
  }

  const container = document.getElementById('voting-categories-container');
  container.innerHTML = '';

  Object.keys(evaluation).forEach(cat => {
    const list = evaluation[cat];
    const catCard = document.createElement('div');
    catCard.className = 'bg-white dark:bg-[#121826] border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3 shadow-sm transition-colors';

    let entriesHTML = '';
    list.forEach(entry => {
      const isMe = entry.playerId === myPlayer.id;
      const safeId = `${encodeURIComponent(cat)}-${encodeURIComponent(entry.playerId)}`;
      const isRejected = entry.finalPoints === 0 && !entry.empty;

      let badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      let tagText = `+${entry.finalPoints} امتیاز`;

      if (entry.empty) {
        badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700';
        tagText = 'خالی (۰)';
      } else if (!entry.startsCorrect) {
        badgeColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
        tagText = 'حرف اشتباه (۰)';
      } else if (isRejected) {
        badgeColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
        tagText = 'رد شد ❌ (۰)';
      } else if (entry.isSolo) {
        badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
        tagText = 'تک‌خال (+۲۰)';
      } else if (entry.isDuplicate) {
        badgeColor = 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
        tagText = 'تکراری (+۵)';
      }

      const wordStyle = isRejected ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white';
      const rowBorder = isRejected ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/80';

      const myVote = entry.votes ? entry.votes[myPlayer.id] : undefined;

      entriesHTML += `
        <div id="row-${safeId}" class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-2xl border-2 ${rowBorder} gap-2 transition">
          <div class="flex items-center gap-3">
            ${renderAvatarHtml(entry.avatar, 'w-9 h-9')}
            <span class="text-xs font-black ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}">${escapeHtml(entry.playerName)}:</span>
            <span id="word-${safeId}" class="text-sm font-black px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 ${wordStyle}">
              ${escapeHtml(entry.word) || '---'}
            </span>
            <span class="text-[11px] font-black px-2.5 py-1 rounded-xl border ${badgeColor}" id="badge-${safeId}">
              ${tagText}
            </span>
            <span id="votecount-${safeId}" class="text-[10px] font-mono font-black px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
              ❌ ۰  ✔️ ۰
            </span>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-auto">
            ${!isMe && !entry.empty ? `
              <button id="btn-reject-${safeId}" onclick="voteAnswer('${escapeHtml(cat)}', '${escapeHtml(entry.playerId)}', false)" class="tactile-btn ${myVote === false ? 'tactile-danger text-white' : 'tactile-secondary bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-2 border-slate-200 dark:border-slate-700'} px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5" title="رای به رد این کلمه">
                <i data-lucide="x" class="w-3.5 h-3.5 stroke-[3]"></i>
                <span>رد</span>
              </button>
              <button id="btn-accept-${safeId}" onclick="voteAnswer('${escapeHtml(cat)}', '${escapeHtml(entry.playerId)}', true)" class="tactile-btn ${myVote === true ? 'tactile-success text-white' : 'tactile-secondary bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-2 border-slate-200 dark:border-slate-700'} px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5" title="رای به تایید این کلمه">
                <i data-lucide="check" class="w-3.5 h-3.5 stroke-[3]"></i>
                <span>قبول</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });

    catCard.innerHTML = `
      <div class="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800/80 pb-2">
        <span class="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <i data-lucide="tag" class="w-3.5 h-3.5 text-indigo-500"></i>
          <span>${escapeHtml(cat)} (حرف «${escapeHtml(letter)}»)</span>
        </span>
      </div>
      <div class="space-y-2">
        ${entriesHTML}
      </div>
    `;
    container.appendChild(catCard);
  });

  refreshLucideIcons();
});

function voteAnswer(category, targetPlayerId, isValid) {
  window.sounds.playVote(isValid);
  socket.emit('vote_answer', { category, targetPlayerId, isValid });
}

socket.on('vote_updated', ({ category, targetPlayerId, votes, downvotes, upvotes, finalPoints, isRejected, basePoints }) => {
  const safeId = `${encodeURIComponent(category)}-${encodeURIComponent(targetPlayerId)}`;
  const badge = document.getElementById(`badge-${safeId}`);
  const word = document.getElementById(`word-${safeId}`);
  const row = document.getElementById(`row-${safeId}`);
  const voteCount = document.getElementById(`votecount-${safeId}`);
  const btnReject = document.getElementById(`btn-reject-${safeId}`);
  const btnAccept = document.getElementById(`btn-accept-${safeId}`);

  if (voteCount) {
    voteCount.innerText = `❌ ${downvotes || 0}  ✔️ ${upvotes || 0}`;
  }

  if (votes && btnReject && btnAccept) {
    const myVote = votes[myPlayer.id];
    if (myVote === false) {
      btnReject.className = 'tactile-btn tactile-danger text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm';
      btnAccept.className = 'tactile-btn tactile-secondary bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-2 border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5';
    } else if (myVote === true) {
      btnAccept.className = 'tactile-btn tactile-success text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm';
      btnReject.className = 'tactile-btn tactile-secondary bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-2 border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5';
    } else {
      btnReject.className = 'tactile-btn tactile-secondary bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-2 border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5';
      btnAccept.className = 'tactile-btn tactile-secondary bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-2 border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5';
    }
  }

  if (badge) {
    if (finalPoints === 0) {
      badge.innerText = 'رد شد ❌ (۰)';
      badge.className = 'text-[11px] font-black px-2.5 py-1 rounded-xl border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      if (word) word.className = 'text-sm font-black px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 line-through text-slate-400 dark:text-slate-500';
      if (row) row.className = 'flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-2xl border-2 border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 gap-2 transition';
    } else {
      badge.innerText = `+${finalPoints} امتیاز`;
      badge.className = 'text-[11px] font-black px-2.5 py-1 rounded-xl border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      if (word) word.className = 'text-sm font-black px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white';
      if (row) row.className = 'flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/80 gap-2 transition';
    }
    refreshLucideIcons();
  }
});

// Finalize scores
function finalizeScores() {
  window.sounds.playSuccess();
  socket.emit('finalize_scores');
}

// Return to Lobby for Next Round
function returnToLobby() {
  window.sounds.playClick();
  socket.emit('return_to_lobby');
}

// Phase: Round Summary
socket.on('round_summary_started', ({ round, roundScores, players, isFinalRound }) => {
  isFieldWritingActive = false;
  switchView('summary');
  window.sounds.playSuccess();
  document.getElementById('summary-round-num').innerText = round;

  if (isHost) {
    document.getElementById('summary-host-actions').classList.remove('hidden');
  } else {
    document.getElementById('summary-host-actions').classList.add('hidden');
  }

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const list = document.getElementById('summary-scoreboard-list');
  list.innerHTML = '';

  const rankMedals = ['🥇', '🥈', '🥉'];
  sorted.forEach((p, idx) => {
    const earnedThisRound = roundScores[p.id] || 0;
    const isMe = p.id === myPlayer.id;
    const li = document.createElement('li');
    li.className = `flex items-center justify-between p-3.5 rounded-2xl border-2 transition ${
      isMe
        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
    }`;
    li.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-base font-black w-6 text-center">${idx < 3 ? rankMedals[idx] : `#${idx + 1}`}</span>
        ${renderAvatarHtml(p.avatar, 'w-10 h-10')}
        <div>
          <span class="font-black text-sm block">${escapeHtml(p.name)} ${isMe ? '(شما)' : ''}</span>
          <span class="text-[10px] text-slate-400 block">${escapeHtml(getAvatarById(p.avatar).name)}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-emerald-600 dark:text-emerald-400 text-xs font-black">+${earnedThisRound} این دور</span>
        <span class="font-mono text-base font-black text-slate-900 dark:text-white">${p.score} کل</span>
      </div>
    `;
    list.appendChild(li);
  });

  refreshLucideIcons();
});

// Phase: Game Over
socket.on('game_over', ({ players }) => {
  isFieldWritingActive = false;
  switchView('gameOver');
  window.sounds.playWinner();

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const podium = document.getElementById('game-over-podium');
  podium.innerHTML = '';

  const rankTitles = ['قهرمان اول 🥇', 'نفر دوم 🥈', 'نفر سوم 🥉'];
  sorted.forEach((p, idx) => {
    const isMe = p.id === myPlayer.id;
    const card = document.createElement('div');
    card.className = `p-4 rounded-3xl border-2 flex items-center justify-between shadow-sm ${
      idx === 0
        ? 'bg-amber-500/10 border-amber-500/40'
        : 'bg-white dark:bg-[#121826] border-slate-200 dark:border-slate-800'
    }`;
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-xs font-black px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          ${idx < 3 ? rankTitles[idx] : `رتبه #${idx + 1}`}
        </span>
        ${renderAvatarHtml(p.avatar, 'w-12 h-12')}
        <div class="text-right">
          <span class="font-black text-base block ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}">${escapeHtml(p.name)}</span>
          <span class="text-xs text-slate-500 dark:text-slate-400">${p.score} امتیاز کل</span>
        </div>
      </div>
      <div>
        <span class="text-3xl font-black font-mono text-amber-500">${p.score}</span>
      </div>
    `;
    podium.appendChild(card);
  });

  if (isHost) {
    document.getElementById('game-over-host-actions').classList.remove('hidden');
  } else {
    document.getElementById('game-over-host-actions').classList.add('hidden');
  }

  refreshLucideIcons();
});

// ================= ANTI-CHEAT DETECTION ENGINE =================
let isFieldWritingActive = false;
let cheatReportSent = false;

function reportTabSwitch(detail) {
  if (!isFieldWritingActive || cheatReportSent) return;
  cheatReportSent = true;
  isFieldWritingActive = false;
  socket.emit('cheat_tab_switched', { detail: detail });
}

// 1. Visibility change (tab switch, minimizing browser, home button on phone)
document.addEventListener('visibilitychange', () => {
  if (isFieldWritingActive && document.visibilityState === 'hidden') {
    reportTabSwitch('خروج از تب بازی یا جابجایی برنامه');
  }
});

// 2. Window blur (leaving window focus on desktop)
window.addEventListener('blur', () => {
  if (!isFieldWritingActive) return;
  setTimeout(() => {
    if (isFieldWritingActive && (document.hidden || !document.hasFocus())) {
      reportTabSwitch('از دست رفتن تمرکز پنجره مسابقه');
    }
  }, 700);
});

// 3. Global paste blocker during active gameplay
window.addEventListener('paste', (e) => {
  if (isFieldWritingActive) {
    e.preventDefault();
    if (window.sounds) window.sounds.playVote(false);
    showToast('⚠️ کپی-پیست در حین مسابقه غیرمجاز است!', 2500);
  }
});

// Broadcast notification when any player is kicked
socket.on('player_kicked_announcement', ({ playerName, reason }) => {
  if (window.sounds) window.sounds.playKickAlert();
  showLiveKickBanner(playerName, reason);
});

// Cheater was kicked by server
socket.on('kicked_by_anticheat', ({ reason }) => {
  isFieldWritingActive = false;
  currentRoom = null;
  switchView('home');
  if (window.sounds) window.sounds.playKickAlert();
  showKickedModal(reason);
});

function showLiveKickBanner(playerName, reason) {
  const banner = document.getElementById('live-kick-banner');
  const desc = document.getElementById('live-kick-desc');
  if (!banner || !desc) return;
  desc.innerText = `بازیکن «${playerName}» به دلیل خروج از صفحه و سرچ اخراج شد!`;
  banner.classList.remove('hidden', '-translate-y-6', 'opacity-0');
  banner.classList.add('translate-y-0', 'opacity-100');
  refreshLucideIcons();
  setTimeout(() => {
    banner.classList.remove('translate-y-0', 'opacity-100');
    banner.classList.add('-translate-y-6', 'opacity-0');
    setTimeout(() => banner.classList.add('hidden'), 350);
  }, 4500);
}

function showKickedModal(reason) {
  const modal = document.getElementById('modal-kicked');
  const reasonEl = document.getElementById('modal-kicked-reason');
  if (reasonEl && reason) reasonEl.innerText = reason;
  if (modal) {
    modal.classList.remove('hidden');
    refreshLucideIcons();
  }
}

function closeKickedModal() {
  const modal = document.getElementById('modal-kicked');
  if (modal) modal.classList.add('hidden');
  switchView('home');
}
