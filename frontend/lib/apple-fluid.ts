/**
 * Apple Fluid Interface Physics & Gesture Utilities
 *
 * Core principles:
 * - Motion starts from the live presentation value and is interruptible at any frame (§3)
 * - Springs parameterized by damping ratio (1.0 default, ~0.8 momentum) and response (0.3s-0.4s) (§4)
 * - Velocity handoff from pointer release into spring initial velocity (§5)
 * - Momentum projection using exponential decay (§6)
 * - Progressive rubber-band resistance at boundaries (§9)
 */

export interface AppleSpringOptions {
  /** Damping ratio: 1.0 = critically damped (no bounce), ~0.8 = slight momentum bounce */
  damping?: number;
  /** Response time in seconds: how quickly the spring approaches target (0.3–0.4s typical) */
  response?: number;
  /** Initial velocity in units/second handed off from gesture release (§5) */
  velocity?: number;
  /** Precision threshold to settle the spring */
  restDelta?: number;
  /** Velocity threshold to settle the spring */
  restSpeed?: number;
}

export interface SpringController {
  stop: () => void;
  getVelocity: () => number;
  getValue: () => number;
}

/**
 * §6 Momentum projection — Apple's exact exponential-decay projection function
 * from Designing Fluid Interfaces sample code.
 *
 * @param initialVelocity Velocity at release in px/s
 * @param decelerationRate 0.998 for normal scroll feel; 0.99 for snappier sheets
 */
export function project(
  initialVelocity: number,
  decelerationRate = 0.998
): number {
  return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * §6 Snap to the target nearest to the momentum-projected endpoint
 */
export function nearestSnapPoint(
  projectedEndpoint: number,
  snapPoints: readonly number[]
): number {
  if (snapPoints.length === 0) return projectedEndpoint;
  let nearest = snapPoints[0];
  let minDistance = Math.abs(projectedEndpoint - nearest);
  for (let i = 1; i < snapPoints.length; i++) {
    const distance = Math.abs(projectedEndpoint - snapPoints[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = snapPoints[i];
    }
  }
  return nearest;
}

/**
 * §5 Relative velocity normalization for spring APIs that expect normalized velocity
 */
export function relativeVelocity(
  gestureVelocity: number,
  currentValue: number,
  targetValue: number
): number {
  const distance = targetValue - currentValue;
  if (Math.abs(distance) < 0.001) return 0;
  return gestureVelocity / distance;
}

/**
 * §9 Rubber-banding — soft, progressive resistance past a boundary
 *
 * @param overshoot Distance dragged past the boundary (px)
 * @param dimension Size of the container/axis (px)
 * @param constant Resistance coefficient (Apple default = 0.55)
 */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55
): number {
  if (dimension <= 0 || overshoot === 0) return 0;
  const sign = overshoot < 0 ? -1 : 1;
  const absOvershoot = Math.abs(overshoot);
  return (
    sign *
    ((absOvershoot * dimension * constant) /
      (dimension + constant * absOvershoot))
  );
}

/**
 * Check if the user prefers reduced motion (§14)
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * §13 Multimodal feedback — causal, frame-synced haptic pulse on supported devices
 */
export function triggerHaptic(durationMs = 8): void {
  if (prefersReducedMotion()) return;
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore if blocked by browser autoplay/user-activation policy
    }
  }
}

/**
 * §3 & §4 Interruptible Apple Spring animator driven by requestAnimationFrame
 * Converts Apple's (damping, response) parameters to physical stiffness/damping
 * and integrates continuously from current value + live velocity.
 */
export function animateAppleSpring(
  from: number,
  to: number,
  onUpdate: (value: number, velocity: number) => void,
  onComplete?: () => void,
  options: AppleSpringOptions = {}
): SpringController {
  const dampingRatio = options.damping ?? 1.0;
  const response = Math.max(0.08, options.response ?? 0.36);
  const restDelta = options.restDelta ?? 0.4;
  const restSpeed = options.restSpeed ?? 4;

  let current = from;
  let velocity = options.velocity ?? 0;
  let rafId: number | null = null;
  let stopped = false;

  if (prefersReducedMotion() || Math.abs(to - from) <= restDelta) {
    onUpdate(to, 0);
    onComplete?.();
    return {
      stop: () => {
        stopped = true;
      },
      getVelocity: () => 0,
      getValue: () => to,
    };
  }

  // Convert Apple's (dampingRatio, response) -> physical (stiffness, dampingCoefficient)
  // mass = 1; omega_n = 2 * pi / response
  const omega = (2 * Math.PI) / response;
  const stiffness = omega * omega;
  const dampingCoeff = 2 * dampingRatio * omega;

  let lastTime = performance.now();

  const tick = (now: number) => {
    if (stopped) return;
    // Clamp delta time to avoid huge jumps on tab switch
    const dt = Math.min((now - lastTime) / 1000, 0.032);
    lastTime = now;

    if (dt > 0) {
      // Sub-step integration for numerical stability
      const steps = 2;
      const stepDt = dt / steps;
      for (let i = 0; i < steps; i++) {
        const displacement = current - to;
        const springForce = -stiffness * displacement;
        const dampingForce = -dampingCoeff * velocity;
        const acceleration = springForce + dampingForce;
        velocity += acceleration * stepDt;
        current += velocity * stepDt;
      }
    }

    const isAtRest =
      Math.abs(to - current) <= restDelta && Math.abs(velocity) <= restSpeed;

    if (isAtRest) {
      current = to;
      velocity = 0;
      onUpdate(to, 0);
      onComplete?.();
      return;
    }

    onUpdate(current, velocity);
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return {
    stop: () => {
      stopped = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
    getVelocity: () => velocity,
    getValue: () => current,
  };
}

/**
 * §2 & §5 Pointer velocity tracker — maintains a short ring buffer of recent
 * pointermove samples so release velocity reflects the user's true flick trajectory.
 */
export class PointerVelocityTracker {
  private samples: Array<{ x: number; y: number; t: number }> = [];

  record(x: number, y: number, t = performance.now()): void {
    this.samples.push({ x, y, t });
    const cutoff = t - 100; // keep last 100ms window
    while (this.samples.length > 2 && this.samples[0].t < cutoff) {
      this.samples.shift();
    }
  }

  getVelocity(): { vx: number; vy: number } {
    if (this.samples.length < 2) return { vx: 0, vy: 0 };
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const dtSeconds = (last.t - first.t) / 1000;
    if (dtSeconds <= 0.001) return { vx: 0, vy: 0 };
    return {
      vx: (last.x - first.x) / dtSeconds,
      vy: (last.y - first.y) / dtSeconds,
    };
  }

  reset(): void {
    this.samples = [];
  }
}
