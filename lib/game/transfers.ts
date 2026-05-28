export function calculateTransferCost(
  transferCount: number,
  freeTransfers: number,
  chipActive: 'wildcard_1' | 'wildcard_2' | 'free_hit' | null
): number {
  if (chipActive === 'wildcard_1' || chipActive === 'wildcard_2' || chipActive === 'free_hit') {
    return 0
  }
  const paidTransfers = Math.max(0, transferCount - freeTransfers)
  return paidTransfers * 4
}

export function calcNextGWFreeTransfers(
  currentFreeTransfers: number,
  transfersMade: number,
  chipActive: 'wildcard_1' | 'wildcard_2' | 'free_hit' | null
): number {
  if (chipActive === 'free_hit') {
    // Squad reverts, so free transfers stay as they were before
    return currentFreeTransfers
  }
  const used = Math.min(transfersMade, currentFreeTransfers)
  const banked = currentFreeTransfers - used
  // Roll over unused, gain 1 per GW, max 2
  return Math.min(2, banked + 1)
}
