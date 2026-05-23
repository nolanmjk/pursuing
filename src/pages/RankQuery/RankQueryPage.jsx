import { useState, useMemo } from 'react';
import { Card, Select, InputNumber, Button, Typography, Table, Statistic, Row, Col, Alert, Segmented, Empty } from 'antd';
import { SearchOutlined, TrophyOutlined, TeamOutlined, PercentageOutlined, BarChartOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import rankTable from '../../data/rank_table.json';
import { useAppContext } from '../../context/AppContext';
import { FadeInView } from '../../components/AnimatedPresence';

function getAvailableYears() {
  const years = [...new Set(rankTable.map(r => r.year))];
  years.sort((a, b) => b - a);
  return years;
}

function queryRank(score, year, subject) {
  const candidates = rankTable
    .filter(r => r.year === year && r.subjectCategory === subject)
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) return null;

  // Find exact or next-lower score entry
  let entry = null;
  let idx = -1;
  for (let i = 0; i < candidates.length; i++) {
    if (score >= candidates[i].score && (!entry || candidates[i].score > entry.score)) {
      entry = candidates[i];
      idx = i;
    }
  }

  if (!entry) {
    // Score lower than all entries — extrapolate
    const sorted = [...candidates].sort((a, b) => a.score - b.score);
    const lowest = sorted[0];
    const gap = lowest.score - score;
    const windowSize = Math.max(20, Math.floor(sorted.length * 0.25));
    const window = sorted.slice(0, windowSize);
    const scoreRange = window[window.length - 1].score - window[0].score;
    const density = scoreRange > 0
      ? Math.abs(window[window.length - 1].cumulativeCount - window[0].cumulativeCount) / scoreRange
      : 300;
    const estRank = Math.round(lowest.cumulativeCount + gap * density);
    const total = candidates[candidates.length - 1].cumulativeCount;
    return {
      cumulativeCount: estRank,
      totalExaminees: total,
      percentile: total > 0 ? ((estRank / total) * 100).toFixed(2) : null,
      sameScoreCount: null,
      extrapolated: true,
    };
  }

  // Same-score count: this cumulative minus higher-score cumulative
  const total = candidates[candidates.length - 1].cumulativeCount;
  let sameScoreCount;
  if (idx === 0) {
    sameScoreCount = entry.cumulativeCount;
  } else {
    sameScoreCount = entry.cumulativeCount - candidates[idx - 1].cumulativeCount;
  }

  return {
    cumulativeCount: entry.cumulativeCount,
    totalExaminees: total,
    percentile: total > 0 ? ((entry.cumulativeCount / total) * 100).toFixed(2) : null,
    sameScoreCount,
    extrapolated: false,
  };
}

function getNearbyScores(score, year, subject, range = 10) {
  const candidates = rankTable
    .filter(r => r.year === year && r.subjectCategory === subject)
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) return [];

  const minScore = Math.max(score - range, candidates[candidates.length - 1].score);
  const maxScore = Math.min(score + range, candidates[0].score);

  const nearby = [];
  for (let i = minScore; i <= maxScore; i++) {
    const entry = candidates.find(r => r.score === i);
    if (entry) {
      // Find index in sorted array
      const idx = candidates.findIndex(r => r.score === i);
      let sameCount;
      if (idx === 0) {
        sameCount = entry.cumulativeCount;
      } else {
        sameCount = entry.cumulativeCount - candidates[idx - 1].cumulativeCount;
      }
      nearby.push({
        score: entry.score,
        cumulativeCount: entry.cumulativeCount,
        sameScoreCount: sameCount,
        isUserScore: entry.score === score,
      });
    }
  }
  // Already sorted descending by the loop from min to max
  nearby.sort((a, b) => b.score - a.score);
  return nearby;
}

