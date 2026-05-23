import { motion } from 'framer-motion';

const shimmer = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
};

function ShimmerBlock({ width, height, borderRadius = 6, style }) {
  return (
    <motion.div
      animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      style={{
        width, height, borderRadius, ...shimmer, ...style,
      }}
    />
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          background: '#fff', borderRadius: 12, padding: '20px 24px',
          border: '1px solid #E2E5EA',
        }}>
          <ShimmerBlock width="40%" height={18} />
          <div style={{ height: 8 }} />
          <ShimmerBlock width="70%" height={14} />
          <div style={{ height: 4 }} />
          <ShimmerBlock width="55%" height={14} />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #E2E5EA' }}>
      <div style={{ display: 'flex', gap: 24, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
        <ShimmerBlock width={80} height={14} />
        <ShimmerBlock width={60} height={14} />
        <ShimmerBlock width={50} height={14} />
        <ShimmerBlock width={70} height={14} />
        <ShimmerBlock width={60} height={14} />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ display: 'flex', gap: 24, padding: '10px 0', borderBottom: '1px solid #fafafa' }}>
          <ShimmerBlock width={100 + Math.random() * 40} height={13} />
          <ShimmerBlock width={60 + Math.random() * 30} height={13} />
          <ShimmerBlock width={50} height={13} />
          <ShimmerBlock width={80} height={13} />
          <ShimmerBlock width={45} height={13} />
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          flex: 1, background: '#fff', borderRadius: 12, padding: '16px 20px',
          border: '1px solid #E2E5EA', textAlign: 'center',
        }}>
          <ShimmerBlock width={36} height={28} borderRadius={8} style={{ margin: '0 auto 8px' }} />
          <ShimmerBlock width="60%" height={12} style={{ margin: '0 auto' }} />
        </div>
      ))}
    </div>
  );
}
