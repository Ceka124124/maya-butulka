'use strict';

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const crypto     = require('crypto');
const path       = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors             : { origin: '*', methods: ['GET','POST'] },
  pingInterval     : 10000,
  pingTimeout      : 25000,
  maxHttpBufferSize: 1e6,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',  '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ══════════════════════════════════════════════════════
   GÖREV KATEGORİLERİ
══════════════════════════════════════════════════════ */
const CHALLENGES = [
  // 🎤 Performans görevleri
  { id:1,  cat:'🎤', text: 'Şarkı söyle!', desc: '30 saniye boyunca herhangi bir şarkı söyle', xp:20 },
  { id:2,  cat:'🎤', text: 'Taklit yap!', desc: 'Odadaki birini taklit et, herkes kim olduğunu bulsun', xp:25 },
  { id:3,  cat:'🎤', text: 'Rap yap!', desc: '15 saniye kendi doğaçlama rapını yap', xp:30 },
  { id:4,  cat:'🎤', text: 'Sesle anlat!', desc: 'Sadece ses çıkararak bir film anlat, herkes bulsun', xp:25 },

  // 🕺 Hareket görevleri
  { id:5,  cat:'🕺', text: 'Dans et!', desc: '20 saniye boyunca dans et, herkes puan versin', xp:20 },
  { id:6,  cat:'🕺', text: 'Dondur!', desc: 'Oda "dur!" diyene kadar komik bir pozda kal', xp:15 },
  { id:7,  cat:'🕺', text: 'Yavaş çekim!', desc: 'Yavaş çekim yürüyüşü ile odanın karşısına geç', xp:20 },
  { id:8,  cat:'🕺', text: 'Robot dansı!', desc: 'Robot gibi dans et - minimum 10 saniye', xp:20 },

  // 🧠 Bilgi & Beceri
  { id:9,  cat:'🧠', text: '5 saniye!', desc: 'Bir kategori seçin, 5 saniyede 3 şey say (hayvanlar, ülkeler, vb)', xp:15 },
  { id:10, cat:'🧠', text: 'Geriye say!', desc: '100\'den 70\'e kadar geriye say, 10 saniye var!', xp:15 },
  { id:11, cat:'🧠', text: 'Kelime oyunu!', desc: 'Sana söylenen harfle başlayan 5 şey say', xp:15 },
  { id:12, cat:'🧠', text: 'Dil bağla!', desc: '"Bir berber bir berbere gel beraber bir berber dükkânı açalım" 3 kez söyle', xp:25 },

  // 😂 Komik görevler
  { id:13, cat:'😂', text: 'Komik yüz!', desc: 'En komik yüz ifadeni 10 saniye tut', xp:15 },
  { id:14, cat:'😂', text: 'Ağla oyunu!', desc: 'Sahte ağlama yap - ikna edici olmalı!', xp:20 },
  { id:15, cat:'😂', text: 'Kahkaha yarışı!', desc: 'Komik bir kahkaha at, herkes not versin', xp:15 },
  { id:16, cat:'😂', text: 'Fotoğraf pozu!', desc: 'En saçma fotoğraf pozunu ver ve 5 saniye tut', xp:15 },

  // 🎨 Yaratıcı
  { id:17, cat:'🎨', text: 'Çiz!', desc: 'Havada parmağınla bir nesne çiz, herkes tahmin etsin', xp:20 },
  { id:18, cat:'🎨', text: 'Heykeli canlandır!', desc: 'Oda sana bir heykel söylesin, onu canlandır', xp:25 },
  { id:19, cat:'🎨', text: 'Reklam yap!', desc: 'Etrafındaki herhangi bir nesne için 15 saniyelik reklam yap', xp:30 },
  { id:20, cat:'🎨', text: 'Röportaj!', desc: 'Sen ünlü birisin, oda seni 30 saniye röportaj yapsın', xp:25 },

  // ❓ Cesur görevler
  { id:21, cat:'❓', text: 'Sır itiraf et!', desc: 'Kimsenin bilmediği küçük bir şey itiraf et', xp:35 },
  { id:22, cat:'❓', text: 'İlk izlenim!', desc: 'Odadaki herkes için ilk izlenimini söyle', xp:30 },
  { id:23, cat:'❓', text: '3 şey söyle!', desc: 'Hayatında değiştirmek istediğin 3 şeyi söyle', xp:25 },
  { id:24, cat:'❓', text: 'Süper güç!', desc: 'Bir süper gücün olsaydı ne olurdu ve neden? Anlat!', xp:20 },
];

