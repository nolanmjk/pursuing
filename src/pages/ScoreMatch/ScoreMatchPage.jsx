import { useState, useMemo } from 'react';
import { Card, Form, InputNumber, Select, Button, Tabs, Table, Tag, Typography, Empty, Space, message, Segmented, Row, Col } from 'antd';
import { useAppContext } from '../../context/AppContext';
import { matchColleges } from '../../utils/matchAlgorithm';
import { scoreToRank } from '../../utils/rankConverter';
import admissionData from '../../data/admission_scores.json';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import cutoffData from '../../data/cutoff_lines.json';
import { useNavigate } from 'react-router-dom';
import { FadeInView } from '../../components/AnimatedPresence';
import { StatSkeleton, TableSkeleton } from '../../components/Skeleton';
import { motion } from 'framer-motion';

const CURRENT_YEAR = 2025;

const tierColors = { reach: '#ff4d4f', match: '#fa8c16', safety: '#52c41a' };
const tierLabels = { reach: '冲刺', match: '稳妥', safety: '保底' };
const probColors = { '很高': 'green', '较高': 'cyan', '中等': 'orange', '较低': 'red' };

export default function ScoreMatchPage() {
  const { selectedProvince, userScore, setUserScore, userRank, setUserRank, userSubject, setUserSubject } = useAppContext();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [derivedRank, setDerivedRank] = useState(null);
  const [regionFilter, setRegionFilter] = useState('省内');
  const [loading, setLoading] = useState(false);

  const filteredData = useMemo(() => {
    const collegeMap = {};
    collegesData.forEach(c => { collegeMap[c.id] = c; });
    return admissionData.filter(a => {
      const college = collegeMap[a.collegeId];
      if (!college) return false;
      if (regionFilter === '省内' && college.province !== '甘肃') return false;
      if (regionFilter === '省外' && college.province === '甘肃') return false;
      if (a.subjectCategory === userSubject) return true;
      if (userSubject === '物理类' && a.subjectCategory === '理科') return true;
      if (userSubject === '历史类' && a.subjectCategory === '文科') return true;
      return false;
    });
  }, [regionFilter, userSubject]);

  const cutoffInfo = useMemo(() => {
    if (userScore == null) return null;
    const yearData = cutoffData.find(d => d.year === CURRENT_YEAR);
    if (!yearData) return null;
    return yearData.batches
      .filter(b => b.subject === userSubject)
      .sort((a, b) => b.score - a.score);
  }, [userScore, userSubject]);

  const handleMatch = () => {
    let rank = userRank;
    if (rank == null && userScore != null) {
      rank = scoreToRank(userScore, CURRENT_YEAR, userSubject);
      if (rank != null) {
        setDerivedRank(rank);
        setUserRank(rank);
      } else {
        message.warning('无法从分数计算出位次，请手动输入位次');
        return;
      }
    }
    if (rank == null) {
      message.warning('请输入分数或位次');
      return;
    }
    setResults(null);
    setLoading(true);
    // Brief delay so the skeleton renders — then compute
    setTimeout(() => {
      const matched = matchColleges(rank, filteredData);
      setResults(matched);
      setLoading(false);
    }, 400);
  };

  const renderTable = (data) => {
    const majorMap = {};
    majorsData.forEach(m => { majorMap[m.id] = m; });
    const enriched = data.map(item => {
      const college = collegesData.find(c => c.id === item.collegeId);
      const major = majorsData.find(m => m.id === item.majorId);
      return { ...item, college, major };
    });

    const columns = [
      { title: '院校', dataIndex: ['college', 'name'], key: 'college', render: (text, r) => {
        const level = r.college?.level;
        const doubleFirst = r.college?.isDoubleFirstClass;
        let tag = null;
        if (level === '985') tag = <Tag color="red" style={{ marginLeft: 4, fontSize: 11, lineHeight: '18px' }}>985</Tag>;
        else if (level === '211') tag = <Tag color="orange" style={{ marginLeft: 4, fontSize: 11, lineHeight: '18px' }}>211</Tag>;
        else if (doubleFirst) tag = <Tag color="purple" style={{ marginLeft: 4, fontSize: 11, lineHeight: '18px' }}>双一流</Tag>;
        else if (level === '省重点') tag = <Tag color="green" style={{ marginLeft: 4, fontSize: 11, lineHeight: '18px' }}>省重点</Tag>;
        return <span><a onClick={() => navigate(`/colleges/${r.collegeId}`)}>{r.college?.name}</a>{tag}</span>;
      }},
      { title: '专业', dataIndex: ['major', 'name'], key: 'major', render: (text, r) => {
        if (r.majorId === 'maj_020101' && (r._groupName || '').includes('普通类')) {
          return <span>普通类<Tag color="default" style={{ marginLeft: 4, fontSize: 10, lineHeight: '16px' }}>含多专业</Tag></span>;
        }
        return <a onClick={() => navigate(`/majors/${r.majorId}`)}>{r.major?.name}</a>;
      }},
      { title: '最低分', dataIndex: 'minScore', key: 'minScore', width: 70 },
      { title: '最低位次', dataIndex: 'minRank', key: 'minRank', width: 90 },
      { title: '年份', dataIndex: 'year', key: 'year', width: 55 },
      { title: '录取概率', dataIndex: 'probability', key: 'probability', width: 80, render: v => <Tag color={probColors[v]}>{v}</Tag> },
    ];

    return <Table dataSource={enriched} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} size="small"
      expandable={{
        rowExpandable: (r) => (r._groupName || '').includes('普通类'),
        expandedRowRender: (r) => {
          const college = r.college;
          if (!college?.majors?.length) return null;
          return (
            <div style={{ padding: '8px 12px', background: '#f8f9fb', borderRadius: 6 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                该专业组涵盖以下专业方向（参考）：
              </Typography.Text>
              <div style={{ marginTop: 6 }}>
                <Space wrap size={[4, 4]}>
                  {college.majors.map(mid => (
                    <Tag key={mid} color="blue" style={{ fontSize: 12 }}>{majorMap[mid]?.name || mid}</Tag>
                  ))}
                </Space>
              </div>
            </div>
          );
        },
      }}
    />;
  };

  return (
    <div>
      {/* Hero */}
      <FadeInView>
        <div style={{
          borderRadius: 16, padding: '28px 32px', marginBottom: 24,
          background: 'linear-gradient(135deg, #080C16 0%, #0d1a2d 50%, #080C16 100%)',
          border: '1px solid rgba(0,200,230,0.08)',
        }}>
          <Typography.Title level={3} style={{ color: '#fff', marginBottom: 4 }}>分数匹配</Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            输入你的分数或位次，智能匹配冲刺、稳妥、保底三档院校
          </Typography.Text>
        </div>
      </FadeInView>

      {/* Form */}
      <FadeInView delay={0.1}>
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={6}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>选科类别</div>
            <Select value={userSubject} onChange={setUserSubject} style={{ width: '100%' }} options={[{ value: '物理类', label: '物理类' }, { value: '历史类', label: '历史类' }]} />
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>地区范围</div>
            <Segmented block value={regionFilter} onChange={setRegionFilter} options={[
              { value: '省内', label: '甘肃省内' },
              { value: '省外', label: '省外' },
              { value: '不限', label: '不限' },
            ]} />
          </Col>
          <Col xs={12} sm={4}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>你的分数</div>
            <InputNumber value={userScore} onChange={setUserScore} min={0} max={750} style={{ width: '100%' }} placeholder="如 520" />
          </Col>
          <Col xs={12} sm={4}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>或输入位次</div>
            <InputNumber value={userRank} onChange={setUserRank} min={1} style={{ width: '100%' }} placeholder="更准确" />
          </Col>
          <Col xs={24} sm={2}>
            <Button type="primary" size="large" onClick={handleMatch} disabled={userRank == null && userScore == null} block>
              开始匹配
            </Button>
          </Col>
        </Row>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
          提示：输入分数会自动换算位次，直接输入位次更精确。
          <a onClick={() => navigate('/rank-query')} style={{ marginLeft: 8 }}>一分一段表 &rarr;</a>
          {derivedRank != null && (
            <span style={{ color: '#327de1', marginLeft: 8 }}>已换算位次：<strong>{derivedRank.toLocaleString()}</strong> 名</span>
          )}
        </Typography.Text>
      </Card>
      </FadeInView>

      {/* Results */}
      {/* Loading skeleton */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <StatSkeleton count={3} />
          <div style={{ height: 16 }} />
          <TableSkeleton rows={5} />
        </motion.div>
      )}

      {results && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Cutoff comparison */}
          {cutoffInfo && userScore != null && (
            <Card size="small" style={{ marginBottom: 16, borderRadius: 12 }}>
              <Typography.Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>批次线对比</Typography.Text>
              <Row gutter={[12, 10]}>
                {cutoffInfo.map(line => {
                  const diff = userScore - line.score;
                  const above = diff >= 0;
                  const maxDiff = Math.max(...cutoffInfo.map(l => Math.abs(userScore - l.score)), 1);
                  const barWidth = Math.min(Math.abs(diff) / maxDiff * 100, 100);
                  return (
                    <Col xs={24} sm={12} md={8} key={line.name}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, color: '#555', width: 60, flexShrink: 0 }}>{line.name}线</span>
                        <span style={{ fontSize: 13, fontWeight: 600, width: 40, flexShrink: 0 }}>{line.score}分</span>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            style={{
                              height: '100%', borderRadius: 3,
                              background: above ? '#52C41A' : '#ff4d4f',
                              marginLeft: above ? 0 : `${100 - barWidth}%`,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 12, color: above ? '#52C41A' : '#ff4d4f', fontWeight: 500, flexShrink: 0, width: 40, textAlign: 'right' }}>
                          {above ? `+${diff}` : `-${Math.abs(diff)}`}
                        </span>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          )}

          {/* Summary cards */}
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {(['reach', 'match', 'safety']).map(tier => (
              <Col xs={8} key={tier}>
                <div style={{
                  borderRadius: 12, padding: '16px 20px', textAlign: 'center',
                  background: '#fff', border: `2px solid ${tierColors[tier]}22`,
                  borderTop: `3px solid ${tierColors[tier]}`,
                }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: tierColors[tier] }}>{results[tier].length}</div>
                  <div style={{ fontSize: 13, color: '#999' }}>{tierLabels[tier]}院校</div>
                </div>
              </Col>
            ))}
          </Row>

          {/* Tabs */}
          <Card style={{ borderRadius: 12 }} bodyStyle={{ paddingTop: 8 }}>
          <Tabs items={[
            { key: 'reach', label: <span style={{ color: tierColors.reach, fontWeight: 500 }}>冲刺 ({results.reach.length})</span>, children: results.reach.length > 0 ? renderTable(results.reach) : <Empty description="你的位次较高，目前数据中没有适合冲刺的院校" /> },
            { key: 'match', label: <span style={{ color: tierColors.match, fontWeight: 500 }}>稳妥 ({results.match.length})</span>, children: results.match.length > 0 ? renderTable(results.match) : <Empty description="稳妥区间暂时没有匹配院校" /> },
            { key: 'safety', label: <span style={{ color: tierColors.safety, fontWeight: 500 }}>保底 ({results.safety.length})</span>, children: results.safety.length > 0 ? renderTable(results.safety) : <Empty description="建议选择分数更低的院校作为保底" /> },
          ]} />
          </Card>
        </motion.div>
      )}
    </div>
  );
}
