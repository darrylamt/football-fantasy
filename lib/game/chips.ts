import type { ChipType, ChipUsed, Gameweek } from '@/types'

export function getAvailableChips(usedChips: ChipUsed[], currentGW: Gameweek): ChipType[] {
  const used = new Set(usedChips.map(c => c.chip))
  const all: ChipType[] = ['wildcard_1', 'wildcard_2', 'triple_captain', 'bench_boost', 'free_hit']

  return all.filter(chip => {
    if (used.has(chip)) return false
    // wildcard_1 available GW1-19, wildcard_2 available GW20+
    if (chip === 'wildcard_1' && currentGW.number > 19) return false
    if (chip === 'wildcard_2' && currentGW.number < 20) return false
    return true
  })
}

export function isChipActive(usedChips: ChipUsed[], chip: ChipType, gameweekId: string): boolean {
  return usedChips.some(c => c.chip === chip && c.gameweek_id === gameweekId)
}
