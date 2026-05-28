import type { Player, FantasyPick, Position } from '@/types'

export interface SquadValidationResult {
  valid: boolean
  errors: string[]
}

interface PickWithPlayer extends FantasyPick {
  players: Player
}

const VALID_FORMATIONS = {
  DEF: [3, 4, 5],
  MID: [2, 3, 4, 5],
  FWD: [1, 2, 3],
}

export function validateSquad(picks: PickWithPlayer[], budget: number = 100): SquadValidationResult {
  const errors: string[] = []

  // Total squad size
  if (picks.length !== 15) {
    errors.push(`Squad must have exactly 15 players (currently ${picks.length})`)
  }

  const starters = picks.filter(p => p.is_starting)
  const bench = picks.filter(p => !p.is_starting)

  // Starters and bench counts
  if (starters.length !== 11) {
    errors.push(`Must have exactly 11 starters (currently ${starters.length})`)
  }
  if (bench.length !== 4) {
    errors.push(`Must have exactly 4 bench players (currently ${bench.length})`)
  }

  const byPosition = (list: PickWithPlayer[], pos: Position) =>
    list.filter(p => p.players.position === pos)

  // Squad position totals
  if (byPosition(picks, 'GK').length !== 2) errors.push('Squad must have exactly 2 GKs')
  if (byPosition(picks, 'DEF').length !== 5) errors.push('Squad must have exactly 5 DEFs')
  if (byPosition(picks, 'MID').length !== 5) errors.push('Squad must have exactly 5 MIDs')
  if (byPosition(picks, 'FWD').length !== 3) errors.push('Squad must have exactly 3 FWDs')

  // Starting GK
  const startingGKs = byPosition(starters, 'GK')
  if (startingGKs.length !== 1) {
    errors.push('Starting 11 must include exactly 1 GK')
  }

  // Formation validation
  const startingDEF = byPosition(starters, 'DEF').length
  const startingMID = byPosition(starters, 'MID').length
  const startingFWD = byPosition(starters, 'FWD').length

  if (!VALID_FORMATIONS.DEF.includes(startingDEF)) {
    errors.push(`Invalid number of starting DEFs: ${startingDEF} (must be 3, 4, or 5)`)
  }
  if (!VALID_FORMATIONS.MID.includes(startingMID)) {
    errors.push(`Invalid number of starting MIDs: ${startingMID} (must be 2, 3, 4, or 5)`)
  }
  if (!VALID_FORMATIONS.FWD.includes(startingFWD)) {
    errors.push(`Invalid number of starting FWDs: ${startingFWD} (must be 1, 2, or 3)`)
  }

  // Max 3 players from same team
  const teamCounts: Record<string, number> = {}
  for (const pick of picks) {
    const teamId = pick.players.team_id
    teamCounts[teamId] = (teamCounts[teamId] || 0) + 1
    if (teamCounts[teamId] > 3) {
      errors.push(`Maximum 3 players allowed from the same club (${pick.players.real_teams?.name ?? pick.players.team_id})`)
      break
    }
  }

  // Budget check
  const totalCost = picks.reduce((sum, p) => sum + Number(p.players.price), 0)
  if (totalCost > budget) {
    errors.push(`Squad cost ₵${totalCost.toFixed(1)}m exceeds budget of ₵${budget.toFixed(1)}m`)
  }

  // Captain and vice captain
  const captains = starters.filter(p => p.is_captain)
  const viceCaptains = starters.filter(p => p.is_vice_captain)

  if (captains.length !== 1) {
    errors.push('Must have exactly 1 captain in the starting 11')
  }
  if (viceCaptains.length !== 1) {
    errors.push('Must have exactly 1 vice captain in the starting 11')
  }
  if (captains.length === 1 && viceCaptains.length === 1 && captains[0].player_id === viceCaptains[0].player_id) {
    errors.push('Captain and vice captain must be different players')
  }

  return { valid: errors.length === 0, errors }
}
