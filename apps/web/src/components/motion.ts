// Framer Motion reutilizáveis — variantes e helpers.
import type { Transition, Variants } from "framer-motion";

type BezierDef = [number, number, number, number];
const EXPO_OUT: BezierDef = [0.16, 1, 0.3, 1];

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideRight: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
};

/** Container que aplica stagger nos filhos */
export const stagger = (delay = 0.06): Variants => ({
  animate: { transition: { staggerChildren: delay } },
});

/** Transições padrão */
export const spring: Transition = { type: "spring", stiffness: 320, damping: 28 };
export const ease: Transition = { duration: 0.35, ease: EXPO_OUT };
export const easeFast: Transition = { duration: 0.22, ease: EXPO_OUT };
