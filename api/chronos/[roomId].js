import { getSupabase } from '../../../lib/supabase.js';

const VALID = ['aden', 'jamie', 'edward', 'Aden', 'Jamie', 'Edward'];

function norm(id) {
  return String(id || '').toLowerCase();
}

function defaultChronosState() {
  return {
    kind: 'chronos',
    world: {
      v: 2,
      eraIndex: 0,
      erasCleared: [],
      planetsUnlocked: ['cinder'],
      sharedBank: {},
      presence: {},
      storyChapter: 0,
      dailySeed: 0,
      coop: null,
      log: [],
      updatedAt: Date.now()
    },
    players: {}
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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const roomId = req.query.roomId;
  if (!roomId || typeof roomId !== 'string' || roomId.length > 64) {
    return res.status(400).json({ error: 'Invalid room ID.' });
  }

  try {
    if (req.method === 'GET') {
      const room = await loadRoom(roomId);
      if (!room) {
        return res.status(200).json({ state: null, version: 0, updatedAt: null, presence: {} });
      }
      return res.status(200).json({
        state: room.state,
        version: room.version,
        updatedAt: room.updatedAt,
        presence: room.presence || {}
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed.' });
    }

    const body = req.body || {};
    const action = body.action;
    const supabase = getSupabase();

    if (action === 'init') {
      let room = await loadRoom(roomId);
      if (room && room.state) {
        return res.status(200).json({
          state: room.state,
          version: room.version,
          updatedAt: room.updatedAt,
          alreadyExists: true
        });
      }
      const incoming = body.state || defaultChronosState();
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

    let room = await loadRoom(roomId);
    if (!room || !room.state) {
      return res.status(404).json({ error: 'Room not found. POST init first.' });
    }

    if (action === 'sync') {
      if (body.version !== room.version) {
        return res.status(409).json({
          conflict: true,
          state: room.state,
          version: room.version,
          updatedAt: room.updatedAt,
          presence: room.presence || {}
        });
      }
      if (!body.state || typeof body.state !== 'object') {
        return res.status(400).json({ error: 'Missing state.' });
      }
      const nextVersion = room.version + 1;
      const presence = Object.assign({}, room.presence || {});
      if (body.player && VALID.map(norm).includes(norm(body.player))) {
        presence[norm(body.player)] = Date.now();
      }
      const { data, error } = await supabase
        .from('game_rooms')
        .update({
          state: body.state,
          version: nextVersion,
          updated_at: Date.now(),
          presence
        })
        .eq('room_id', roomId)
        .eq('version', body.version)
        .select('room_id, state, version, updated_at, presence')
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        room = await loadRoom(roomId);
        return res.status(409).json({
          conflict: true,
          state: room?.state || null,
          version: room?.version || 0,
          updatedAt: room?.updatedAt || null,
          presence: room?.presence || {}
        });
      }
      room = rowToRoom(data);
      return res.status(200).json({
        state: room.state,
        version: room.version,
        updatedAt: room.updatedAt,
        presence: room.presence || {}
      });
    }

    if (action === 'presence') {
      const presence = Object.assign({}, room.presence || {});
      if (body.player && VALID.map(norm).includes(norm(body.player))) {
        presence[norm(body.player)] = Date.now();
      }
      await supabase
        .from('game_rooms')
        .update({ presence, updated_at: Date.now() })
        .eq('room_id', roomId);
      return res.status(200).json({ ok: true, presence });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (err) {
    return res.status(500).json({
      error: 'Chronos sync unavailable.',
      detail: err.message,
      localOnly: true
    });
  }
}
