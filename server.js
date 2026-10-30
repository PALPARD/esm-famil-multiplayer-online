const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Disable Express fingerprinting header
app.disable('x-powered-by');

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const io = new Server(server, {
  cors: { origin: '*' },
  maxHttpBufferSize: 1e5 // 100 KB payload limit to protect against memory exhaustion
});

const PORT = process.env.PORT || 3000;

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Whitelist of allowed vector avatar IDs
const VALID_AVATAR_IDS = new Set([
  'fox', 'bot', 'cat', 'ninja', 'bear', 'lion', 'ghost', 'falcon', 'alien', 'wizard', 'dragon', 'pilot'
]);

function sanitizeAvatar(avatarId) {
  if (typeof avatarId !== 'string') return 'fox';
  return VALID_AVATAR_IDS.has(avatarId.trim()) ? avatarId.trim() : 'fox';
}

function sanitizeName(name, fallback = 'بازیکن') {
  if (typeof name !== 'string') return fallback;
  const trimmed = name.trim().slice(0, 20);
  const clean = trimmed.replace(/[\u0000-\u001F\u007F-\u009F<>]/g, '');
  if (clean === '__proto__' || clean === 'constructor' || clean === 'prototype') {
    return fallback;
  }
  return clean.length > 0 ? clean : fallback;
}

function sanitizeRoomCode(code) {
  if (typeof code !== 'string') return '';
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

// Socket Rate Limiting (Token Bucket)
const socketEventTracker = new WeakMap();
function checkRateLimit(socket, maxEventsPerSec = 40) {
  const now = Date.now();
  let record = socketEventTracker.get(socket);
  if (!record || now - record.resetTime > 1000) {
    record = { count: 1, resetTime: now };
    socketEventTracker.set(socket, record);
    return true;
  }
  record.count++;
  return record.count <= maxEventsPerSec;
}

// Persistent Global Leaderboard
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

function loadLeaderboard() {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load leaderboard:', e);
  }
  return Object.create(null);
}

function saveLeaderboard(data) {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save leaderboard:', e);
  }
}

function recordPlayerScore(name, avatar, pointsGained) {
  if (!name || typeof pointsGained !== 'number' || isNaN(pointsGained)) return;
  const cleanName = sanitizeName(name);
  if (!cleanName || cleanName === '__proto__' || cleanName === 'constructor' || cleanName === 'prototype') return;

  const lb = loadLeaderboard();
  if (!Object.prototype.hasOwnProperty.call(lb, cleanName)) {
    lb[cleanName] = {
      name: cleanName,
      avatar: sanitizeAvatar(avatar),
      totalScore: 0,
      roundsPlayed: 0
    };
  }
  lb[cleanName].avatar = sanitizeAvatar(avatar);
  lb[cleanName].totalScore = Math.min(1000000, Math.max(0, lb[cleanName].totalScore + pointsGained));
  lb[cleanName].roundsPlayed += 1;
  saveLeaderboard(lb);
}

function getTopLeaderboard(limit = 15) {
  const lb = loadLeaderboard();
  return Object.values(lb)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, Math.min(limit, 50));
}

// Default Persian letters for gameplay
const ALL_PERSIAN_LETTERS = [
  'الف', 'ب', 'پ', 'ت', 'ج', 'چ', 'ح', 'خ',
  'د', 'ر', 'ز', 'س', 'ش', 'ص', 'ط', 'ع',
  'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن', 'و', 'ه', 'ی'
];

const DEFAULT_CATEGORIES = [
  'نام', 'شهر', 'شهرت', 'کشور', 'غذا', 'میوه', 'حیوان', 'اشیاء', 'ماشین', 'گل', 'شغل'
];

// In-memory room store
const rooms = Object.create(null);

function normalizePersian(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[ك]/g, 'ک')
    .replace(/[ي]/g, 'ی')
    .replace(/[آإأ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/\s+/g, ' ');
}

