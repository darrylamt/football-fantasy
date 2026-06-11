import type { Position } from '@/types'

/** Minimal pick shape needed to score a fantasy team's gameweek. */
export interface ScorablePick {
  id: string
  player_id: string
  is_starting: boolean
  bench_order: number | null
  is_captain: boolean
  is_vice_captain: boolean
  position: Position
  points_scored: number
}

export interface PlayerGwResult {
  points: number
  minutes: number
}

export interface ChipFlags {
  tripleCaptain: boolean
  benchBoost: boolean
}

const FORMATION_MIN: Record<Exclude<Position, 'GK'>, number> = { DEF: 3, MID: 2, FWD: 1 }
const FORMATION_MAX: Record<Exclude<Position, 'GK'>, number> = { DEF: 5, MID: 5, FWD: 3 }

function played(stats: Map<string, PlayerGwResult>, playerId: string): boolean {
  return (stats.get(playerId)?.minutes ?? 0) > 0
}

function basePoints(stats: Map<string, PlayerGwResult>, playerId: string): number {
  return stats.get(playerId)?.points ?? 0
}

/**
 * FPL-style auto-substitutions, applied in place on a copy:
 * - starting GK who didn't play is replaced by the bench GK if they played
 * - bench outfielders (in bench order) come on for non-playing starters
 *   provided the formation stays valid (3+ DEF, 2+ MID, 1+ FWD, position maxes)
 */
export function applyAutoSubs(picks: ScorablePick[], stats: Map<string, PlayerGwResult>): ScorablePick[] {
  const result = picks.map(p => ({ ...p }))

  const starters = () => result.filter(p => p.is_starting)
  const formationCount = (pos: Exclude<Position, 'GK'>, excludeId?: string) =>
    starters().filter(p => p.id !== excludeId && p.position === pos).length

  function swap(starter: ScorablePick, sub: ScorablePick) {
    const benchOrder = sub.bench_order
    starter.is_starting = false
    starter.bench_order = benchOrder
    starter.is_captain = false
    starter.is_vice_captain = false
    sub.is_starting = true
    sub.bench_order = null
  }

  // GK auto-sub
  const startingGk = result.find(p => p.is_starting && p.position === 'GK')
  const benchGk = result.find(p => !p.is_starting && p.position === 'GK')
  if (startingGk && benchGk && !played(stats, startingGk.player_id) && played(stats, benchGk.player_id)) {
    swap(startingGk, benchGk)
  }

  // Outfield auto-subs, bench order priority
  const benchOutfield = result
    .filter(p => !p.is_starting && p.position !== 'GK')
    .sort((a, b) => (a.bench_order ?? 99) - (b.bench_order ?? 99))

  for (const sub of benchOutfield) {
    if (!played(stats, sub.player_id)) continue

    const nonPlayingStarters = result.filter(
      p => p.is_starting && p.position !== 'GK' && !played(stats, p.player_id)
    )

    for (const starter of nonPlayingStarters) {
      const outPos = starter.position as Exclude<Position, 'GK'>
      const inPos = sub.position as Exclude<Position, 'GK'>
      const okOut = outPos === inPos || formationCount(outPos, starter.id) >= FORMATION_MIN[outPos]
      const okIn = outPos === inPos || formationCount(inPos) + 1 <= FORMATION_MAX[inPos]
      if (okOut && okIn) {
        swap(starter, sub)
        break
      }
    }
  }

  return result
}

/**
 * Scores one fantasy team's picks for a gameweek.
 * Returns picks with points_scored filled in (captain multiplier applied to the
 * effective captain) plus the gameweek total.
 */
export function scoreTeamPicks(
  picks: ScorablePick[],
  stats: Map<string, PlayerGwResult>,
  chips: ChipFlags
): { picks: ScorablePick[]; gwTotal: number } {
  const scored = applyAutoSubs(picks, stats)

  // Effective captain: captain if they played, otherwise vice if they played
  const captain = scored.find(p => p.is_captain)
  const vice = scored.find(p => p.is_vice_captain)
  const multiplier = chips.tripleCaptain ? 3 : 2
  let armbandId: string | null = null
  if (captain && played(stats, captain.player_id)) armbandId = captain.id
  else if (vice && vice.is_starting && played(stats, vice.player_id)) armbandId = vice.id

  let gwTotal = 0
  for (const pick of scored) {
    let pts = basePoints(stats, pick.player_id)
    if (pick.id === armbandId) pts *= multiplier
    pick.points_scored = pts
    if (pick.is_starting || chips.benchBoost) gwTotal += pts
  }

  return { picks: scored, gwTotal }
}
