import { useState, useCallback, useRef, useEffect } from 'react';
import { Modal, Button, Typography, Row, Col, Statistic, Table, Tag, Progress } from 'antd';
import { ThunderboltOutlined, CloseOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { runMonteCarloBatch, aggregateResults } from '../utils/monteCarlo';
import { classifyChoice } from '../utils/matchAlgorithm';
import { CountUp } from './AnimatedPresence';
import collegesData from '../data/colleges.json';

const collegeMap = Object.fromEntries(collegesData.map(c => [c.id, c]));

const CHUNK_SIZE = 100;
const TOTAL_SIMS = 1000;

export default function MonteCarloPanel({ choices, userRank, visible, onClose }) {
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const batchesRef = useRef([]);

  const startSimulation = useCallback(async () => {
    if (phase === 'running') return;
    setPhase('running');
    setProgress(0);
    batchesRef.current = [];

    const validChoices = choices.filter(c => c.minRank && c.minRank > 0);
    if (validChoices.length === 0) {
      setPhase('done');
      return;
    }

    for (let i = 0; i < TOTAL_SIMS; i += CHUNK_SIZE) {
      const chunk = runMonteCarloBatch(validChoices, userRank, CHUNK_SIZE, 0.08);
      batchesRef.current.push(chunk);
      setProgress(Math.min(i + CHUNK_SIZE, TOTAL_SIMS));
      await new Promise(r => requestAnimationFrame(r));
    }

    const aggregated = aggregateResults(validChoices, batchesRef.current);
    setResults(aggregated);
    setPhase('done');
  }, [choices, userRank, phase]);

  // Auto-start when opened
  useEffect(() => {
    if (visible && phase === 'idle') {
      startSimulation();
    }
  }, [visible, phase, startSimulation]);

  useEffect(() => {
    if (!visible) {
      setPhase('idle');
      setProgress(0);
      setResults(null);
      batchesRef.current = [];
    }
  }, [visible]);

  const getRiskColor = (rate) => {
    if (rate > 0.3) return '#52c41a';
    if (rate > 0.1) return '#faaf32';
    return '#ff4d4f';
  };

  const chartData = results ? [
    ...results.perChoiceRisk.map(r => ({
      name: `#${r.index}`,
      hits: r.hitCount,
      zone: classifyChoice(userRank, r.minRank).level,
    })),
    { name: '滑档', hits: results.missCount, zone: '滑档' },
  ] : [];

  const ZONE_COLORS = { '冲刺': '#ff4d4f', '稳妥': '#faaf32', '保底': '#52c41a', '滑档': '#8c8c8c' };

  const tableColumns = [
    { title: '序号', dataIndex: 'index', width: 55, align: 'center' },
    {
      title: '梯度', dataIndex: 'minRank', width: 70, align: 'center',
      render: (r) => {
        const cls = classifyChoice(userRank, r);
        return <Tag color={cls.color === 'red' ? 'red' : cls.color === 'orange' ? 'orange' : 'green'} style={{ margin: 0 }}>{cls.level}</Tag>;
      },
    },
    {
      title: '院校', dataIndex: 'collegeId', ellipsis: true,
      render: (id) => collegeMap[id]?.name || id,
    },
    { title: '最低位次', dataIndex: 'minRank', width: 90, align: 'center', render: (v) => v?.toLocaleString() },
    { title: '命中次数', dataIndex: 'hitCount', width: 85, align: 'center' },
    {
      title: '命中率', dataIndex: 'hitRate', width: 80, align: 'center',
      render: (v) => <span style={{ color: getRiskColor(v), fontWeight: 600 }}>{(v * 100).toFixed(1)}%</span>,
    },
    {
      title: '风险', dataIndex: 'riskLevel', width: 80, align: 'center',
      render: (v) => <Tag color={v === '高安全' ? 'green' : v === '中等' ? 'orange' : 'red'}>{v}</Tag>,
    },
  ];

  return (
    <Modal
      title={
        <span><ThunderboltOutlined style={{ color: '#faaf32', marginRight: 8 }} />AI 压力测试 · 蒙特卡洛推演</span>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      {/* Running state */}
      {phase === 'running' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{
              width: 64, height: 64, borderRadius: 20, margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #0a1628 0%, #1a3a5c 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,20,50,0.3)',
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 28, color: '#faaf32' }} />
          </motion.div>
          <Typography.Title level={4}>正在推演中...</Typography.Title>
          <Typography.Text type="secondary">
            模拟 {TOTAL_SIMS} 次平行宇宙中的录取结果
          </Typography.Text>
          <div style={{ marginTop: 20 }}>
            <CountUp value={progress} suffix={` / ${TOTAL_SIMS} 次`} style={{ fontSize: 28, fontWeight: 700, color: '#327de1' }} />
          </div>
          <Progress percent={Math.floor((progress / TOTAL_SIMS) * 100)} showInfo={false} style={{ maxWidth: 400, margin: '12px auto' }} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            每次模拟中，各院校录取位次会随机波动 ±8%，检测你的志愿表抗风险能力
          </Typography.Text>
        </div>
      )}

      {/* Results */}
      {phase === 'done' && results && (
        <div>
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={12} sm={6}>
              <CardStat title="滑档风险" value={`${(results.missRate * 100).toFixed(1)}%`}
                color={results.missRate < 0.05 ? '#52c41a' : results.missRate < 0.15 ? '#faaf32' : '#ff4d4f'} />
            </Col>
            <Col xs={12} sm={6}>
              <CardStat title="最可能在第" value={`${results.mostLikelyIndex + 1} 志愿`}
                color="#327de1" subtitle="被录取" />
            </Col>
            <Col xs={12} sm={6}>
              <CardStat title="最高命中率" value={`${(results.mostLikelyRate * 100).toFixed(1)}%`}
                color="#52c41a" />
            </Col>
            <Col xs={12} sm={6}>
              <CardStat title="总模拟次数" value={`${results.totalSims} 次`}
                color="#327de1" />
            </Col>
          </Row>

          {/* Bar chart */}
          <Typography.Title level={5} style={{ marginBottom: 8 }}>录取分布图</Typography.Title>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} hide />
              <Tooltip formatter={(v) => [`${v} 次`, '命中']} />
              <Bar dataKey="hits" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={ZONE_COLORS[entry.zone] || '#888'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Summary */}
          <Typography.Paragraph style={{ marginTop: 12, padding: '10px 14px', background: '#f7f8fa', borderRadius: 8, fontSize: 13 }}>
            {results.missRate < 0.05
              ? `✅ 志愿表抗风险能力强：在 ${TOTAL_SIMS} 次推演中，仅有 ${results.missCount} 次滑档（${(results.missRate * 100).toFixed(1)}%）。最可能在「第 ${results.mostLikelyIndex + 1} 志愿」被录取。`
              : results.missRate < 0.15
                ? `⚠️ 志愿表存在一定风险：${results.missCount} 次滑档（${(results.missRate * 100).toFixed(1)}%）。建议增加 3-5 个保底志愿，降低滑档概率。`
                : `🔴 志愿表风险较高：${results.missCount} 次滑档（${(results.missRate * 100).toFixed(1)}%）。强烈建议增加更多保底志愿，确保至少有 10 个以上位次远低于你的院校。`}
          </Typography.Paragraph>

          {/* Detail table */}
          <Table
            columns={tableColumns}
            dataSource={results.perChoiceRisk}
            rowKey="index"
            size="small"
            scroll={{ x: 600 }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        </div>
      )}
    </Modal>
  );
}

function CardStat({ title, value, color, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 8px', background: '#fafafa', borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      {subtitle && <div style={{ fontSize: 11, color: '#999' }}>{subtitle}</div>}
    </div>
  );
}
