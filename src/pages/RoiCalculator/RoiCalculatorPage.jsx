import { useState, useMemo } from 'react';
import {
  Card, Form, InputNumber, Select, Button, Typography,
  Statistic, Row, Col, Table, Space, Slider, Segmented, Alert, Divider,
} from 'antd';
import {
  DollarOutlined, RiseOutlined, CalculatorOutlined,
  TrophyOutlined, ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons';
import majorsData from '../../data/majors.json';
import collegesData from '../../data/colleges.json';
import { FadeInView } from '../../components/AnimatedPresence';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const parseSalary = (s) => {
  if (!s) return [6000, 15000];
  const nums = s.match(/\d+/g);
  if (!nums || nums.length === 0) return [6000, 15000];
  if (nums.length === 1) return [Number(nums[0]), Number(nums[0])];
  return [Number(nums[0]), Number(nums[1])];
};

const SALARY_GROWTH = 0.08; // Annual salary growth rate
const WORK_YEARS = 30;

export default function RoiCalculatorPage() {
  const navigate = useNavigate();
  const [majorA, setMajorA] = useState(null);
  const [majorB, setMajorB] = useState(null);
  const [tuitionA, setTuitionA] = useState(5000);
  const [tuitionB, setTuitionB] = useState(5000);
  const [livingCost, setLivingCost] = useState(1500);
  const [studyYears, setStudyYears] = useState(4);
  const [roiYears, setRoiYears] = useState(10);

  const calcROI = (majorId, tuition) => {
    if (!majorId) return null;
    const major = majorsData.find(m => m.id === majorId);
    if (!major) return null;

    const salaryRange = parseSalary(major.employmentProspects?.averageSalary);
    const avgMonthly = (salaryRange[0] + salaryRange[1]) / 2;
    const startAnnual = avgMonthly * 12;

    const totalCost = (tuition + livingCost * 10) * studyYears;

    // Cumulative earnings over N years with growth
    let totalEarnings = 0;
    for (let y = 0; y < roiYears; y++) {
      totalEarnings += startAnnual * Math.pow(1 + SALARY_GROWTH, y);
    }

    const netGain = totalEarnings - totalCost;
    const roi = ((netGain / totalCost) * 100).toFixed(1);
    const paybackYears = totalCost / startAnnual;

    return {
      major,
      avgMonthly,
      startAnnual,
      totalCost,
      totalEarnings: Math.round(totalEarnings),
      netGain: Math.round(netGain),
      roi,
      paybackYears: paybackYears.toFixed(1),
      salaryRange,
    };
  };

  const resultA = useMemo(() => calcROI(majorA, tuitionA), [majorA, tuitionA, tuitionA, livingCost, studyYears, roiYears]);
  const resultB = useMemo(() => calcROI(majorB, tuitionB), [majorB, tuitionB, livingCost, studyYears, roiYears]);

  const comparison = useMemo(() => {
    if (!resultA || !resultB) return null;
    return {
      salaryGap: resultA.startAnnual - resultB.startAnnual,
      roiGap: (parseFloat(resultA.roi) - parseFloat(resultB.roi)).toFixed(1),
      paybackGap: (parseFloat(resultA.paybackYears) - parseFloat(resultB.paybackYears)).toFixed(1),
      netGap: resultA.netGain - resultB.netGain,
    };
  }, [resultA, resultB]);

  const majorOptions = useMemo(() => {
    const groups = {};
    majorsData.forEach(m => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push({ value: m.id, label: m.name });
    });
    return Object.entries(groups).map(([cat, opts]) => ({
      label: cat,
      options: opts,
    }));
  }, []);

  return (
    <div>
      <FadeInView>
        <Typography.Title level={4}>
          <DollarOutlined /> 教育投资回报率（ROI）计算器
        </Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          量化比较不同专业/院校的教育投资价值——帮你算清楚"花这笔钱值不值"
        </Typography.Text>
      </FadeInView>

      {/* Input */}
      <FadeInView delay={0.1}>
        <Card style={{ borderRadius: 12, marginBottom: 24 }}>
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Typography.Title level={5}>方案A</Typography.Title>
              <Form layout="vertical" size="small">
                <Form.Item label="专业">
                  <Select
                    showSearch
                    value={majorA}
                    onChange={setMajorA}
                    placeholder="选择专业"
                    options={majorOptions}
                    filterOption={(input, option) => (option?.label || '').includes(input)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="年学费（元）">
                  <InputNumber value={tuitionA} onChange={setTuitionA} min={0} max={200000} step={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Form>
              {resultA && (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <Statistic title="预计起薪" value={resultA.avgMonthly} suffix="元/月" valueStyle={{ color: '#1677ff', fontSize: 24 }} />
                </div>
              )}
            </Col>

            <Col xs={24} md={12}>
              <Typography.Title level={5}>方案B <Typography.Text type="secondary" style={{ fontSize: 14 }}>(对比，选填)</Typography.Text></Typography.Title>
              <Form layout="vertical" size="small">
                <Form.Item label="专业">
                  <Select
                    showSearch
                    value={majorB}
                    onChange={setMajorB}
                    placeholder="选择对比专业（可选）"
                    options={majorOptions}
                    filterOption={(input, option) => (option?.label || '').includes(input)}
                    style={{ width: '100%' }}
                    allowClear
                  />
                </Form.Item>
                <Form.Item label="年学费（元）">
                  <InputNumber value={tuitionB} onChange={setTuitionB} min={0} max={200000} step={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Form>
              {resultB && (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <Statistic title="预计起薪" value={resultB.avgMonthly} suffix="元/月" valueStyle={{ color: '#fa8c16', fontSize: 24 }} />
                </div>
              )}
            </Col>
          </Row>

          <Divider />

          <Row gutter={[24, 12]}>
            <Col xs={24} sm={8}>
              <Form.Item label="月生活费（元）" style={{ marginBottom: 0 }}>
                <InputNumber value={livingCost} onChange={setLivingCost} min={500} max={5000} step={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="学习年限（年）" style={{ marginBottom: 0 }}>
                <InputNumber value={studyYears} onChange={setStudyYears} min={3} max={8} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label={`计算年限（毕业后${roiYears}年）`} style={{ marginBottom: 0 }}>
                <Slider value={roiYears} onChange={setRoiYears} min={1} max={30} marks={{ 1: '1年', 5: '5', 10: '10', 20: '20', 30: '30' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </FadeInView>

      {/* Results for A */}
      {resultA && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card style={{ borderRadius: 12, marginBottom: 16 }} title={`方案A：${resultA.major.name} 投资回报分析`}>
            <Row gutter={[16, 16]}>
              {[
                { title: '教育总成本', value: `${(resultA.totalCost / 10000).toFixed(1)}万`, suffix: '元', color: '#ff4d4f' },
                { title: `${roiYears}年累计收入`, value: `${(resultA.totalEarnings / 10000).toFixed(1)}万`, suffix: '元', color: '#1677ff' },
                { title: '净收益', value: `${(resultA.netGain / 10000).toFixed(1)}万`, suffix: '元', color: resultA.netGain > 0 ? '#52c41a' : '#ff4d4f' },
                { title: 'ROI', value: `${resultA.roi}%`, suffix: '', color: parseFloat(resultA.roi) > 100 ? '#52c41a' : '#fa8c16' },
                { title: '投资回收期', value: resultA.paybackYears, suffix: '年', color: '#722ed1' },
                { title: '毕业起薪', value: `${resultA.avgMonthly.toLocaleString()}`, suffix: '元/月', color: '#1677ff' },
              ].map(item => (
                <Col xs={12} sm={8} md={4} key={item.title}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic title={item.title} value={item.value} suffix={item.suffix} valueStyle={{ color: item.color, fontSize: 18 }} />
                  </Card>
                </Col>
              ))}
            </Row>

            <Typography.Paragraph style={{ marginTop: 16 }}>
              <Typography.Text strong>解读：</Typography.Text>
              投入 {(resultA.totalCost / 10000).toFixed(1)}万 的教育成本，
              毕业后预计起薪 {resultA.avgMonthly.toLocaleString()} 元/月，
              投资回收期约 {resultA.paybackYears} 年，
              {roiYears}年内净收益约 {(resultA.netGain / 10000).toFixed(1)} 万元，
              投资回报率 {resultA.roi}%。
            </Typography.Paragraph>

            <Alert
              type="info"
              showIcon
              style={{ marginTop: 8 }}
              message="本计算基于全国平均水平估算，未考虑地区差异、行业波动、通货膨胀等因素。薪资数据来自公开统计，实际收入因个人能力、就业地区和企业差异可能显著不同。"
            />
          </Card>
        </motion.div>
      )}

      {/* Comparison */}
      {comparison && resultA && resultB && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <Card style={{ borderRadius: 12, marginBottom: 16 }} title={`${resultA.major.name} vs ${resultB.major.name} 对比`}>
            <Row gutter={[16, 16]}>
              {[
                {
                  title: '起薪差距',
                  value: `${comparison.salaryGap > 0 ? '+' : ''}${(comparison.salaryGap / 12).toFixed(0)}`,
                  suffix: '元/月',
                  icon: comparison.salaryGap > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />,
                  color: comparison.salaryGap > 0 ? '#52c41a' : '#ff4d4f',
                  desc: `方案A比方案B${comparison.salaryGap > 0 ? '高' : '低'}`,
                },
                {
                  title: 'ROI差距',
                  value: `${comparison.roiGap > 0 ? '+' : ''}${comparison.roiGap}`,
                  suffix: '%',
                  icon: comparison.roiGap > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />,
                  color: comparison.roiGap > 0 ? '#52c41a' : '#ff4d4f',
                  desc: `方案A比方案B${comparison.roiGap > 0 ? '高' : '低'}`,
                },
                {
                  title: `${roiYears}年净收益差距`,
                  value: `${comparison.netGap > 0 ? '+' : ''}${(comparison.netGap / 10000).toFixed(1)}`,
                  suffix: '万元',
                  icon: comparison.netGap > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />,
                  color: comparison.netGap > 0 ? '#52c41a' : '#ff4d4f',
                  desc: `方案A比方案B${comparison.netGap > 0 ? '多赚' : '少赚'}`,
                },
              ].map(item => (
                <Col xs={24} sm={8} key={item.title}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic
                      title={item.title}
                      value={item.value}
                      suffix={item.suffix}
                      prefix={item.icon}
                      valueStyle={{ color: item.color, fontSize: 22 }}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Typography.Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </motion.div>
      )}

      {/* Tips */}
      <FadeInView delay={0.2}>
        <Card style={{ borderRadius: 12 }} title="ROI分析要点">
          <Row gutter={[16, 16]}>
            {[
              { title: '高ROI专业', content: '计算机、软件工程、人工智能、电气工程等工科专业通常起薪高、回收期短，但学费也相对较高。', color: '#52c41a' },
              { title: '稳定回报专业', content: '临床医学、口腔医学前期投入大（5-8年学制），但35岁后收入增长曲线陡峭，长期ROI优秀。', color: '#1677ff' },
              { title: '注意隐性成本', content: '公费师范生/免费医学定向虽然ROI好看（零学费），但需要权衡6年服务期对职业发展的限制。', color: '#fa8c16' },
              { title: 'ROI不是全部', content: '教师、公务员、社会工作等职业起薪不高但稳定性强、社会价值高。不要仅凭ROI做决策。', color: '#722ed1' },
            ].map(item => (
              <Col xs={24} sm={12} key={item.title}>
                <Card size="small" style={{ borderLeft: `3px solid ${item.color}` }}>
                  <Typography.Text strong>{item.title}</Typography.Text>
                  <Typography.Paragraph style={{ fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                    {item.content}
                  </Typography.Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </FadeInView>
    </div>
  );
}
