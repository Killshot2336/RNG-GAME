# VOIDLINE: CHRONOS

Private 3-player co-op warband — Aden, Jamie, Edward.

## Fantasy
Thrown into deep time. Stabilize eras. Merge relics. Spec the constellation. Hold the Chronolith. Raid planets for exotics. Fish and garden between wars.

## Systems
| System | Notes |
|--------|--------|
| Seats | Aden / Jamie / Edward — per-seat saves `voidline_chronos_v2_*` |
| Sync | Local + BroadcastChannel + `/api/chronos/voidline-chronos` (Supabase room) |
| Hub | Diegetic art hotspots — no nav chrome |
| Constellation | 25+ nodes, Bulwark / Rift / Warden + cross keystones |
| Forge | Shard merge + exotic myth relics |
| Chronolith | Waves, infinite ups, role abilities, co-op boss gates |
| Stargate | Timed extract runs per planet |
| Slow life | Fishing + garden plots |
| Lore | Story chapters unlock with eras |
| Daily | Streak chrono + SP on login |

## Co-op
- Presence pips (5 min window)
- Shared world bank + era unlocks
- Co-op boss mode tracks role gates (taunt / arc / mend)
- Solo fills missing roles with ghost allies
- Cloud sync when `SUPABASE_URL` + service role are set on Vercel