const COLORS = [
  '#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff9ff3',
  '#ff9f43','#a29bfe','#fd79a8','#00cec9','#ffeaa7',
  '#74b9ff','#55efc4',
];

const BOTTLES = [
  { id:1, name:'Limonad', link:'https://freesorgupanel.neocities.org/image/1000967528.png', color:'#ffd93d' },
  { id:2, name:'Kola',    link:'https://butilochka.cdnvideo.ru/bottle/bundle/300/b_cola_v2.base.webp?9',     color:'#8B0000' },
  { id:3, name:'Enerji',  link:'https://freesorgupanel.neocities.org/image/1000967367.png',  color:'#00ff88' },
  { id:4, name:'Viski',   link:'https://freesorgupanel.neocities.org/image/1000967523.png', color:'#c8813b' },
  { id:5, name:'Şarap',   link:'https://freesorgupanel.neocities.org/image/1000967525.png',    color:'#8e2040' },
  { id:6, name:'VIP 💎',  link:'https://butilochka.cdnvideo.ru/bottle/bundle/300/b_vip_v2.base.webp?9',     color:'#4d96ff' },
];

const LEVEL_XP = [0,100,250,500,900,1400,2100,3000,4200,5800,8000];

/* ══════════════════════════════════════════════════════
   IN-MEMORY STATE
══════════════════════════════════════════════════════ */
const users   = new Map();
const rooms   = new Map();
const players = new Map();
const msgs    = new Map();
const sockMap = new Map();

let _msgId = 0;
const newMsgId = () => ++_msgId;

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return h | 0;
}

function nameColor(id) {
  return COLORS[Math.abs(hashStr(String(id))) % COLORS.length];
}

function calcLevel(xp) {
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) return i + 1;
  }
  return 1;
}

function getUser(tg_id) {
  if (!users.has(tg_id)) {
    users.set(tg_id, {
      tg_id,
      username   : 'oyuncu',
      first_name : 'Oyuncu',
      photo_url  : '',
      name_color : nameColor(tg_id),
      xp         : 0,
      level      : 1,
      wins       : 0,
      spins      : 0,
      challenges_done: 0,
      bottle_id  : 1,
      sound_on   : 1,
      last_seen  : Date.now(),
    });
  }
  return users.get(tg_id);
}

function grantXP(tg_id, amount) {
  const u      = getUser(tg_id);
  u.xp         = (u.xp || 0) + amount;
  const newLvl = calcLevel(u.xp);
  const leveled = newLvl > u.level;
  u.level      = newLvl;
  return { leveled, level: newLvl };
}

/* ── Room helpers ── */
function roomPlayerMap(rid)  { return players.get(rid) || new Map(); }
function roomPlayerList(rid) { return [...roomPlayerMap(rid).values()]; }
function roomMsgList(rid)    { return msgs.get(rid) || []; }

function pushMsg(rid, msg) {
  if (!msgs.has(rid)) msgs.set(rid, []);
  const list = msgs.get(rid);
  list.push(msg);
  if (list.length > 200) list.splice(0, list.length - 200);
}

function sysMsg(rid, text) {
  const msg = {
    id         : newMsgId(),
    room_id    : rid,
    tg_id      : '',
    username   : '',
    name_color : '#aaa',
    body       : text,
    msg_type   : 'system',
    created_at : Date.now(),
  };
  pushMsg(rid, msg);
  io.to('room:' + rid).emit('new_msg', msg);
}

/* ── Slot helpers ── */
const SLOT_ANGLES = {
  1:330, 2:0,   3:30,  4:60,
  5:90,  6:120, 7:150, 8:180,
  9:210, 10:240,11:270,12:300,
};

function assignSlot(rid) {
  const taken = new Set(roomPlayerList(rid).map(p => p.slot));
  for (let i = 1; i <= 12; i++) if (!taken.has(i)) return i;
  return null;
}

function calcTargetSlot(angle, rid, skipSlot) {
  const norm   = ((angle % 360) + 360) % 360;
  const others = roomPlayerList(rid).filter(p => p.slot !== skipSlot);
  if (!others.length) return skipSlot;
  let best = skipSlot, min = Infinity;
  for (const p of others) {
    const sa = SLOT_ANGLES[p.slot] ?? 0;
    let d    = Math.abs(norm - sa);
    if (d > 180) d = 360 - d;
    if (d < min) { min = d; best = p.slot; }
  }
  return best;
}

