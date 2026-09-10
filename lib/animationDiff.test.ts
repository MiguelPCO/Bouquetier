import { describe, it, expect } from 'vitest'
import { diffStemUids } from './animationDiff'

describe('diffStemUids', () => {
  it('finds uids present in next but not prev as entering', () => {
    expect(diffStemUids([1, 2, 3], [2, 3, 4]).entering).toEqual([4])
  })

  it('finds uids present in prev but not next as exiting', () => {
    expect(diffStemUids([1, 2, 3], [2, 3, 4]).exiting).toEqual([1])
  })

  it('returns empty arrays when nothing changed', () => {
    expect(diffStemUids([1, 2], [1, 2])).toEqual({ entering: [], exiting: [] })
  })

  it('handles going from empty to non-empty (initial add)', () => {
    expect(diffStemUids([], [1])).toEqual({ entering: [1], exiting: [] })
  })

  it('handles going from non-empty to empty (remove last stem)', () => {
    expect(diffStemUids([1], [])).toEqual({ entering: [], exiting: [1] })
  })

  it('preserves nextUids order in entering (order matters for animation sequencing)', () => {
    expect(diffStemUids([5], [10, 5, 3]).entering).toEqual([10, 3])
  })
})
