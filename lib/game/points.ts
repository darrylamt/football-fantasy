import type { PlayerGameweekStats, Position } from '@/types'

export function calculatePoints(stats: Omit<PlayerGameweekStats, 'calculated_points'>, position: Position): number {
  let points = 0

  // Minutes played
  if (stats.minutes >= 60) {
    points += 2
  } else if (stats.minutes >= 1) {
    points += 1
  }

  // Goals scored
  const goalPoints: Record<Position, number> = { GK: 6, DEF: 6, MID: 5, FWD: 4 }
  points += stats.goals * goalPoints[position]

  // Assists
  points += stats.assists * 3

  // Clean sheet (must have played 60+ mins)
  if (stats.clean_sheet && stats.minutes >= 60) {
    const csPoints: Record<Position, number> = { GK: 4, DEF: 4, MID: 1, FWD: 0 }
    points += csPoints[position]
  }

  // GK saves (1 point per 3 saves)
  if (position === 'GK') {
    points += Math.floor(stats.saves / 3)
  }

  // Penalty saves
  points += stats.penalty_saves * 5

  // Cards
  points -= stats.yellow_cards * 1
  points -= stats.red_cards * 3

  // Own goals
  points -= stats.own_goals * 2

  // Bonus
  points += stats.bonus

  return points
}

export function applycaptain(points: number, isTripleCaptain: boolean): number {
  return isTripleCaptain ? points * 3 : points * 2
}

// Quick inline test — run with: npx ts-node lib/game/points.ts
if (require.main === module) {
  const gkStats = {
    player_id: 'test', gameweek_id: 'test',
    minutes: 90, goals: 0, assists: 1, clean_sheet: true,
    saves: 6, penalty_saves: 1, yellow_cards: 0, red_cards: 0,
    own_goals: 0, bonus: 2,
  }
  console.log('GK points (expect 2+3+4+2+5+2=18):', calculatePoints(gkStats, 'GK'))

  const fwdStats = {
    player_id: 'test', gameweek_id: 'test',
    minutes: 90, goals: 2, assists: 1, clean_sheet: false,
    saves: 0, penalty_saves: 0, yellow_cards: 1, red_cards: 0,
    own_goals: 0, bonus: 3,
  }
  console.log('FWD points (expect 2+8+3-1+3=15):', calculatePoints(fwdStats, 'FWD'))
}