function nextTurnSlot(rid, curSlot) {
  const slots = roomPlayerList(rid).map(p => p.slot).sort((a, b) => a - b);
  if (!slots.length) return 1;
  const i = slots.indexOf(curSlot);
  return slots[i === -1 ? 0 : (i + 1) % slots.length];
}

function _joinRoom(rid, tg_id, join_order) {
  const slot = assignSlot(rid);
  if (slot === null) return null;
  const pm = players.get(rid);
  pm.set(tg_id, { tg_id, slot, join_order });
  const room = rooms.get(rid);
  if (room) {
    room.player_count = pm.size;
    if (pm.size === 1) room.current_turn_slot = slot;
    room.updated_at = Date.now();
  }
  return slot;
}

function buildPlayerList(rid) {
  return roomPlayerList(rid)
    .sort((a, b) => a.join_order - b.join_order)
    .map(p => {
      const u = users.get(p.tg_id) || {};
      return {
        slot       : p.slot,
        tg_id      : p.tg_id,
        join_order : p.join_order,
        first_name : u.first_name || '?',
        photo_url  : u.photo_url  || '',
        name_color : u.name_color || '#fff',
        level      : u.level      || 1,
        xp         : u.xp        || 0,
        wins       : u.wins      || 0,
        challenges_done: u.challenges_done || 0,
        bottle_id  : u.bottle_id || 1,
      };
    });
}

function broadcastState(rid) {
  const room = rooms.get(rid);
  if (!room) return;
  io.to('room:' + rid).emit('state', {
    room    : { ...room },
    players : buildPlayerList(rid),
  });
}

function totalOnline() {
  let n = 0;
  rooms.forEach((_, rid) => { n += roomPlayerList(rid).length; });
  return n;
}

/* ══════════════════════════════════════════════════════
   AUTO CLEANUP
══════════════════════════════════════════════════════ */
setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, rid) => {
    const pl = roomPlayerList(rid);
    if (pl.length === 0 && now - room.created_at > 10 * 60 * 1000) {
      rooms.delete(rid); players.delete(rid); msgs.delete(rid);
      return;
    }
    if (room.spin_in_progress && now - room.spin_started_at > 60000) {
      const next             = nextTurnSlot(rid, room.current_turn_slot);
      room.spin_in_progress  = false;
      room.spin_by           = '';
      room.spin_angle        = 0;
      room.spin_target_slot  = 0;
      room.current_turn_slot = next;
      room.updated_at        = Date.now();
      sysMsg(rid, '⏰ Süre doldu — spin iptal edildi, sıra geçti.');
      broadcastState(rid);
    }
  });
}, 30 * 1000);

/* ══════════════════════════════════════════════════════
   REST API
══════════════════════════════════════════════════════ */
app.get('/api/:action',  handleApiReq);
app.post('/api/:action', handleApiReq);

async function handleApiReq(req, res) {
  const p = { ...req.query, ...req.body, a: req.params.action };
  try   { res.json(await act(p, null)); }
  catch (e) { res.status(500).json({ error: e.message }); }
}

app.get('/health', (req, res) => res.json({
  status : 'ok', game: 'Şişe Çevirme v2',
  online : totalOnline(), rooms: rooms.size,
  uptime : Math.floor(process.uptime()) + 's',
}));

