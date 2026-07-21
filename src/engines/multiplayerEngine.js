/**
 * Firebase global real-time multiplayer service.
 * Google Sign-In + presence + team invites + combat sync vectors.
 * Falls back to BroadcastChannel/localStorage when Firebase env is unset.
 */
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from 'firebase/auth'
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  onChildAdded,
  push,
  remove,
  serverTimestamp,
  onDisconnect,
} from 'firebase/database'
import { getState } from '../store/gameStore.js'
import { CLAN_MEMBERS } from '../data/clanRoster.js'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
}

const configured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.databaseURL
)

let app = null
let auth = null
let db = null
let provider = null
let localChannel = null
let presenceUnsub = null
let inviteUnsub = null
let combatUnsub = null
let roomId = 'clan-main'
let localSeat = 'aden'
let combatListeners = new Set()
let inviteListeners = new Set()

function seatKey() {
  return getState().activeSeat || localSeat
}

function deviceId() {
  const key = 'dungeon_device_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `dev_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(key, id)
  }
  return id
}

/* ——— Local fallback bus (multi-tab / no Firebase) ——— */
function initLocalBus() {
  if (localChannel) return
  localChannel = new BroadcastChannel('dungeon_grinder_mp')
  localChannel.onmessage = (ev) => {
    const msg = ev.data
    if (!msg || !msg.type) return
    if (msg.type === 'presence') {
      getState().setPresence({
        [msg.seat]: {
          online: true,
          inMatch: !!msg.inMatch,
          lastSeen: Date.now(),
          displayName: msg.displayName,
        },
      })
    }
    if (msg.type === 'invite' && msg.toSeat !== seatKey()) {
      // broadcast invites go to all; filter own
    }
    if (msg.type === 'invite') {
      if (msg.fromSeat === seatKey()) return
      const invite = {
        from: msg.fromSeat,
        fromName: msg.fromName,
        roomId: msg.roomId,
        at: Date.now(),
      }
      getState().setInvite(invite)
      inviteListeners.forEach((fn) => fn(invite))
    }
    if (msg.type === 'combat') {
      combatListeners.forEach((fn) => fn(msg.payload))
    }
  }

  // heartbeat presence
  setInterval(() => {
    const s = getState()
    localChannel.postMessage({
      type: 'presence',
      seat: seatKey(),
      inMatch: s.inMatch,
      displayName: s.displayName || seatKey(),
    })
    // mark self online
    s.setPresence({
      [seatKey()]: {
        online: true,
        inMatch: s.inMatch,
        lastSeen: Date.now(),
        displayName: s.displayName || seatKey(),
      },
    })
  }, 2000)
}

