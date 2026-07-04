import { getSupabase } from '../../../lib/supabase.js';

const VALID_PLAYERS = ['Aden', 'Edward', 'Jamie'];

function defaultPlayer(identity, extras) {
  return {
    identity,
    theme: extras.theme,
    accentColor: extras.accentColor,
    minimal_view_active: extras.minimal_view_active || false,
    cash: 2000,
    luck_multiplier: 1.0,
    global_heat: 0,
    max_stash_size: 50,
    equipped: { helmet: null, shirt: null, legs: null, boots: null },
    backpack_stash: [],
    warehouse_bays: [
      { bay_id: 1, current_crop: null, lamps_level: 1, soil_level: 1, grow_progress: 0 },
      { bay_id: 2, current_crop: null, lamps_level: 1, soil_level: 1, grow_progress: 0 }
    ],
    compendium_discovered: [],
    flex_alerts: []
  };
}

function defaultGameState() {
  return {
    active_player: 'Aden',
    versus_mode_active: true,
    launch_date: '2026-07-04T00:00:00',
    global_activity_log: ['[23:38] SYSTEM INITIALIZED: Welcome to the Syndicate block. Get to work.'],
    live_trade_session: null,
    procedural_day: 0,
    update_pending: false,
    last_update_applied_day: 0,
    strain_pool: [],
    boost_pool: [],
    item_id_counter: 1,
    last_grow_tick: 0,
    players: {
      Aden: defaultPlayer('Aden', { theme: 'fallout4_neon', accentColor: '#00ff66' }),
      Edward: defaultPlayer('Edward', { theme: 'fallout76_amber', accentColor: '#ffaa00' }),
      Jamie: defaultPlayer('Jamie', { theme: 'bg3_karlach_red', accentColor: '#ff2200', minimal_view_active: false })
    }
  };
}

function rowToRoom(row) {
  if (!row) return null;
  return {
    state: row.state,
    version: row.version,
    updatedAt: row.updated_at,
    presence: row.presence || {}
  };
}

async function loadRoom(roomId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('game_rooms')
    .select('room_id, state, version, updated_at, presence')
    .eq('room_id', roomId)
    .maybeSingle();
  if (error) throw error;
  return rowToRoom(data);
}

async function saveRoom(roomId, room) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('game_rooms')
    .update({
      state: room.state,
      version: room.version,
      updated_at: room.updatedAt,
      presence: room.presence || {}
    })
    .eq('room_id', roomId);
  if (error) throw error;
}

async function saveRoomWithVersion(roomId, room, expectedVersion) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('game_rooms')
    .update({
      state: room.state,
      version: room.version,
      updated_at: room.updatedAt,
      presence: room.presence || {}
    })
    .eq('room_id', roomId)
    .eq('version', expectedVersion)
    .select('room_id, state, version, updated_at, presence')
    .maybeSingle();
  if (error) throw error;
  if (!data) return { conflict: true, room: await loadRoom(roomId) };
  return { conflict: false, room: rowToRoom(data) };
}

function calculateItemValue(item) {
  if (!item) return 100;
  let base = 100;
  if (item.type === 'strain') {
    base = (item.potency || 0) * 3 + (item.flavor || 0) * 2 + (item.yield_rating || 0) * 2 + (item.resilience || 0);
  } else if (item.type === 'boost') {
    base = (item.value || 0.1) * 500 * (item.multiplier || 1);
  }
  const rarityMult = { Common: 1, Rare: 2.5, Epic: 8, Mythic: 50, Godly: 200, Exotic: 100 };
  base *= rarityMult[item.rarity] || 1;
  return Math.max(50, Math.round(base));
}

function evaluateTrade(item, cashOffer) {
  if (!item) return { ok: false, reason: 'no_item' };
  if (item.rarity === 'Mythic' || item.rarity === 'Exotic' || (item.name && item.name.indexOf('Voidline Masterwork') === 0)) {
    return { ok: true, tier: 'praise' };
  }
  const baseValue = calculateItemValue(item);
  const ratio = cashOffer / baseValue;
  if (ratio < 0.3) return { ok: false, reason: 'reject', ratio };
  return { ok: true, tier: 'ok', ratio };
}

