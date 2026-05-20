import { Card, Row, Col, Typography, Statistic } from 'antd';
import { SearchOutlined, FormOutlined, ExperimentOutlined, HeartOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import admissionData from '../../data/admission_scores.json';

const features = [
  { key: '/rank-conversion', icon: <TrophyOutlined style={{ fontSize: 34, color: '#00C8E0' }} />, title: '位次换算', desc: '查位次 → 算等效分 → 定区间', color: '#00C8E0' },
  { key: '/score-match', icon: <SearchOutlined style={{ fontSize: 34, color: '#7C5CFC' }} />, title: '分数匹配', desc: '智能匹配冲/稳/保三档院校', color: '#7C5CFC' },
  { key: '/colleges', icon: <HeartOutlined style={{ fontSize: 34, color: '#52C41A' }} />, title: '院校专业', desc: '浏览院校详情和历年录取数据', color: '#52C41A' },
  { key: '/simulate', icon: <FormOutlined style={{ fontSize: 34, color: '#FA8C16' }} />, title: '模拟填报', desc: '按甘肃省规则模拟，分析梯度', color: '#FA8C16' },
  { key: '/assessment', icon: <ExperimentOutlined style={{ fontSize: 34, color: '#EB2F96' }} />, title: '兴趣测评', desc: '霍兰德测评，发现适合你的专业', color: '#EB2F96' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { history } = useAppContext();
  const gansuColleges = collegesData.filter(c => c.province === '甘肃');

  return (
    <div>
      {/* Hero */}
      <div className="pursuing-hero">
        <h1>Pursuing</h1>
        <p className="subtitle">位 次 换 算 · 科 学 填 报 · 追 逐 梦 想</p>
      </div>

      {/* Feature cards */}
      <Typography.Title level={5} className="pursuing-section-title">全部功能</Typography.Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 40 }}>
        {features.map(f => (
          <Col xs={24} sm={12} lg={f.key === '/rank-conversion' ? 8 : 4} key={f.key}>
            <Card
              hoverable
              className="pursuing-feature-card"
              onClick={() => navigate(f.key)}
              style={{ '--card-accent': f.color, borderTop: `3px solid ${f.color}` }}
            >
              <div style={{ marginBottom: 10 }}>{f.icon}</div>
              <Typography.Title level={5} style={{ marginBottom: 6 }}>{f.title}</Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>{f.desc}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Stats */}
      <Typography.Title level={5} className="pursuing-section-title">数据概览</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="pursuing-stat-card">
            <Statistic title="收录院校" value={collegesData.length} suffix="所" valueStyle={{ color: '#00C8E0', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="pursuing-stat-card">
            <Statistic title="收录专业" value={majorsData.length} suffix="个" valueStyle={{ color: '#7C5CFC', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="pursuing-stat-card">
            <Statistic title="录取数据" value={admissionData.length} suffix="条" valueStyle={{ color: '#52C41A', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="pursuing-stat-card">
            <Statistic title="甘肃院校" value={gansuColleges.length} suffix="所" valueStyle={{ color: '#FA8C16', fontWeight: 700 }} />
          </Card>
        </Col>
      </Row>

      {/* Recent history */}
      {history.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <Typography.Title level={5} className="pursuing-section-title">最近浏览</Typography.Title>
          <Row gutter={[12, 12]}>
            {history.slice(0, 4).map(h => (
              <Col xs={24} sm={12} md={6} key={h.id + h.type}>
                <Card size="small" hoverable onClick={() => navigate(`/${h.type === 'college' ? 'colleges' : 'majors'}/${h.id}`)}>
                  {h.name}
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}
