import { Card, Row, Col, Typography, Statistic } from 'antd';
import { SearchOutlined, FormOutlined, ExperimentOutlined, HeartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import admissionData from '../../data/admission_scores.json';

const features = [
  { key: '/score-match', icon: <SearchOutlined style={{ fontSize: 36, color: '#1677ff' }} />, title: '分数匹配学校', desc: '输入分数和位次，智能匹配冲/稳/保三档院校' },
  { key: '/colleges', icon: <HeartOutlined style={{ fontSize: 36, color: '#52c41a' }} />, title: '院校专业查询', desc: '浏览学校详情、专业介绍和历年录取分数线' },
  { key: '/simulate', icon: <FormOutlined style={{ fontSize: 36, color: '#fa8c16' }} />, title: '志愿模拟填报', desc: '按甘肃省规则模拟填报，分析梯度是否合理' },
  { key: '/assessment', icon: <ExperimentOutlined style={{ fontSize: 36, color: '#722ed1' }} />, title: '兴趣测评', desc: '霍兰德职业兴趣测评，发现适合你的专业方向' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { history } = useAppContext();

  const gansuColleges = collegesData.filter(c => c.province === '甘肃');
  const gansuAdmissions = admissionData.filter(a => a.province === '甘肃');

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Typography.Title level={2}>高考志愿助手</Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 16 }}>
          科学填报志愿，助力高考圆梦
        </Typography.Text>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
        {features.map(f => (
          <Col xs={24} sm={12} lg={6} key={f.key}>
            <Card hoverable onClick={() => navigate(f.key)} style={{ textAlign: 'center', height: '100%' }}>
              <div style={{ marginBottom: 12 }}>{f.icon}</div>
              <Typography.Title level={5}>{f.title}</Typography.Title>
              <Typography.Text type="secondary">{f.desc}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={12} sm={6}>
          <Card><Statistic title="收录院校" value={collegesData.length} suffix="所" /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="收录专业" value={majorsData.length} suffix="个" /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="录取数据" value={admissionData.length} suffix="条" /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="甘肃院校" value={gansuColleges.length} suffix="所" /></Card>
        </Col>
      </Row>

      {history.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <Typography.Title level={5}>最近浏览</Typography.Title>
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