function removeFromInventory(state, playerId, itemId, source) {
  const p = state.players[playerId];
  if (source === 'equipped') {
    for (const slot of ['helmet', 'shirt', 'legs', 'boots']) {
      if (p.equipped[slot] && p.equipped[slot].id === itemId) {
        const item = p.equipped[slot];
        p.equipped[slot] = null;
        return { item, source: 'equipped', slot };
      }
    }
    return null;
  }
  const idx = p.backpack_stash.findIndex(i => i.id === itemId);
  if (idx === -1) return null;
  const item = p.backpack_stash.splice(idx, 1)[0];
  return { item, source: 'backpack' };
}

function addToBackpack(state, playerId, item) {
  const p = state.players[playerId];
  if (p.backpack_stash.length >= p.max_stash_size) return false;
  p.backpack_stash.push(item);
  return true;
}

function executeTradeOnState(state, { senderId, recipientId, itemId, source, cashOffer }) {
  if (!VALID_PLAYERS.includes(senderId) || !VALID_PLAYERS.includes(recipientId)) {
    return { ok: false, error: 'Invalid player.' };
  }
  if (senderId === recipientId) {
    return { ok: false, error: 'Cannot trade with yourself.' };
  }
  const sender = state.players[senderId];
  const recipient = state.players[recipientId];
  let item = null;
  if (source === 'equipped') {
    for (const slot of ['helmet', 'shirt', 'legs', 'boots']) {
      if (sender.equipped[slot] && sender.equipped[slot].id === itemId) {
        item = sender.equipped[slot];
        break;
      }
    }
  } else {
    item = sender.backpack_stash.find(i => i.id === itemId);
  }
  if (!item) return { ok: false, error: 'Item not found in sender inventory.' };
  const evalResult = evaluateTrade(item, cashOffer || 0);
  if (!evalResult.ok) return { ok: false, error: 'Karlach denied the trade.', eval: evalResult };
  const removed = removeFromInventory(state, senderId, itemId, source || 'backpack');
  if (!removed) return { ok: false, error: 'Item removal failed.' };
  const offer = cashOffer || 0;
  if (offer > 0) {
    if (recipient.cash < offer) {
      if (removed.source === 'backpack') sender.backpack_stash.push(removed.item);
      else sender.equipped[removed.slot] = removed.item;
      return { ok: false, error: recipient.identity + ' cannot afford the cash offer.' };
    }
    recipient.cash -= offer;
    sender.cash += offer;
  }
  if (!addToBackpack(state, recipientId, removed.item)) {
    if (removed.source === 'backpack') sender.backpack_stash.push(removed.item);
    else sender.equipped[removed.slot] = removed.item;
    if (offer > 0) {
      recipient.cash += offer;
      sender.cash -= offer;
    }
    return { ok: false, error: 'Recipient backpack full.' };
  }
  const now = new Date();
  const ts = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  state.global_activity_log.unshift('[' + ts + '] ' + senderId + ' traded ' + removed.item.name + ' to ' + recipientId + (offer ? ' for $' + offer : ''));
  if (state.global_activity_log.length > 100) state.global_activity_log.pop();
  return { ok: true, item: removed.item.name, eval: evalResult };
}

function applyGrowTick(state) {
  const now = Date.now();
  if (now - (state.last_grow_tick || 0) < 1500) return false;
  state.last_grow_tick = now;
  Object.keys(state.players).forEach(pid => {
    const p = state.players[pid];
    let velocityBoost = 1;
    p.backpack_stash.forEach(item => {
      if (item.type === 'boost' && item.modifier === 'grow_velocity') velocityBoost += item.value;
    });
    p.warehouse_bays.forEach(bay => {
      if (bay.current_crop) {
        const rate = 0.5 * velocityBoost * (1 + bay.lamps_level * 0.03);
        bay.grow_progress = Math.min(100, (bay.grow_progress || 0) + rate);
      }
    });
  });
  return true;
}

function logEntry(msg) {
  const now = new Date();
  const ts = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  return '[' + ts + '] ' + msg;
}