function checkStartsWith(word, letter) {
  if (!word || !letter) return false;
  const cleanWord = word.trim().replace(/[ك]/g, 'ک').replace(/[ي]/g, 'ی');
  const cleanLetter = letter.trim().replace(/[ك]/g, 'ک').replace(/[ي]/g, 'ی');

  // Alef special case: accepts any word starting with ا, آ, أ, إ, ء
  if (cleanLetter === 'الف' || cleanLetter === 'ا' || cleanLetter === 'آ' || cleanLetter === 'أ' || cleanLetter === 'إ') {
    const firstChar = cleanWord.charAt(0);
    return ['ا', 'آ', 'أ', 'إ', 'ء'].includes(firstChar);
  }

  // Strict match for all other letters
  const targetChar = cleanLetter.charAt(0);
  const wordChar = cleanWord.charAt(0);
  return wordChar === targetChar;
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function sanitizeSettings(settings) {
  const clean = {};
  const tr = parseInt(settings?.totalRounds);
  clean.totalRounds = (!isNaN(tr) && tr >= 1 && tr <= 20) ? tr : 5;

  const rt = parseInt(settings?.roundTime);
  clean.roundTime = (!isNaN(rt) && rt >= 0 && rt <= 300) ? rt : 60;

  if (Array.isArray(settings?.categories)) {
    const filtered = settings.categories
      .filter(c => typeof c === 'string' && c.trim().length > 0 && c.trim().length <= 25)
      .map(c => c.trim().replace(/[<>]/g, ''))
      .slice(0, 15);
    clean.categories = filtered.length >= 3 ? filtered : DEFAULT_CATEGORIES.slice(0, 6);
  } else {
    clean.categories = DEFAULT_CATEGORIES.slice(0, 6);
  }

  clean.letters = ALL_PERSIAN_LETTERS;
  clean.allowStop = true;
  return clean;
}

function evaluateRound(room) {
  const letter = room.currentLetter;
  const categories = room.settings.categories;
  const players = room.players;

  const evaluation = {};

  categories.forEach(cat => {
    evaluation[cat] = [];
    const wordCounts = {};

    players.forEach(p => {
      const rawWord = (room.answers[p.id] && room.answers[p.id][cat]) ? room.answers[p.id][cat].trim() : '';
      const normWord = normalizePersian(rawWord);
      const startsCorrect = rawWord.length > 0 && checkStartsWith(rawWord, letter);

      if (startsCorrect) {
        wordCounts[normWord] = (wordCounts[normWord] || 0) + 1;
      }

      evaluation[cat].push({
        playerId: p.id,
        playerName: p.name,
        avatar: p.avatar,
        word: rawWord,
        normWord: normWord,
        startsCorrect: startsCorrect,
        empty: rawWord.length === 0,
        isDuplicate: false,
        isSolo: false,
        basePoints: 0,
        manualOverride: null,
        votes: {},
        finalPoints: 0
      });
    });

    const validEntries = evaluation[cat].filter(e => e.startsCorrect);

    evaluation[cat].forEach(entry => {
      if (!entry.startsCorrect) {
        entry.basePoints = 0;
      } else {
        const count = wordCounts[entry.normWord] || 0;
        if (count > 1) {
          entry.isDuplicate = true;
          entry.basePoints = 5;
        } else if (validEntries.length === 1 && players.length > 1) {
          entry.isSolo = true;
          entry.basePoints = 20;
        } else {
          entry.basePoints = 10;
        }
      }
      entry.finalPoints = entry.basePoints;
    });
  });

  return evaluation;
}

function computeFinalPointsForCategory(entry, totalPlayers) {
  if (entry.manualOverride !== null && entry.manualOverride !== undefined) {
    return entry.manualOverride;
  }
  const voteVals = Object.values(entry.votes || {});
  const downvotes = voteVals.filter(v => v === false).length;
  const upvotes = voteVals.filter(v => v === true).length;

  if (downvotes > upvotes) {
    return 0;
  }
  return entry.basePoints;
}

io.on('connection', (socket) => {
  // Global Leaderboard request
  socket.on('get_global_leaderboard', (callback) => {
    if (!checkRateLimit(socket)) return;
    if (typeof callback === 'function') {
      callback(getTopLeaderboard(15));
    }
  });

  // Create Room
  socket.on('create_room', ({ hostName, avatar, settings }, callback) => {
    if (!checkRateLimit(socket)) return;

    let code = generateRoomCode();
    while (rooms[code]) code = generateRoomCode();

    const sanitizedSettings = sanitizeSettings(settings);
    const hostPlayer = {
      id: socket.id,
      name: sanitizeName(hostName, 'میزبان'),
      avatar: sanitizeAvatar(avatar),
      isHost: true,
      score: 0,
      roundScores: [],
      ready: true,
      connected: true
    };

    rooms[code] = {
      code: code,
      hostId: socket.id,
      players: [hostPlayer],
      settings: sanitizedSettings,
      gameState: 'LOBBY',
      currentRound: 0,
      currentLetter: '',
      usedLetters: [],
      timer: 0,
      timerInterval: null,
      stopper: null,
      answers: {},
      playerProgress: {},
      evaluation: null,
      chat: []
    };

    socket.join(code);
    socket.roomCode = code;

    if (typeof callback === 'function') {
      callback({
        success: true,
        roomCode: code,
        player: hostPlayer,
        room: sanitizeRoom(rooms[code])
      });
    }
  });

  // Join Room
  socket.on('join_room', ({ roomCode, playerName, avatar }, callback) => {
    if (!checkRateLimit(socket)) return;

    const code = sanitizeRoomCode(roomCode);
    const room = rooms[code];

    if (!room) {
      if (typeof callback === 'function') callback({ success: false, message: 'اتاق با این کد یافت نشد!' });
      return;
    }

    const cleanPlayerName = sanitizeName(playerName, `بازیکن ${room.players.length + 1}`);

    if (room.gameState !== 'LOBBY' && !room.players.some(p => p.id === socket.id || p.name === cleanPlayerName)) {
      if (typeof callback === 'function') callback({ success: false, message: 'بازی در حال حاضر شروع شده است!' });
      return;
    }

    let player = room.players.find(p => p.name === cleanPlayerName);
    if (player) {
      player.id = socket.id;
      player.connected = true;
      if (player.isHost) {
        room.hostId = socket.id;
      }
    } else {
      player = {
        id: socket.id,
        name: cleanPlayerName,
        avatar: sanitizeAvatar(avatar),
        isHost: false,
        score: 0,
        roundScores: [],
        ready: true,
        connected: true
      };
      room.players.push(player);
    }

    socket.join(code);
    socket.roomCode = code;

    io.to(code).emit('room_updated', sanitizeRoom(room));
    io.to(code).emit('system_message', { text: `${player.name} به اتاق ملحق شد!` });

    if (typeof callback === 'function') {
      callback({
        success: true,
        roomCode: code,
        player: player,
        room: sanitizeRoom(room)
      });
    }
  });

  socket.on('update_settings', ({ settings }) => {
    if (!checkRateLimit(socket)) return;
    const room = rooms[socket.roomCode];
    if (!room || room.gameState !== 'LOBBY') return;
    const isCallerHost = room.hostId === socket.id || room.players.find(p => p.id === socket.id && p.isHost);
    if (!isCallerHost) return;

    room.settings = sanitizeSettings(settings);
    io.to(room.code).emit('room_updated', sanitizeRoom(room));
  });

  socket.on('start_game', () => {
    if (!checkRateLimit(socket)) return;
    const room = rooms[socket.roomCode];
    if (!room) return;
    const isCallerHost = room.hostId === socket.id || room.players.find(p => p.id === socket.id && p.isHost);
    if (!isCallerHost) return;

    startNextRound(room);
  });

  socket.on('update_progress', ({ filledCount }) => {
    if (!checkRateLimit(socket)) return;
    const room = rooms[socket.roomCode];
    if (!room || room.gameState !== 'PLAYING') return;

    const count = parseInt(filledCount) || 0;
    room.playerProgress[socket.id] = count;
    socket.to(room.code).emit('player_progress_updated', {
      playerId: socket.id,
      filledCount: count,
      totalCount: room.settings.categories.length
    });
  });

  socket.on('submit_answers', ({ answers }) => {
    if (!checkRateLimit(socket)) return;
    const room = rooms[socket.roomCode];
    if (!room) return;

    const cleanAnswers = {};
    if (answers && typeof answers === 'object' && !Array.isArray(answers)) {
      const keys = Object.keys(answers).slice(0, 25);
      for (const k of keys) {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
        const val = answers[k];
        if (typeof val === 'string') {
          cleanAnswers[k] = val.trim().slice(0, 60);
        }
      }
    }
    room.answers[socket.id] = cleanAnswers;
  });

  // Anti-Cheat: Tab-Switch / Out-of-Page Detection during active gameplay
  socket.on('cheat_tab_switched', ({ detail } = {}) => {
    const room = rooms[socket.roomCode];
    if (!room) return;

    // Only kick if actively playing or in stop countdown
    if (room.gameState !== 'PLAYING' && room.gameState !== 'STOP_COUNTDOWN') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const kickedPlayerName = player.name;
    const kickedSocketId = socket.id;

    console.log(`[AntiCheat] Kicking ${kickedPlayerName} (${kickedSocketId}) from room ${room.code} for: ${detail || 'Tab Switch'}`);

    // 1. Kick the player and notify them
    socket.emit('kicked_by_anticheat', {
      reason: 'خروج از تب بازی یا جابجایی بین برنامه‌ها در حین زمان مسابقه'
    });

    // 2. Remove player from active room data
    room.players = room.players.filter(p => p.id !== kickedSocketId);
    delete room.playerProgress[kickedSocketId];
    delete room.answers[kickedSocketId];
    socket.leave(room.code);
    socket.roomCode = null;

    // 3. Announce to all remaining players in the room
    io.to(room.code).emit('player_kicked_announcement', {
      playerName: kickedPlayerName,
      reason: 'خروج از صفحه بازی و تلاش برای سرچ در تب دیگر'
    });

    // 4. Migrate host if the kicked player was the host
    if (room.hostId === kickedSocketId) {
      const nextHost = room.players.find(p => p.connected);
      if (nextHost) {
        nextHost.isHost = true;
        room.hostId = nextHost.id;
      }
    }

    // 5. Update room state or cleanup
    if (room.players.length === 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      delete rooms[room.code];
    } else {
      io.to(room.code).emit('room_updated', sanitizeRoom(room));
    }
  });

  socket.on('press_stop', () => {
    if (!checkRateLimit(socket)) return;
    const room = rooms[socket.roomCode];
    if (!room || room.gameState !== 'PLAYING') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    room.gameState = 'STOP_COUNTDOWN';
    room.stopper = player.name;

    let stopTimeLeft = 5;
    io.to(room.code).emit('stop_triggered', {
      stopper: player.name,
      secondsLeft: stopTimeLeft
    });

    if (room.timerInterval) clearInterval(room.timerInterval);

    room.timerInterval = setInterval(() => {
      stopTimeLeft--;
      io.to(room.code).emit('stop_countdown_tick', { secondsLeft: stopTimeLeft });

      if (stopTimeLeft <= 0) {
        clearInterval(room.timerInterval);
        enterVotingPhase(room);
      }
    }, 1000);
  });

  // Dispute / Voting with live vote counting and democratic majority
  socket.on('vote_answer', ({ category, targetPlayerId, isValid }) => {
    if (!checkRateLimit(socket)) return;
    const room = rooms[socket.roomCode];
    if (!room || room.gameState !== 'VOTING' || !room.evaluation) return;

    const catList = room.evaluation[category];
    if (!catList) return;

    const entry = catList.find(e => e.playerId === targetPlayerId);
    if (!entry) return;

    // A player cannot vote on their own word
    if (entry.playerId === socket.id) return;

    // Toggle vote if clicking same choice again
    if (entry.votes[socket.id] === isValid) {
      delete entry.votes[socket.id];
    } else {
      entry.votes[socket.id] = Boolean(isValid);
    }

    entry.manualOverride = null;
    entry.finalPoints = computeFinalPointsForCategory(entry, room.players.length);

    const voteVals = Object.values(entry.votes || {});
    const downvotes = voteVals.filter(v => v === false).length;
    const upvotes = voteVals.filter(v => v === true).length;

    io.to(room.code).emit('vote_updated', {
      category,
      targetPlayerId,
      votes: entry.votes,
      downvotes,
      upvotes,
      finalPoints: entry.finalPoints,
      isRejected: entry.finalPoints === 0,
      basePoints: entry.basePoints
    });
  });

  socket.on('override_points', ({ category, targetPlayerId, points }) => {
    if (!checkRateLimit(socket)) return;
    const room = rooms[socket.roomCode];
    if (!room || room.gameState !== 'VOTING' || !room.evaluation) return;
    const isCallerHost = room.hostId === socket.id || room.players.find(p => p.id === socket.id && p.isHost);
    if (!isCallerHost) return;

    const catList = room.evaluation[category];
    if (!catList) return;

    const entry = catList.find(e => e.playerId === targetPlayerId);
    if (entry) {
      const p = Math.max(0, Math.min(50, parseInt(points) || 0));
      entry.manualOverride = p;
      entry.finalPoints = p;

      io.to(room.code).emit('override_updated', {
        category,
        targetPlayerId,
        finalPoints: entry.finalPoints
      });
    }
  });

  // Finalize Scores for the Round
  socket.on('finalize_scores', () => {
    if (!checkRateLimit(socket)) return;
    const room = rooms[socket.roomCode];
    if (!room || room.gameState !== 'VOTING') return;

    const isCallerHost = room.hostId === socket.id || room.players.find(p => p.id === socket.id && p.isHost);
    if (!isCallerHost && room.players.some(p => p.connected && p.isHost)) {
      return;
    }

    const roundScores = {};
    room.players.forEach(p => {
      roundScores[p.id] = 0;
    });

    Object.keys(room.evaluation).forEach(cat => {
      room.evaluation[cat].forEach(entry => {
        roundScores[entry.playerId] = (roundScores[entry.playerId] || 0) + entry.finalPoints;
      });
    });

    room.players.forEach(p => {
      const earned = roundScores[p.id] || 0;
      p.roundScores.push(earned);
      p.score += earned;
      recordPlayerScore(p.name, p.avatar, earned);
    });

    room.gameState = 'ROUND_SUMMARY';
    io.to(room.code).emit('round_summary_started', {
      round: room.currentRound,
      roundScores: roundScores,
      players: room.players,
      isFinalRound: room.currentRound >= room.settings.totalRounds
    });
  });

  // Return to Lobby while preserving cumulative scores
  socket.on('return_to_lobby', () => {
    if (!checkRateLimit(socket)) return;
    const room = rooms[socket.roomCode];
    if (!room) return;
    const isCallerHost = room.hostId === socket.id || room.players.find(p => p.id === socket.id && p.isHost);
    if (!isCallerHost) return;

    room.gameState = 'LOBBY';
    io.to(room.code).emit('room_updated', sanitizeRoom(room));
    io.to(room.code).emit('returned_to_lobby');
  });

  socket.on('next_round', () => {
    if (!checkRateLimit(socket)) return;
    const room = rooms[socket.roomCode];
    if (!room) return;
    const isCallerHost = room.hostId === socket.id || room.players.find(p => p.id === socket.id && p.isHost);
    if (!isCallerHost) return;

    if (room.currentRound >= room.settings.totalRounds) {
      room.gameState = 'GAME_OVER';
      io.to(room.code).emit('game_over', { players: room.players });
    } else {
      startNextRound(room);
    }
  });

  socket.on('rematch', () => {
    if (!checkRateLimit(socket)) return;
    const room = rooms[socket.roomCode];
    if (!room) return;
    const isCallerHost = room.hostId === socket.id || room.players.find(p => p.id === socket.id && p.isHost);
    if (!isCallerHost) return;

    room.currentRound = 0;
    room.usedLetters = [];
    room.gameState = 'LOBBY';
    room.players.forEach(p => {
      p.score = 0;
      p.roundScores = [];
    });

    io.to(room.code).emit('room_updated', sanitizeRoom(room));
    io.to(room.code).emit('returned_to_lobby');
  });

  socket.on('disconnect', () => {
    const room = rooms[socket.roomCode];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.connected = false;

      if (room.gameState === 'LOBBY') {
        room.players = room.players.filter(p => p.id !== socket.id);
      } else if (room.gameState === 'PLAYING' || room.gameState === 'STOP_COUNTDOWN') {
        room.players = room.players.filter(p => p.id !== socket.id);
        delete room.playerProgress[socket.id];
        delete room.answers[socket.id];
        io.to(room.code).emit('player_kicked_announcement', {
          playerName: player.name,
          reason: 'بستن تب یا قطع ارتباط در حین مسابقه'
        });
      }

      if (room.hostId === socket.id) {
        const nextHost = room.players.find(p => p.connected);
        if (nextHost) {
          nextHost.isHost = true;
          room.hostId = nextHost.id;
        }
      }

      const hasOnline = room.players.some(p => p.connected);
      if (!hasOnline) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        setTimeout(() => {
          if (!room.players.some(p => p.connected)) {
            delete rooms[room.code];
          }
        }, 300000);
      } else {
        io.to(room.code).emit('room_updated', sanitizeRoom(room));
      }
    }
  });
});

