import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useSpring } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// ── Page Transition: wraps route content ──
export function PageTransition({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Stagger container: children fade in one by one ──
export function StaggerCards({ children, className, style, staggerDelay = 0.06 }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay, delayChildren: 0.1 } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Single card item: fade up + scale ──
export function CardItem({ children, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={{
        hidden: { opacity: 0, y: 28, scale: 0.97 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Fade in when scrolled into view ──
export function FadeInView({ children, className, style, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

// ── CountUp: animate a number from 0 to target on view ──
export function CountUp({ value, suffix = '', style }) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });

  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, value, spring]);

  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const unsub = spring.on('change', v => setDisplay(Math.round(v)));
    return unsub;
  }, [spring]);

  return (
    <motion.span ref={ref} style={style}>
      {display.toLocaleString()}{suffix}
    </motion.span>
  );
}

// ── Bounce on tap ──
export function BounceOnClick({ children, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {children}
    </motion.div>
  );
}