export default function RankQueryPage() {
  const { userSubject, setUserScore, setUserRank, setUserSubject } = useAppContext();
  const navigate = useNavigate();
  const availableYears = useMemo(() => getAvailableYears(), []);
  const [year, setYear] = useState(availableYears[0] || 2025);
  const [subject, setSubject] = useState(userSubject || '物理类');
  const [score, setScore] = useState(null);
  const [result, setResult] = useState(null);
  const [nearbyScores, setNearbyScores] = useState([]);

  const handleQuery = () => {
    if (score == null) return;
    const r = queryRank(score, year, subject);
    setResult(r);
    setNearbyScores(getNearbyScores(score, year, subject));
    if (r) {
      setUserScore(score);
      setUserRank(r.cumulativeCount);
      setUserSubject(subject);
    }
  };

  return (
    <div>
      <FadeInView>
        <Typography.Title level={4}><BarChartOutlined style={{ color: '#327de1', marginRight: 8 }} />一分一段表查询</Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          输入你的高考分数，查询在全省的位次和同分人数
        </Typography.Text>
      </FadeInView>

      <FadeInView delay={0.1}>
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 12]} align="middle">
            <Col xs={12} sm={5}>
              <Select value={year} onChange={setYear} style={{ width: '100%' }}
                options={availableYears.map(y => ({ value: y, label: `${y}年` }))} />
            </Col>
            <Col xs={12} sm={5}>
              <Segmented value={subject} onChange={setSubject}
                options={['物理类', '历史类']} />
            </Col>
            <Col xs={12} sm={6}>
              <InputNumber value={score} onChange={setScore} style={{ width: '100%' }}
                placeholder="输入分数" min={100} max={750} size="large" />
            </Col>
            <Col xs={12} sm={5}>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleQuery}
                disabled={score == null} size="large" block>查询</Button>
            </Col>
          </Row>
        </Card>
      </FadeInView>

      {result && (
        <>
          <FadeInView delay={0.1}>
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <Statistic title="全省位次" value={result.cumulativeCount}
                    suffix="名" prefix={<TrophyOutlined style={{ color: '#327de1' }} />}
                    valueStyle={{ color: '#327de1', fontWeight: 700 }} />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic title={result.extrapolated ? '同分人数(估)' : '同分人数'}
                    value={result.sameScoreCount != null ? result.sameScoreCount : '--'}
                    suffix={result.sameScoreCount != null ? '人' : ''}
                    prefix={<TeamOutlined style={{ color: '#faaf32' }} />}
                    valueStyle={{ color: '#faaf32', fontWeight: 600 }} />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic title="全省考生总数" value={result.totalExaminees}
                    suffix="人" prefix={<TeamOutlined style={{ color: '#4b96e1' }} />}
                    valueStyle={{ color: '#333', fontWeight: 600 }} />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic title="排名百分比" value={result.percentile || '--'}
                    suffix={result.percentile ? '%' : ''}
                    prefix={<PercentageOutlined style={{ color: '#52C41A' }} />}
                    valueStyle={{ color: '#52C41A', fontWeight: 600 }} />
                </Col>
              </Row>
            </Card>
          </FadeInView>

          <FadeInView delay={0.15}>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16, borderRadius: 8, background: 'rgba(50,125,225,0.06)', border: '1px solid rgba(50,125,225,0.15)' }}
              message={
                <span>
                  你的分数 <strong>{score}</strong> 分，在 <strong>{year}</strong> 年 <strong>{subject}</strong> 中，
                  全省排名第 <strong style={{ color: '#327de1' }}>{result.cumulativeCount}</strong> 名，
                  {result.sameScoreCount != null && <>同分约 <strong>{result.sameScoreCount}</strong> 人，</>}
                  位列全省前 <strong style={{ color: '#52C41A' }}>{result.percentile}%</strong>
                  {result.extrapolated && <span style={{ color: '#faaf32' }}>（估算值）</span>}。
                </span>
              }
            />
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Button type="primary" icon={<ThunderboltOutlined />} size="large"
                onClick={() => navigate('/score-match')}>
                用此位次去匹配院校
              </Button>
            </div>
          </FadeInView>

          {nearbyScores.length > 0 && (
            <FadeInView delay={0.2}>
              <Card title="附近分数位次对照" style={{ marginBottom: 16 }}>
                <Table
                  dataSource={nearbyScores}
                  rowKey="score"
                  size="small"
                  pagination={false}
                  scroll={{ y: 400 }}
                  rowClassName={(record) => record.isUserScore ? 'rank-query-highlight' : ''}
                  columns={[
                    { title: '分数', dataIndex: 'score', key: 'score', width: 80,
                      render: (v, r) => r.isUserScore ? <strong style={{ color: '#327de1', fontSize: 16 }}>{v}</strong> : v },
                    { title: '累计人数', dataIndex: 'cumulativeCount', key: 'cumulativeCount',
                      render: (v, r) => r.isUserScore ? <strong style={{ color: '#327de1' }}>{v}</strong> : v },
                    { title: '同分人数(估)', dataIndex: 'sameScoreCount', key: 'sameScoreCount',
                      render: (v, r) => r.isUserScore ? <strong style={{ color: '#327de1' }}>{v}</strong> : v },
                  ]}
                />
              </Card>
            </FadeInView>
          )}
        </>
      )}

      {result && (
        <FadeInView delay={0.25}>
          <Card title="如何读懂一分一段表">
            <Typography.Paragraph style={{ lineHeight: 2, color: '#555' }}>
              <strong style={{ color: '#333' }}>1. 累计人数</strong>：该分数及以上（≥当前分数）的考生总数，即你的全省位次。例如累计 8615 人说明有 8615 名考生分数不低于你。
              <br />
              <strong style={{ color: '#333' }}>2. 同分人数</strong>：和你考了完全相同分数的考生数量。同分段人数越多，竞争越激烈。
              <br />
              <strong style={{ color: '#333' }}>3. 位次比分数更重要</strong>：不同年份试卷难度不同，直接比较分数没有意义。用位次去匹配往年的录取位次（"位次法"）是更科学的填报方法。
              <br />
              <strong style={{ color: '#333' }}>4. 如何使用</strong>：查出位次后，去"分数匹配"页面输入位次，系统会自动根据往年录取位次为你匹配冲/稳/保院校。
            </Typography.Paragraph>
          </Card>
        </FadeInView>
      )}
    </div>
  );
}