function startNextRound(room) {
  room.currentRound++;
  room.answers = {};
  room.playerProgress = {};
  room.stopper = null;
  room.evaluation = null;

  const availableLetters = room.settings.letters.filter(l => !room.usedLetters.includes(l));
  const pool = availableLetters.length > 0 ? availableLetters : room.settings.letters;
  const pickedLetter = pool[Math.floor(Math.random() * pool.length)];

  room.currentLetter = pickedLetter;
  room.usedLetters.push(pickedLetter);
  room.gameState = 'LETTER_REVEAL';

  io.to(room.code).emit('letter_revealing', {
    round: room.currentRound,
    totalRounds: room.settings.totalRounds,
    letter: pickedLetter
  });

  setTimeout(() => {
    room.gameState = 'PLAYING';
    room.timer = room.settings.roundTime;

    io.to(room.code).emit('round_started', {
      round: room.currentRound,
      totalRounds: room.settings.totalRounds,
      letter: pickedLetter,
      roundTime: room.settings.roundTime,
      categories: room.settings.categories
    });

    if (room.settings.roundTime > 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      room.timerInterval = setInterval(() => {
        room.timer--;
        io.to(room.code).emit('timer_tick', { secondsLeft: room.timer });

        if (room.timer <= 0) {
          clearInterval(room.timerInterval);
          enterVotingPhase(room);
        }
      }, 1000);
    }
  }, 3500);
}

function enterVotingPhase(room) {
  if (room.timerInterval) clearInterval(room.timerInterval);
  room.gameState = 'VOTING';

  io.to(room.code).emit('time_up_collect_answers');

  setTimeout(() => {
    room.evaluation = evaluateRound(room);
    io.to(room.code).emit('voting_started', {
      letter: room.currentLetter,
      evaluation: room.evaluation,
      stopper: room.stopper,
      players: room.players
    });
  }, 1000);
}

function sanitizeRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    players: room.players,
    settings: room.settings,
    gameState: room.gameState,
    currentRound: room.currentRound,
    currentLetter: room.currentLetter,
    stopper: room.stopper
  };
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Name-Shahr-Shohrat server is running live on http://0.0.0.0:${PORT}`);
});
