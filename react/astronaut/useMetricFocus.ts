'use client';
/**
 * useMetricFocus.ts · Which metric the twin points at, from the cards around it.
 *
 * Same rules as the vanilla dashboard (src/tesai/js/ui/ui.js, syncTwin and the card listeners):
 *   hover or keyboard focus on a card  previews that metric (focus = metric, pinned = false)
 *   click, Enter or Space              selects it; again on the same card clears the selection
 *   a selection wins over a hover      (focus = selected ?? hovered, pinned = selected != null)
 *   a touch tap selects; touch never previews, but the tapped card keeps keyboard focus, so after a second
 *   tap clears the selection it previews until focus moves (the vanilla dashboard does the same)
 *
 *   const f = useMetricFocus();
 *   <button className="metric" {...f.cardProps('hr')}>Heart rate</button>
 *   <Twin art={art} metrics={metrics} focus={f.focus} pinned={f.pinned} />
 *
 * Pass `selected` and `onSelect` to keep the selection in your own state (a detail drawer, the URL).
 */
import * as React from 'react';

interface Options {
  selected?: string | null;
  onSelect?: (metric: string | null) => void;
}

export function useMetricFocus({ selected: controlled, onSelect }: Options = {}) {
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [own, setOwn] = React.useState<string | null>(null);
  const selected = controlled !== undefined ? controlled : own;

  const select = React.useCallback((metric: string | null) => {
    if (controlled === undefined) setOwn(metric);
    onSelect?.(metric);
  }, [controlled, onSelect]);

  const cardProps = React.useCallback((metric: string) => ({
    'aria-pressed': selected === metric,
    onPointerEnter: (e: React.PointerEvent) => { if (e.pointerType !== 'touch') setHovered(metric); },
    onPointerLeave: () => setHovered(h => (h === metric ? null : h)),
    onFocus: () => setHovered(metric),
    onBlur: () => setHovered(h => (h === metric ? null : h)),
    onClick: () => select(selected === metric ? null : metric),
  }), [selected, select]);

  return { focus: selected ?? hovered, pinned: selected != null, selected, hovered, select, cardProps };
}