/* ══════════════════════════════════════════════════════
   CORE ACTION HANDLER
══════════════════════════════════════════════════════ */
async function act(p, socket) {
  switch (p.a) {

  /* login */
  case 'login': {
    const id = String(p.tg_id || ('g' + Math.floor(Math.random()*900000+100000)));
    const u  = getUser(id);
    if (p.username)   u.username   = String(p.username).substring(0,50);
    if (p.first_name) u.first_name = String(p.first_name).substring(0,60);
    if (p.photo_url)  u.photo_url  = String(p.photo_url).substring(0,500);
    u.last_seen = Date.now();
    return { ...u };
  }

  /* rooms list */
  case 'rooms': {
    const list = [];
    rooms.forEach((room, rid) => {
      const pc = roomPlayerList(rid).length;
      if (pc < room.max_players || room.status === 'playing')
        list.push({ ...room, player_count: pc });
    });
    return { rooms: list.sort((a,b)=>b.updated_at-a.updated_at).slice(0,25) };
  }

  /* create room */
  case 'create_room': {
    const id   = String(p.tg_id);
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const rid  = Date.now() + Math.floor(Math.random()*9999);
    rooms.set(rid, {
      id: rid, code,
      name              : String(p.name || 'Oda #' + code).substring(0,50),
      host_tg_id        : id,
      status            : 'waiting',
      current_turn_slot : 0,
      spin_in_progress  : false,
      spin_target_slot  : 0,
      spin_angle        : 0,
      spin_by           : '',
      spin_started_at   : 0,
      current_challenge : null,
      player_count      : 0,
      max_players       : 12,
      created_at        : Date.now(),
      updated_at        : Date.now(),
    });
    players.set(rid, new Map());
    const slot = _joinRoom(rid, id, 1);
    if (socket) {
      socket.join('room:' + rid);
      socket.emit('history', []);
    }
    sysMsg(rid, '🏠 Oda oluşturuldu! Kod: ' + code);
    broadcastState(rid);
    return { ok:1, room_id:rid, code, slot, is_host:1 };
  }

  /* join room */
  case 'join_room': {
    const id  = String(p.tg_id);
    const rid = +p.room_id;
    if (!rooms.has(rid)) return { ok:0, error:'Oda bulunamadı' };
    const pm = roomPlayerMap(rid);

    if (pm.has(id)) {
      if (socket) {
        socket.join('room:' + rid);
        socket.emit('history', roomMsgList(rid).slice(-50));
      }
      broadcastState(rid);
      return { ok:1, room_id:rid, slot: pm.get(id).slot, rejoined:true };
    }

    const slot = _joinRoom(rid, id, pm.size + 1);
    if (!slot) return { ok:0, error:'Oda dolu' };

    const u = getUser(id);
    if (socket) {
      socket.join('room:' + rid);
      socket.emit('history', roomMsgList(rid).slice(-50));
    }
    sysMsg(rid, '👋 ' + (u.first_name||'?') + ' odaya katıldı!');
    broadcastState(rid);
    return { ok:1, room_id:rid, slot };
  }

  /* leave room */
  case 'leave_room': {
    const id  = String(p.tg_id);
    const rid = +p.room_id;
    const pm  = roomPlayerMap(rid);
    pm.delete(id);
    const room = rooms.get(rid);
    if (room) room.player_count = pm.size;
    const u = users.get(id);
    if (socket) socket.leave('room:' + rid);
    sysMsg(rid, '🚪 ' + (u?.first_name||'?') + ' ayrıldı');
    broadcastState(rid);
    return { ok:1 };
  }

  case 'ping': return { ok:1 };

  /* state */
  case 'state': {
    const rid   = +p.room_id;
    const since = +(p.since||0);
    return {
      room     : rooms.get(rid),
      players  : buildPlayerList(rid),
      messages : roomMsgList(rid).filter(m => m.id > since),
    };
  }

  /* chat */
  case 'msg': {
    const id  = String(p.tg_id);
    const rid = +p.room_id;
    const txt = String(p.text||'').substring(0,400)
                  .replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if (!txt) return { ok:0 };
    const u   = getUser(id);
    const msg = {
      id         : newMsgId(), room_id:rid,
      tg_id      : id,
      username   : u.first_name || '?',
      name_color : u.name_color || '#fff',
      body       : txt,
      msg_type   : 'chat',
      created_at : Date.now(),
    };
    pushMsg(rid, msg);
    io.to('room:' + rid).emit('new_msg', msg);
    return { ok:1, msg_id: msg.id };
  }

  /* reaction */
  case 'reaction': {
    io.to('room:' + (+p.room_id)).emit('reaction', {
      tg_id : String(p.tg_id),
      emoji : String(p.emoji||'').substring(0,4),
      ts    : Date.now(),
    });
    return { ok:1 };
  }

  /* spin — şişeyi çevir */
  case 'spin': {
    const id   = String(p.tg_id);
    const rid  = +p.room_id;
    const room = rooms.get(rid);

    if (!room)                               return { ok:0, e:'Oda yok' };
    if (room.spin_in_progress)               return { ok:0, e:'Şişe zaten dönüyor' };

    const pm  = roomPlayerMap(rid);
    const myP = pm.get(id);
    if (!myP)                                return { ok:0, e:'Bu odada değilsiniz' };
    if (room.current_turn_slot !== myP.slot) return { ok:0, e:'Sıranız değil' };
    if (roomPlayerList(rid).length < 2)      return { ok:0, e:'En az 2 oyuncu gerekli' };

    // Rastgele bir görev seç
    const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];

    const angle   = 1440 + Math.floor(Math.random() * 2160);
    const tgtSlot = calcTargetSlot(angle, rid, myP.slot);
    const tgtId   = roomPlayerList(rid).find(pp => pp.slot === tgtSlot)?.tg_id || null;

    room.spin_in_progress  = true;
    room.spin_angle        = angle;
    room.spin_target_slot  = tgtSlot;
    room.spin_by           = id;
    room.spin_started_at   = Date.now();
    room.status            = 'playing';
    room.current_challenge = challenge;
    room.updated_at        = Date.now();

    const u  = getUser(id);
    const tu = tgtId ? getUser(tgtId) : null;

    u.spins = (u.spins||0) + 1;
    grantXP(id, 5);

    sysMsg(rid,
      '🍾 ' + (u.first_name||'?') + ' şişeyi çevirdi!' +
      (tu ? ' → 🎯 ' + (tu.first_name||'?') + ' seçildi!' : '')
    );

    // Herkese aynı spin + challenge gönder
    io.to('room:' + rid).emit('spin', {
      angle,
      target_slot   : tgtSlot,
      target_tg_id  : tgtId,
      spin_by        : id,
      spinner_name  : u.first_name,
      target_name   : tu?.first_name || '?',
      challenge,
    });

    broadcastState(rid);
    return { ok:1, angle, target_slot:tgtSlot, target_tg_id:tgtId, challenge };
  }

  /* challenge_done — görev tamamlandı */
  case 'challenge_done': {
    const id   = String(p.tg_id);
    const rid  = +p.room_id;
    const done = p.done !== false && p.done !== 'false';
    const room = rooms.get(rid);

    if (!room || !room.spin_in_progress) return { ok:0, e:'Aktif spin yok' };
    if (room.spin_by !== id)             return { ok:0, e:'Bu sizin spininiz değil' };

    const tgtSlot = room.spin_target_slot;
    const tgtId   = roomPlayerList(rid).find(pp => pp.slot===tgtSlot)?.tg_id || null;
    const u       = getUser(id);
    const tu      = tgtId ? getUser(tgtId) : null;
    const ch      = room.current_challenge;

    if (done && tu) {
      tu.challenges_done = (tu.challenges_done||0) + 1;
      tu.wins = (tu.wins||0) + 1;
      grantXP(tgtId, ch?.xp || 20);
      sysMsg(rid,
        '🏆 ' + (tu.first_name||'?') + ' görevi tamamladı! +' + (ch?.xp||20) + ' XP'
      );
    } else if (tu) {
      sysMsg(rid,
        '💨 ' + (tu.first_name||'?') + ' görevi geçti!'
      );
    }

    const next = nextTurnSlot(rid, room.current_turn_slot);
    room.spin_in_progress  = false;
    room.spin_by           = '';
    room.spin_angle        = 0;
    room.spin_target_slot  = 0;
    room.current_challenge = null;
    room.current_turn_slot = next;
    room.updated_at        = Date.now();

    io.to('room:' + rid).emit('challenge_result', {
      done,
      spinner_id  : id,
      target_id   : tgtId,
      target_name : tu?.first_name || '?',
      challenge   : ch,
      xp_gained   : done ? (ch?.xp || 20) : 0,
    });

    broadcastState(rid);
    return { ok:1, done };
  }

  /* set_bottle */
  case 'set_bottle': {
    const u = getUser(String(p.tg_id));
    u.bottle_id = Math.min(6, Math.max(1, +p.bottle_id || 1));
    return { ok:1, bottle_id: u.bottle_id };
  }

  /* leaderboard */
  case 'leaderboard': {
    const leaders = [...users.values()]
      .sort((a,b) => (b.xp||0) - (a.xp||0))
      .slice(0,20)
      .map(u => ({
        first_name       : u.first_name,
        wins             : u.wins,
        spins            : u.spins,
        challenges_done  : u.challenges_done,
        level            : u.level,
        xp               : u.xp,
        name_color       : u.name_color,
      }));
    return { leaders };
  }

  case 'bottles_list': return { bottles: BOTTLES };
  case 'challenges_list': return { challenges: CHALLENGES };

  default: return { error: 'unknown: ' + p.a };
  }
}

