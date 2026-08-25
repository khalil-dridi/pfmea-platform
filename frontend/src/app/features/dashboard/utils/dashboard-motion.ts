export const MOTION = {
  micro: 180,
  value: 380,
  chart: 420,
  panel: 280
} as const;

const EASE_OUT = (t: number): number => 1 - (1 - t) ** 3;

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function tweenNumber(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void
): () => void {
  if (prefersReducedMotion() || from === to || duration <= 0) {
    onUpdate(to);
    return () => undefined;
  }

  let frame = 0;
  const start = performance.now();

  const tick = (now: number): void => {
    const progress = Math.min((now - start) / duration, 1);
    onUpdate(from + (to - from) * EASE_OUT(progress));

    if (progress < 1) {
      frame = requestAnimationFrame(tick);
    }
  };

  frame = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(frame);
}