function conflictResponse(res, room) {
  return res.status(409).json({
    conflict: true,
    state: room?.state || null,
    version: room?.version || 0,
    updatedAt: room?.updatedAt || null
  });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const roomId = req.query.roomId;
  if (!roomId || typeof roomId !== 'string' || roomId.length > 64) {
    return res.status(400).json({ error: 'Invalid room ID.' });
  }

  if (req.method === 'GET') {
    try {
      let room = await loadRoom(roomId);
      if (!room) {
        return res.status(200).json({ state: null, version: 0, updatedAt: null, presence: {} });
      }
      if (room.state) applyGrowTick(room.state);
      room.updatedAt = Date.now();
      await saveRoom(roomId, room);
      return res.status(200).json({
        state: room.state,
        version: room.version,
        updatedAt: room.updatedAt,
        presence: room.presence || {}
      });
    } catch (err) {
      return res.status(500).json({ error: 'Supabase read failed.', detail: err.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const body = req.body || {};
  const action = body.action;

  try {
    let room = await loadRoom(roomId);

    if (action === 'init') {
      if (room && room.state) {
        return res.status(200).json({
          state: room.state,
          version: room.version,
          updatedAt: room.updatedAt,
          alreadyExists: true
        });
      }
      const incoming = body.state || defaultGameState();
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          room_id: roomId,
          state: incoming,
          version: 1,
          updated_at: Date.now(),
          presence: {}
        })
        .select('room_id, state, version, updated_at, presence')
        .maybeSingle();
      if (error) {
        if (error.code === '23505') {
          room = await loadRoom(roomId);
          return res.status(200).json({
            state: room.state,
            version: room.version,
            updatedAt: room.updatedAt,
            alreadyExists: true
          });
        }
        throw error;
      }
      room = rowToRoom(data);
      return res.status(201).json({
        state: room.state,
        version: room.version,
        updatedAt: room.updatedAt
      });
    }

    if (!room || !room.state) {
      return res.status(404).json({ error: 'Room not found. POST init first.' });
    }

    if (action === 'sync') {
      const clientVersion = body.version;
      if (clientVersion !== room.version) {
        return conflictResponse(res, room);
      }
      if (!body.state || typeof body.state !== 'object') {
        return res.status(400).json({ error: 'Missing state payload.' });
      }
      room.state = body.state;
      room.version = room.version + 1;
      room.updatedAt = Date.now();
      if (body.player && VALID_PLAYERS.includes(body.player)) {
        room.presence = room.presence || {};
        room.presence[body.player] = Date.now();
      }
      const result = await saveRoomWithVersion(roomId, room, clientVersion);
      if (result.conflict) return conflictResponse(res, result.room);
      room = result.room;
      return res.status(200).json({ state: room.state, version: room.version, updatedAt: room.updatedAt });
    }

    if (action === 'trade') {
      const clientVersion = body.version;
      if (clientVersion !== room.version) {
        return conflictResponse(res, room);
      }
      const tradeResult = executeTradeOnState(room.state, {
        senderId: body.senderId,
        recipientId: body.recipientId,
        itemId: body.itemId,
        source: body.source || 'backpack',
        cashOffer: body.cashOffer || 0
      });
      if (!tradeResult.ok) {
        return res.status(400).json({ error: tradeResult.error, eval: tradeResult.eval });
      }
      room.version = room.version + 1;
      room.updatedAt = Date.now();
      room.presence = room.presence || {};
      if (body.senderId) room.presence[body.senderId] = Date.now();
      const result = await saveRoomWithVersion(roomId, room, clientVersion);
      if (result.conflict) return conflictResponse(res, result.room);
      room = result.room;
      return res.status(200).json({
        state: room.state,
        version: room.version,
        updatedAt: room.updatedAt,
        trade: tradeResult
      });
    }

    if (action === 'flex') {
      const from = body.from;
      const msg = body.msg;
      if (!VALID_PLAYERS.includes(from) || !msg) {
        return res.status(400).json({ error: 'Invalid flex payload.' });
      }
      VALID_PLAYERS.forEach(pid => {
        if (pid !== from) {
          room.state.players[pid].flex_alerts = room.state.players[pid].flex_alerts || [];
          room.state.players[pid].flex_alerts.push({ msg, from, ts: Date.now() });
        }
      });
      room.state.global_activity_log.unshift(logEntry('DATA LOG transmitted: ' + msg));
      if (room.state.global_activity_log.length > 100) room.state.global_activity_log.pop();
      room.version = room.version + 1;
      room.updatedAt = Date.now();
      await saveRoom(roomId, room);
      return res.status(200).json({ state: room.state, version: room.version, updatedAt: room.updatedAt });
    }

    if (action === 'heartbeat') {
      const player = body.player;
      if (VALID_PLAYERS.includes(player)) {
        room.presence = room.presence || {};
        room.presence[player] = Date.now();
        await saveRoom(roomId, room);
      }
      return res.status(200).json({ version: room.version, presence: room.presence });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (err) {
    return res.status(500).json({ error: 'Supabase operation failed.', detail: err.message });
  }
}
