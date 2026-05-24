import { useState, useMemo } from 'react';
import {
  Card, Form, InputNumber, Select, Button, Steps, Typography,
  Tag, Table, Statistic, Row, Col, Alert, Space, Empty, Tabs, Segmented,
} from 'antd';
import {
  TrophyOutlined, CalculatorOutlined, AimOutlined,
  RiseOutlined, FallOutlined, MinusOutlined,
} from '@ant-design/icons';
import { useAppContext } from '../../context/AppContext';
import { computeEquivalentScores, calculateZones, getAvailableYears } from '../../utils/rankConverter';
import { matchColleges } from '../../utils/matchAlgorithm';
import { isMajorCompatible } from '../../utils/subjectFilter';
import admissionData from '../../data/admission_scores.json';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import { useNavigate } from 'react-router-dom';
import { FadeInView, StaggerCards, CardItem } from '../../components/AnimatedPresence';
import { motion } from 'framer-motion';

const CURRENT_YEAR = getAvailableYears()[0] || 2025;

export default function RankConversionPage() {
  const navigate = useNavigate();
  const { userScore, setUserScore, userRank, setUserRank, userSubject, setUserSubject } = useAppContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null);
  const [zoneType, setZoneType] = useState('moderate');
  const [matchResults, setMatchResults] = useState(null);
  const [regionFilter, setRegionFilter] = useState('省内');

  // Step 1: Input score → find rank
  const handleStep1 = () => {
    if (!userScore) return;
    const data = computeEquivalentScores(userScore, CURRENT_YEAR, userSubject);
    setResult(data);
    setCurrentStep(1);
    setUserRank(data?.rank);
  };

  // Step 2: View details → show explanation + reveal step 3
  const handleStep2 = () => {
    setCurrentStep(2);
  };

  // Step 3: Match colleges
  const handleStep3 = () => {
    if (userRank == null) return;
    setCurrentStep(3);
    const collegeMap = {};
    collegesData.forEach(c => { collegeMap[c.id] = c; });
    const filtered = admissionData.filter(a => {
      const college = collegeMap[a.collegeId];
      if (!college) return false;
      if (regionFilter === '省内' && college.province !== '甘肃') return false;
      if (regionFilter === '省外' && college.province === '甘肃') return false;
      if (!isMajorCompatible(a.majorId, userSubject)) return false;
      if (a.subjectCategory === userSubject) return true;
      if (userSubject === '物理类' && a.subjectCategory === '理科') return true;
      if (userSubject === '历史类' && a.subjectCategory === '文科') return true;
      return false;
    });
    setMatchResults(matchColleges(userRank, filtered, zoneType));
  };

  const zones = useMemo(() => {
    if (userRank == null) return null;
    return calculateZones(userRank, zoneType);
  }, [userRank, zoneType]);

  const trendIcon = result?.trend === 'rising' ? <RiseOutlined style={{ color: '#ff4d4f' }} /> :
    result?.trend === 'falling' ? <FallOutlined style={{ color: '#52c41a' }} /> :
    <MinusOutlined style={{ color: '#fa8c16' }} />;

  const trendText = result?.trend === 'rising' ? '竞争加剧，建议偏保守填报' :
    result?.trend === 'falling' ? '竞争缓解，可适当大胆' :
    '趋势平稳，可按常规策略';

  const trendColor = result?.trend === 'rising' ? '#ff4d4f' :
    result?.trend === 'falling' ? '#52c41a' : '#fa8c16';

  const renderAdmissionTable = (data) => {
    const majorMap = {};
    majorsData.forEach(m => { majorMap[m.id] = m; });
    const enriched = data.map(item => {
      const college = collegesData.find(c => c.id === item.collegeId);
      const major = majorsData.find(m => m.id === item.majorId);
      return { ...item, college, major };
    });

    return (
      <Table
        dataSource={enriched}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 8 }}
        expandable={{
          rowExpandable: (r) => (r._groupName || '').includes('普通类'),
          expandedRowRender: (r) => {
            const college = r.college;
            if (!college?.majors?.length) return null;
            const compatibleMajors = college.majors.filter(mid => isMajorCompatible(mid, userSubject));
            if (!compatibleMajors.length) {
              return (
                <div style={{ padding: '8px 12px', background: '#f8f9fb', borderRadius: 6 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    该院校在{userSubject}下暂无适配的专业方向数据
                  </Typography.Text>
                </div>
              );
            }
            return (
              <div style={{ padding: '8px 12px', background: '#f8f9fb', borderRadius: 6 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  该专业组涵盖以下专业方向（{compatibleMajors.length}个）：
                </Typography.Text>
                <div style={{ marginTop: 6 }}>
                  <Space wrap size={[4, 4]}>
                    {compatibleMajors.map(mid => (
                      <Tag key={mid} color="blue" style={{ fontSize: 12 }}>{majorMap[mid]?.name || mid}</Tag>
                    ))}
                  </Space>
                </div>
              </div>
            );
          },
        }}
        columns={[
          { title: '院校', dataIndex: ['college', 'name'], key: 'college', render: (t, r) => {
            const level = r.college?.level;
            const doubleFirst = r.college?.isDoubleFirstClass;
            let tag = null;
            if (level === '985') tag = <Tag color="red" style={{ marginLeft: 4, fontSize: 11, lineHeight: '18px' }}>985</Tag>;
            else if (level === '211') tag = <Tag color="orange" style={{ marginLeft: 4, fontSize: 11, lineHeight: '18px' }}>211</Tag>;
            else if (doubleFirst) tag = <Tag color="purple" style={{ marginLeft: 4, fontSize: 11, lineHeight: '18px' }}>双一流</Tag>;
            else if (level === '省重点') tag = <Tag color="green" style={{ marginLeft: 4, fontSize: 11, lineHeight: '18px' }}>省重点</Tag>;
            return <span><a onClick={() => navigate(`/colleges/${r.collegeId}`)}>{r.college?.name}</a>{tag}</span>;
          }},
          { title: '专业', dataIndex: ['major', 'name'], key: 'major', render: (t, r) => {
            if (r.majorId === 'maj_020101' && (r._groupName || '').includes('普通类')) {
              return <span>普通类<Tag color="default" style={{ marginLeft: 4, fontSize: 10, lineHeight: '16px' }}>含多专业</Tag></span>;
            }
            return <a onClick={() => navigate(`/majors/${r.majorId}`)}>{r.major?.name}</a>;
          }},
          { title: '最低分', dataIndex: 'minScore', key: 'minScore', width: 70 },
          { title: '最低位次', dataIndex: 'minRank', key: 'minRank', width: 80 },
          { title: '年份', dataIndex: 'year', key: 'year', width: 55 },
          { title: '录取概率', dataIndex: 'probability', key: 'probability', width: 80,
            render: v => <Tag color={v === '很高' ? 'green' : v === '较高' ? 'blue' : v === '中等' ? 'orange' : 'red'}>{v}</Tag>
          },
        ]}
      />
    );
  };

  return (
    <div>
      <FadeInView>
        <Typography.Title level={4}>位次换算3步法</Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          查位次 → 算等效分 → 定区间，科学填报志愿
        </Typography.Text>
      </FadeInView>

      <Steps
        current={currentStep}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: '查位次', icon: <TrophyOutlined /> },
          { title: '算等效分', icon: <CalculatorOutlined /> },
          { title: '定区间', icon: <AimOutlined /> },
        ]}
      />

      {/* Step 1: Input */}
      <Card title="第1步：查位次" style={{ marginBottom: 16 }}>
        <Form layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
          <Form.Item label="选科类别">
            <Select value={userSubject} onChange={v => { setUserSubject(v); setResult(null); setCurrentStep(0); }}
              style={{ width: 120 }}
              options={[{ value: '物理类', label: '物理类' }, { value: '历史类', label: '历史类' }]} />
          </Form.Item>
          <Form.Item label="你的高考分数">
            <InputNumber value={userScore} onChange={v => { setUserScore(v); setResult(null); setCurrentStep(0); }}
              min={200} max={750} style={{ width: 130 }} placeholder="如 580" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleStep1} disabled={!userScore}>查位次</Button>
          </Form.Item>
        </Form>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          输入{CURRENT_YEAR}年高考分数，系统在一分一段表中自动定位你的全省位次。
          <a onClick={() => navigate('/rank-query')} style={{ marginLeft: 8 }}>查看完整一分一段表 &rarr;</a>
        </Typography.Text>
      </Card>

      {/* Step 1 Result: Rank */}
      {currentStep >= 1 && result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card style={{ marginBottom: 16, borderColor: '#1677ff' }}>
            <Row gutter={24} align="middle">
              <Col>
                <Statistic title="你的位次" value={result.rank} suffix="名" valueStyle={{ color: '#1677ff', fontSize: 32, fontWeight: 'bold' }} />
              </Col>
              <Col>
                <Typography.Text type="secondary">
                  {userSubject} | {CURRENT_YEAR}年 | 分数 {userScore} 分
                </Typography.Text>
              </Col>
            </Row>
          </Card>
        </motion.div>
      )}

      {/* Step 2: Equivalent Scores */}
      {currentStep >= 1 && result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
        <Card title="第2步：算等效分" style={{ marginBottom: 16 }}
          extra={<Button type="primary" onClick={handleStep2} ghost>查看详情</Button>}>
          <Typography.Text>
            用你的位次 <Typography.Text strong>{result.rank}名</Typography.Text>，反查往年的对应分数：
          </Typography.Text>

          <Row gutter={[24, 16]} style={{ marginTop: 16 }}>
            {result.equivalents.map(e => (
              <Col xs={8} key={e.year}>
                <Card size="small" style={{ textAlign: 'center', background: '#fafafa' }}>
                  <Typography.Text type="secondary">{e.year}年</Typography.Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1677ff' }}>{e.score} 分</div>
                </Card>
              </Col>
            ))}
            <Col xs={24}>
              <Alert
                type={result.trend === 'rising' ? 'warning' : result.trend === 'falling' ? 'success' : 'info'}
                message={
                  <span>
                    三年等效分均值：<Typography.Text strong style={{ fontSize: 18 }}>{result.avgScore} 分</Typography.Text>
                    &nbsp;&nbsp;{trendIcon} 趋势：{trendText}
                  </span>
                }
              />
            </Col>
          </Row>

          {currentStep >= 2 && (
            <div style={{ marginTop: 16 }}>
              <Typography.Title level={5}>等效分计算说明</Typography.Title>
              <Typography.Paragraph>
                同样的全省第{result.rank}名，不同年份对应不同的分数。这是因为每年试卷难度和考生水平不同，分数会"热胀冷缩"。
                你的{CURRENT_YEAR}年{userScore}分在往年的实际竞争力，相当于{result.avgScore}分左右。
                用{result.avgScore}分去对比往年院校录取数据，比直接用{userScore}分更准确。
              </Typography.Paragraph>
              <Typography.Text type="secondary">
                {trendColor === '#ff4d4f' ? '位次段竞争逐年加剧，建议填报策略偏保守，稳保志愿占比应更高。' :
                 trendColor === '#52c41a' ? '位次段竞争逐年缓解，可以在确保保底的前提下适当冲击更好的院校。' :
                 '位次段竞争态势平稳，按常规冲稳保比例分配即可。'}
              </Typography.Text>
            </div>
          )}
        </Card>
        </motion.div>
      )}

      {/* Step 3: Zones + Match */}
      {currentStep >= 2 && zones && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card title="第3步：定区间（冲·稳·保）" style={{ marginBottom: 16 }}
          extra={<Button type="primary" onClick={handleStep3}>匹配院校</Button>}>
          <Space style={{ marginBottom: 16 }}>
            <Typography.Text>策略偏好：</Typography.Text>
            <Select value={zoneType} onChange={setZoneType} size="small" style={{ width: 120 }}
              options={[
                { value: 'moderate', label: '稳健型' },
                { value: 'aggressive', label: '进取型' },
                { value: 'conservative', label: '保守型' },
              ]} />
            <Typography.Text style={{ marginLeft: 16 }}>地区范围：</Typography.Text>
            <Segmented value={regionFilter} onChange={setRegionFilter} size="small" options={[
              { value: '省内', label: '甘肃省内' },
              { value: '省外', label: '省外' },
              { value: '不限', label: '不限' },
            ]} />
          </Space>

          <Row gutter={[24, 16]}>
            <Col xs={24} md={8}>
              <Card size="small" style={{ borderLeft: '4px solid #ff4d4f' }}>
                <Statistic title="冲刺" value={`${zones.reach.min} - ${zones.reach.max}`} suffix="名"
                  valueStyle={{ color: '#ff4d4f', fontSize: 20 }} />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  录取位次比你高，有一定差距但值得冲击
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ borderLeft: '4px solid #fa8c16' }}>
                <Statistic title="稳妥" value={`${zones.match.min} - ${zones.match.max}`} suffix="名"
                  valueStyle={{ color: '#fa8c16', fontSize: 20 }} />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  录取位次与你接近，最可能被录取
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ borderLeft: '4px solid #52c41a' }}>
                <Statistic title="保底" value={`${zones.safety.min} - ${zones.safety.max}`} suffix="名"
                  valueStyle={{ color: '#52c41a', fontSize: 20 }} />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  录取位次比你低，确保有学上
                </Typography.Text>
              </Card>
            </Col>
          </Row>

          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
            建议比例：冲刺 20-30% | 稳妥 40-50% | 保底 20-30%
          </Typography.Text>
        </Card>
        </motion.div>
      )}

      {/* Step 3 Results */}
      {currentStep >= 3 && matchResults && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card title="匹配院校列表" style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'reach', label: <span style={{ color: '#ff4d4f' }}>冲刺 ({matchResults.reach.length})</span>,
                children: matchResults.reach.length > 0 ? renderAdmissionTable(matchResults.reach) : <Empty description="没有匹配的冲刺院校" /> },
              { key: 'match', label: <span style={{ color: '#fa8c16' }}>稳妥 ({matchResults.match.length})</span>,
                children: matchResults.match.length > 0 ? renderAdmissionTable(matchResults.match) : <Empty description="没有匹配的稳妥院校" /> },
              { key: 'safety', label: <span style={{ color: '#52c41a' }}>保底 ({matchResults.safety.length})</span>,
                children: matchResults.safety.length > 0 ? renderAdmissionTable(matchResults.safety) : <Empty description="没有匹配的保底院校" /> },
            ]}
          />
        </Card>
        </motion.div>
      )}
    </div>
  );
}
