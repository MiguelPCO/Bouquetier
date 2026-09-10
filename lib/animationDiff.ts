export interface StemDiff {
  entering: number[]
  exiting: number[]
}

/** Which stem uids were added or removed between two renders, by comparing their uid lists.
 *  Pulled out of BouquetCanvas so the "who changed" logic is unit-testable without a DOM or
 *  GSAP — the animation wiring that consumes this (Task 3) isn't. */
export function diffStemUids(prevUids: number[], nextUids: number[]): StemDiff {
  const prevSet = new Set(prevUids)
  const nextSet = new Set(nextUids)
  return {
    entering: nextUids.filter((uid) => !prevSet.has(uid)),
    exiting: prevUids.filter((uid) => !nextSet.has(uid)),
  }
}