/* ══════════════════════════════════════════════════════
   SOCKET.IO
══════════════════════════════════════════════════════ */
io.on('connection', (socket) => {
  let myId   = null;
  let myRoom = null;

  console.log('[+] connect', socket.id);

  socket.on('login', async (data, cb) => {
    myId = String(data?.tg_id || ('g' + Math.floor(Math.random()*900000+100000)));
    sockMap.set(socket.id, { tg_id: myId, room_id: null });
    const res = await act({ ...data, a:'login', tg_id: myId }, socket);
    if (cb) cb(res);
  });

  socket.on('join_room', async (data, cb) => {
    const id = String(data?.tg_id || myId);
    myId     = id;
    let rid  = data?.room_id ? +data.room_id : null;

    if (!rid) {
      for (const [r, room] of rooms) {
        if (room.status === 'waiting' && roomPlayerList(r).length < room.max_players) {
          rid = r; break;
        }
      }
      if (!rid) {
        const cr = await act({ a:'create_room', tg_id:id }, socket);
        myRoom   = cr.room_id;
        sockMap.set(socket.id, { tg_id:id, room_id:myRoom });
        if (cb) cb(cr);
        return;
      }
    }

    const res = await act({ a:'join_room', tg_id:id, room_id:rid }, socket);
    if (res.ok) {
      myRoom = rid;
      sockMap.set(socket.id, { tg_id:id, room_id:rid });
    }
    if (cb) cb(res);
  });

  socket.on('leave_room', async (data, cb) => {
    const id  = String(data?.tg_id  || myId);
    const rid = +(data?.room_id || myRoom);
    if (!rid) { if (cb) cb({ok:0}); return; }
    await act({ a:'leave_room', tg_id:id, room_id:rid }, socket);
    myRoom = null;
    sockMap.set(socket.id, { tg_id:id, room_id:null });
    if (cb) cb({ ok:1 });
  });

  socket.on('msg', async (data, cb) => {
    const res = await act({ a:'msg', tg_id: data?.tg_id||myId, room_id: data?.room_id||myRoom, text: data?.text }, socket);
    if (cb) cb(res);
  });

  socket.on('reaction', async (data, cb) => {
    const res = await act({ a:'reaction', tg_id: data?.tg_id||myId, room_id: data?.room_id||myRoom, emoji: data?.emoji }, socket);
    if (cb) cb(res);
  });

  socket.on('spin', async (data, cb) => {
    const res = await act({ a:'spin', tg_id: data?.tg_id||myId, room_id: data?.room_id||myRoom }, socket);
    if (cb) cb(res);
  });

  socket.on('challenge_done', async (data, cb) => {
    const res = await act({ a:'challenge_done', tg_id: data?.tg_id||myId, room_id: data?.room_id||myRoom, done: data?.done }, socket);
    if (cb) cb(res);
  });

  socket.on('set_bottle', async (data, cb) => {
    const res = await act({ a:'set_bottle', tg_id: data?.tg_id||myId, bottle_id: data?.bottle_id }, socket);
    if (cb) cb(res);
  });

  socket.on('leaderboard', async (data, cb) => {
    const res = await act({ a:'leaderboard' });
    if (cb) cb(res);
  });

  socket.on('disconnect', (reason) => {
    console.log('[-] disconnect', socket.id, reason);
    const info = sockMap.get(socket.id);
    sockMap.delete(socket.id);

    const id  = info?.tg_id  || myId;
    const rid = info?.room_id || myRoom;
    if (!id || !rid) return;

    const pm = roomPlayerMap(rid);
    pm.delete(id);

    const room = rooms.get(rid);
    if (room) {
      room.player_count = pm.size;
      if (room.spin_in_progress && room.spin_by === id) {
        const next             = nextTurnSlot(rid, room.current_turn_slot);
        room.spin_in_progress  = false;
        room.spin_by           = '';
        room.current_turn_slot = next;
        room.updated_at        = Date.now();
        sysMsg(rid, '⏰ Spinner ayrıldı — sıra geçti.');
      }
    }

    const u = users.get(id);
    sysMsg(rid, '🚪 ' + (u?.first_name||'?') + ' ayrıldı');
    broadcastState(rid);
  });
});

/* ══════════════════════════════════════════════════════
   START
══════════════════════════════════════════════════════ */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  🍾  Şişe Çevirme — Görev Çarkı  READY  ║');
  console.log('║  Port   : ' + String(PORT).padEnd(31) + '║');
  console.log('║  Stack  : Node.js + Express + Socket.IO  ║');
  console.log('╚══════════════════════════════════════════╝\n');
});
