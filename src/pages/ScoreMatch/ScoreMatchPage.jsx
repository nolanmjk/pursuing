import { useState, useMemo } from 'react';
import { Card, Form, InputNumber, Select, Button, Tabs, Table, Tag, Typography, Empty, message, Segmented, Row, Col } from 'antd';
import { useAppContext } from '../../context/AppContext';
import { matchColleges } from '../../utils/matchAlgorithm';
import { scoreToRank } from '../../utils/rankConverter';
import admissionData from '../../data/admission_scores.json';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import cutoffData from '../../data/cutoff_lines.json';
import { useNavigate } from 'react-router-dom';
import { FadeInView } from '../../components/AnimatedPresence';
import { motion } from 'framer-motion';

const CURRENT_YEAR = 2025;

export default function ScoreMatchPage() {
  const { selectedProvince, userScore, setUserScore, userRank, setUserRank, userSubject, setUserSubject } = useAppContext();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [derivedRank, setDerivedRank] = useState(null);
  const [regionFilter, setRegionFilter] = useState('省内'); // 省内 | 省外 | 不限

  const filteredData = useMemo(() => {
    const collegeMap = {};
    collegesData.forEach(c => { collegeMap[c.id] = c; });
    return admissionData.filter(a => {
      const college = collegeMap[a.collegeId];
      if (!college) return false;
      // Region filter
      if (regionFilter === '省内' && college.province !== '甘肃') return false;
      if (regionFilter === '省外' && college.province === '甘肃') return false;
      // Subject match
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
      .sort((a, b) => b.score - a.score); // highest cutoff first
  }, [userScore, userSubject]);

  const handleMatch = () => {
    // Use rank if provided; otherwise derive from score
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
    const matched = matchColleges(rank, filteredData);
    setResults(matched);
  };

  const renderTable = (data) => {
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
      { title: '最低分', dataIndex: 'minScore', key: 'minScore', width: 80 },
      { title: '最低位次', dataIndex: 'minRank', key: 'minRank', width: 100 },
      { title: '年份', dataIndex: 'year', key: 'year', width: 60 },
      { title: '录取概率', dataIndex: 'probability', key: 'probability', width: 80, render: v => <Tag color={v === '很高' ? 'green' : v === '较高' ? 'blue' : v === '中等' ? 'orange' : 'red'}>{v}</Tag> },
    ];

    return <Table dataSource={enriched} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} size="small" />;
  };

  return (
    <div>
      <FadeInView>
        <Typography.Title level={4}>分数匹配学校</Typography.Title>
      </FadeInView>
      <Card style={{ marginBottom: 24 }}>
        <Form layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
          <Form.Item label="选科类别">
            <Select value={userSubject} onChange={setUserSubject} style={{ width: 120 }} options={[{ value: '物理类', label: '物理类' }, { value: '历史类', label: '历史类' }]} />
          </Form.Item>
          <Form.Item label="地区范围">
            <Segmented value={regionFilter} onChange={setRegionFilter} options={[
              { value: '省内', label: '甘肃省内' },
              { value: '省外', label: '省外' },
              { value: '不限', label: '不限' },
            ]} />
          </Form.Item>
          <Form.Item label="你的分数">
            <InputNumber value={userScore} onChange={setUserScore} min={0} max={750} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="你的位次">
            <InputNumber value={userRank} onChange={setUserRank} min={1} style={{ width: 140 }} placeholder="输入位次更准确" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleMatch} disabled={userRank == null && userScore == null}>开始匹配</Button>
          </Form.Item>
        </Form>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          提示：输入分数会自动计算位次，也可以直接输入位次。位次匹配比分数匹配更准确。
          <a onClick={() => navigate('/rank-query')} style={{ marginLeft: 8 }}>一分一段表查询 &rarr;</a>
          {derivedRank != null && (
            <span style={{ color: '#327de1', marginLeft: 8 }}>已从分数计算位次：<strong>{derivedRank.toLocaleString()}</strong> 名</span>
          )}
        </Typography.Text>
      </Card>

      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        {cutoffInfo && userScore != null && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 8]}>
              {cutoffInfo.map(line => {
                const diff = userScore - line.score;
                const above = diff >= 0;
                return (
                  <Col xs={12} sm={8} md={6} key={line.name}>
                    <div style={{
                      padding: '8px 12px', borderRadius: 8, fontSize: 13,
                      background: above ? 'rgba(82,196,26,0.05)' : 'rgba(255,77,79,0.05)',
                      border: `1px solid ${above ? 'rgba(82,196,26,0.2)' : 'rgba(255,77,79,0.2)'}`,
                    }}>
                      <span style={{ color: '#666' }}>{line.name}线</span>
                      <span style={{ marginLeft: 8, fontWeight: 600 }}>{line.score}分</span>
                      <span style={{ marginLeft: 8, fontSize: 12, color: above ? '#52C41A' : '#ff4d4f' }}>
                        {above ? `高${diff}分` : `低${Math.abs(diff)}分`}
                      </span>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        )}

        <Tabs items={[
          { key: 'reach', label: <span style={{ color: '#ff4d4f' }}>冲刺 ({results.reach.length})</span>, children: results.reach.length > 0 ? renderTable(results.reach) : <Empty description="你的位次较高，目前数据中没有适合冲刺的院校。可以尝试放宽地区范围" /> },
          { key: 'match', label: <span style={{ color: '#fa8c16' }}>稳妥 ({results.match.length})</span>, children: results.match.length > 0 ? renderTable(results.match) : <Empty description="你的位次处于数据覆盖范围的边缘，稳妥区间暂时没有匹配院校" /> },
          { key: 'safety', label: <span style={{ color: '#52c41a' }}>保底 ({results.safety.length})</span>, children: results.safety.length > 0 ? renderTable(results.safety) : <Empty description="你的位次较低，所有院校对你来说都是冲刺目标。建议选择分数更低的院校作为保底" /> },
        ]} />
        </motion.div>
      )}
    </div>
  );
}
