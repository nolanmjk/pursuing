import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { useState, useEffect } from 'react';
import { VerticalAlignTopOutlined } from '@ant-design/icons';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 999,
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(8,12,22,0.85)',
            backdropFilter: 'blur(10px)',
            color: '#aab',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
          whileHover={{ scale: 1.1, color: '#327de1', borderColor: 'rgba(50,125,225,0.3)' }}
          whileTap={{ scale: 0.9 }}
        >
          <VerticalAlignTopOutlined />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ── Scroll progress bar ──
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: 'linear-gradient(90deg, #327de1, #4b96e1)',
        transformOrigin: '0%',
        zIndex: 9999,
        scaleX: scrollYProgress,
      }}
    />
  );
}
