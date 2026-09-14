import type { Role } from './species'

export interface PanelVisibility {
  role: Role
  intersectionRatio: number
}

/**
 * Given the current visibility ratio of each role panel (as reported by an
 * IntersectionObserver watching a scroll-snap container), returns which role should be
 * treated as "active." Ties and all-zero frames keep `previousActive` rather than picking
 * array order, so a symmetric mid-swipe frame — or a frame where the observer hasn't fired
 * yet — doesn't flicker the segmented control.
 */
export function resolveActiveCategory(panels: PanelVisibility[], previousActive: Role): Role {
  if (panels.length === 0) return previousActive
  let best = panels[0]!
  for (const panel of panels) {
    if (panel.intersectionRatio > best.intersectionRatio) best = panel
  }
  if (best.intersectionRatio === 0) return previousActive

  const tied = panels.filter((p) => p.intersectionRatio === best.intersectionRatio)
  if (tied.length > 1 && tied.some((p) => p.role === previousActive)) return previousActive
  return best.role
}