export const multiplayerEngine = {
  isConfigured: configured,

  async init() {
    localSeat = getState().activeSeat
    if (!configured) {
      initLocalBus()
      getState().setAuth(`local_${deviceId()}`, `Pilot-${seatKey()}`)
      getState().toast('Offline multiplayer bus active')
      return { mode: 'local' }
    }

    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getDatabase(app)
    provider = new GoogleAuthProvider()
    await setPersistence(auth, browserLocalPersistence)

    try {
      await getRedirectResult(auth)
    } catch (err) {
      console.warn('Redirect auth result', err)
    }

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        getState().setAuth(user.uid, user.displayName || user.email || 'Operator')
        await this._bindPresence(user.uid)
        await this._bindInvites(user.uid)
      } else {
        getState().setAuth(null, null)
      }
    })

    return { mode: 'firebase' }
  },

  async signInGoogle() {
    if (!configured) {
      getState().setAuth(`local_${deviceId()}`, `Pilot-${seatKey()}`)
      getState().toast('Signed in (local device cache)')
      return getState().uid
    }
    try {
      const result = await signInWithPopup(auth, provider)
      return result.user.uid
    } catch (err) {
      if (err?.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider)
        return null
      }
      console.error(err)
      getState().toast('Sign-in failed')
      throw err
    }
  },

  async signOutUser() {
    if (configured && auth) await signOut(auth)
    getState().setAuth(null, null)
  },

  async _bindPresence(uid) {
    if (presenceUnsub) presenceUnsub()
    const seat = seatKey()
    const pRef = ref(db, `presence/${roomId}/${seat}`)
    await set(pRef, {
      uid,
      seat,
      online: true,
      inMatch: false,
      displayName: getState().displayName,
      updatedAt: serverTimestamp(),
    })
    onDisconnect(pRef).update({ online: false, inMatch: false, updatedAt: serverTimestamp() })

    const roomPresence = ref(db, `presence/${roomId}`)
    presenceUnsub = onValue(roomPresence, (snap) => {
      const val = snap.val() || {}
      const mapped = {}
      for (const m of CLAN_MEMBERS) {
        const row = val[m.id]
        mapped[m.id] = {
          online: !!(row && row.online),
          inMatch: !!(row && row.inMatch),
          lastSeen: Date.now(),
          displayName: row?.displayName || m.name,
        }
      }
      getState().setPresence(mapped)
    })
  },

  async _bindInvites(uid) {
    if (inviteUnsub) inviteUnsub()
    const seat = seatKey()
    const iRef = ref(db, `invites/${roomId}/${seat}`)
    inviteUnsub = onChildAdded(iRef, (snap) => {
      const invite = snap.val()
      if (!invite) return
      getState().setInvite({
        from: invite.from,
        fromName: invite.fromName,
        roomId: invite.roomId || roomId,
        at: Date.now(),
      })
      inviteListeners.forEach((fn) => fn(getState().inviteOverlay))
      remove(snap.ref)
    })
  },

  onInvite(fn) {
    inviteListeners.add(fn)
    return () => inviteListeners.delete(fn)
  },

  onCombatSync(fn) {
    combatListeners.add(fn)
    return () => combatListeners.delete(fn)
  },

  /** Clicking "With Team" — push invite overlay to teammates. */
  async sendTeamInvite() {
    const from = seatKey()
    const fromName = getState().displayName || from
    const payload = {
      from,
      fromName,
      roomId,
      createdAt: Date.now(),
    }

    if (!configured) {
      localChannel?.postMessage({ type: 'invite', ...payload, fromSeat: from })
      getState().toast('Team invite broadcast')
      return
    }

    for (const m of CLAN_MEMBERS) {
      if (m.id === from) continue
      const inviteRef = push(ref(db, `invites/${roomId}/${m.id}`))
      await set(inviteRef, {
        ...payload,
        createdAt: serverTimestamp(),
      })
    }
    // mark self in lobby match-ready
    await update(ref(db, `presence/${roomId}/${from}`), {
      inMatch: true,
      updatedAt: serverTimestamp(),
    })
    getState().toast('Invite sent to clan')
  },

  async acceptInvite() {
    const invite = getState().inviteOverlay
    if (!invite) return
    getState().clearInvite()
    getState().setMatch({ inMatch: true, downed: false })
    if (configured) {
      await update(ref(db, `presence/${roomId}/${seatKey()}`), {
        inMatch: true,
        updatedAt: serverTimestamp(),
      })
    }
    getState().toast('Joining team dungeon')
  },

  async declineInvite() {
    getState().clearInvite()
  },

  /**
   * Push combat vector sync during matches.
   * Debounced: only broadcast when moved > 2 world units (unless force).
   * payload: { seat, x, y, z, vx, vz, downed, aimYaw, hp, ts }
   */
  _lastCombatBroadcast: { x: null, y: null, z: null },

  async publishCombatState(payload, opts = {}) {
    const force = !!opts.force
    const x = payload.x
    const y = payload.y ?? 0
    const z = payload.z
    const last = this._lastCombatBroadcast
    if (!force && last.x != null) {
      const dx = x - last.x
      const dy = y - last.y
      const dz = z - last.z
      if (dx * dx + dy * dy + dz * dz < 4) return false
    }
    this._lastCombatBroadcast = { x, y, z }
    const body = { ...payload, x, y, z, seat: seatKey(), ts: Date.now() }
    if (!configured) {
      localChannel?.postMessage({ type: 'combat', payload: body })
      return true
    }
    await set(ref(db, `combat/${roomId}/${seatKey()}`), body)
    return true
  },

  bindCombatRoom() {
    if (combatUnsub) combatUnsub()
    if (!configured) return () => {}
    const cRef = ref(db, `combat/${roomId}`)
    combatUnsub = onValue(cRef, (snap) => {
      const val = snap.val() || {}
      Object.values(val).forEach((row) => {
        if (!row || row.seat === seatKey()) return
        combatListeners.forEach((fn) => fn(row))
      })
    })
    return () => {
      if (combatUnsub) combatUnsub()
      combatUnsub = null
    }
  },

  async setInMatch(flag) {
    getState().setMatch({ inMatch: flag })
    if (!configured) return
    await update(ref(db, `presence/${roomId}/${seatKey()}`), {
      inMatch: flag,
      updatedAt: serverTimestamp(),
    })
  },

  refreshSeatBindings() {
    localSeat = getState().activeSeat
    if (configured && auth?.currentUser) {
      this._bindPresence(auth.currentUser.uid)
      this._bindInvites(auth.currentUser.uid)
    }
  },

  /**
   * Sandbox / diagnostics injectors — write into the same Zustand + combat
   * listener slots live peers use, without touching Firebase or BroadcastChannel.
   * Safe for local stress tests; never mutates remote RTDB.
   */
  injectSimulatedPresence(map) {
    getState().setPresence(map)
  },

  injectSimulatedCombat(payload) {
    if (!payload) return
    combatListeners.forEach((fn) => fn(payload))
  },

  injectSimulatedInvite(invite) {
    if (!invite) return
    getState().setInvite(invite)
    inviteListeners.forEach((fn) => fn(invite))
  },

  clearSimulatedInvite() {
    getState().clearInvite()
  },
}

export default multiplayerEngine
