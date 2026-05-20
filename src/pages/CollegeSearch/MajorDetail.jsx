import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Table, Typography, Button, Empty, Row, Col, Timeline, Progress } from 'antd';
import { ArrowLeftOutlined, BookOutlined, CompassOutlined, TeamOutlined, TrophyOutlined, BankOutlined, EnvironmentOutlined } from '@ant-design/icons';
import majorsData from '../../data/majors.json';
import collegesData from '../../data/colleges.json';
import { useAppContext } from '../../context/AppContext';

const levelColors = { '985': 'magenta', '211': 'blue', '双一流': 'geekblue', '省重点': 'orange', '本科': 'green' };

// 霍兰德兴趣类型中文描述
const interestLabels = {
  '现实型': { label: '现实型 (R)', desc: '喜欢动手操作，偏好具体任务', color: '#EB2F96' },
  '研究型': { label: '研究型 (I)', desc: '喜欢思考探索，偏好分析研究', color: '#00C8E0' },
  '艺术型': { label: '艺术型 (A)', desc: '喜欢创意表达，偏好自由创作', color: '#7C5CFC' },
  '社会型': { label: '社会型 (S)', desc: '喜欢帮助他人，偏好人际互动', color: '#52C41A' },
  '企业型': { label: '企业型 (E)', desc: '喜欢领导说服，偏好商业活动', color: '#FA8C16' },
  '常规型': { label: '常规型 (C)', desc: '喜欢规范有序，偏好数据处理', color: '#8884D8' },
};

const demandColors = { '快速增长': '#52C41A', '持续增长': '#00C8E0', '稳定增长': '#FA8C16', '稳定': '#8884D8' };

export default function MajorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addHistory, toggleFavorite, isFavorited } = useAppContext();
  const major = majorsData.find(m => m.id === id);

  if (!major) return <Empty description="专业不存在" />;

  const offeringColleges = collegesData.filter(c => c.majors.includes(id));
  const careers = major.employmentProspects.careerPaths || [];

  return (
    <div>
      {/* Back + Title */}
      <div style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>返回</Button>

        {/* Hero Card */}
        <Card style={{
          borderRadius: 12,
          background: 'linear-gradient(135deg, #060918 0%, #0F1F2E 100%)',
          border: '1px solid rgba(0,200,230,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(0,200,230,0.15), rgba(124,92,252,0.1))',
              border: '1px solid rgba(0,200,230,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, flexShrink: 0,
            }}>
              <BookOutlined style={{ color: '#00C8E0' }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <Typography.Title level={2} style={{ margin: 0, color: '#fff' }}>{major.name}</Typography.Title>
                <Button
                  type={isFavorited(id, 'major') ? 'primary' : 'default'}
                  size="small"
                  onClick={() => toggleFavorite({ id, type: 'major', name: major.name })}
                  style={{ backdropFilter: 'blur(8px)', background: isFavorited(id, 'major') ? '#00C8E0' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: isFavorited(id, 'major') ? '#000' : '#fff' }}
                >
                  {isFavorited(id, 'major') ? '★ 已收藏' : '☆ 收藏'}
                </Button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Tag color="rgba(0,200,230,0.12)" style={{ color: '#00C8E0', border: '1px solid rgba(0,200,230,0.2)', background: 'rgba(0,200,230,0.06)' }}>{major.category}</Tag>
                <Tag color="rgba(124,92,252,0.12)" style={{ color: '#7C5CFC', border: '1px solid rgba(124,92,252,0.2)', background: 'rgba(124,92,252,0.06)' }}>{major.degree}</Tag>
                <Tag color="rgba(250,140,22,0.12)" style={{ color: '#FA8C16', border: '1px solid rgba(250,140,22,0.2)', background: 'rgba(250,140,22,0.06)' }}>代码: {major.code}</Tag>
                <Tag color="rgba(82,196,26,0.12)" style={{ color: '#52C41A', border: '1px solid rgba(82,196,26,0.2)', background: 'rgba(82,196,26,0.06)' }}>学制: {major.duration}年</Tag>
              </div>
            </div>
            {/* Demand indicator */}
            <div style={{
              padding: '12px 20px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center',
              flexShrink: 0,
            }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 4 }}>人才需求趋势</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: demandColors[major.employmentProspects.demandTrend] || '#00C8E0' }}>
                {major.employmentProspects.demandTrend}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Row gutter={[16, 16]}>
        {/* Left column */}
        <Col xs={24} lg={15}>
          {/* 专业概述 */}
          <Card
            title={<span><BookOutlined style={{ marginRight: 8, color: '#00C8E0' }} />专业概述</span>}
            style={{ marginBottom: 16, borderRadius: 10 }}
          >
            <Typography.Paragraph style={{ fontSize: 15, lineHeight: 1.8 }}>
              {major.description}
            </Typography.Paragraph>
          </Card>

          {/* 核心课程 */}
          <Card
            title={<span><TrophyOutlined style={{ marginRight: 8, color: '#FA8C16' }} />主要课程</span>}
            style={{ marginBottom: 16, borderRadius: 10 }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {major.coreCourses.map((course, i) => (
                <Tag key={i} style={{
                  fontSize: 13, padding: '4px 14px', borderRadius: 6,
                  background: 'rgba(0,200,230,0.04)', border: '1px solid rgba(0,200,230,0.12)',
                  color: '#0088A0', fontWeight: 500,
                }}>
                  {course}
                </Tag>
              ))}
            </div>
          </Card>

          {/* 职业路径 */}
          {careers.length > 0 && (
            <Card
              title={<span><CompassOutlined style={{ marginRight: 8, color: '#52C41A' }} />典型职业路径</span>}
              style={{ marginBottom: 16, borderRadius: 10 }}
            >
              <Timeline
                items={careers.map((career, i) => ({
                  color: i === 0 ? '#52C41A' : i === careers.length - 1 ? '#7C5CFC' : '#00C8E0',
                  children: (
                    <div>
                      <Typography.Text strong style={{ fontSize: 15 }}>{career}</Typography.Text>
                      <br />
                      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                        {i === 0 ? '初级岗位' : i === careers.length - 1 ? '高级/管理岗位' : `发展阶段 ${i + 1}`}
                      </Typography.Text>
                    </div>
                  ),
                }))}
              />
            </Card>
          )}
        </Col>

        {/* Right column */}
        <Col xs={24} lg={9}>
          {/* 就业前景 */}
          <Card
            title={<span><CompassOutlined style={{ marginRight: 8, color: '#EB2F96' }} />就业前景</span>}
            style={{ marginBottom: 16, borderRadius: 10 }}
          >
            <Descriptions column={1} size="small" bordered labelStyle={{ fontWeight: 500 }}>
              <Descriptions.Item label="薪资范围">
                <Typography.Text strong style={{ color: '#EB2F96' }}>{major.employmentProspects.averageSalary}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="需求趋势">
                <Tag color={major.employmentProspects.demandTrend === '快速增长' ? 'green' : major.employmentProspects.demandTrend === '持续增长' ? 'cyan' : 'gold'}>
                  {major.employmentProspects.demandTrend}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 12 }}>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>主要行业方向</Typography.Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {major.employmentProspects.industries.map((ind, i) => (
                  <Tag key={i} style={{ fontSize: 12, borderRadius: 4 }}>{ind}</Tag>
                ))}
              </div>
            </div>
            <Typography.Paragraph style={{ marginTop: 12, fontSize: 13, color: '#666', lineHeight: 1.7 }}>
              {major.employmentProspects.summary}
            </Typography.Paragraph>
          </Card>

          {/* 适合人群 */}
          <Card
            title={<span><TeamOutlined style={{ marginRight: 8, color: '#7C5CFC' }} />适合人群</span>}
            style={{ marginBottom: 16, borderRadius: 10 }}
          >
            <div style={{ marginBottom: 12 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>兴趣类型</Typography.Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {major.suitableFor.interests.map(type => {
                  const info = interestLabels[type];
                  return info ? (
                    <div key={type} style={{
                      padding: '8px 14px', borderRadius: 8,
                      background: `${info.color}15`, border: `1px solid ${info.color}30`,
                      flex: '1 1 calc(50% - 8px)', minWidth: 120,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: info.color }}>{info.label}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{info.desc}</div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>所需能力</Typography.Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {major.suitableFor.skills.map(skill => (
                  <Tag key={skill} style={{ fontSize: 13, padding: '2px 12px', borderRadius: 4, background: '#f5f5f5', border: '1px solid #e8e8e8' }}>
                    {skill}
                  </Tag>
                ))}
              </div>
            </div>
          </Card>

          {/* 开设院校 */}
          <Card
            title={<span><BankOutlined style={{ marginRight: 8, color: '#FA8C16' }} />开设院校 ({offeringColleges.length}所)</span>}
            style={{ borderRadius: 10 }}
          >
            {offeringColleges.length === 0 ? (
              <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {offeringColleges.map(c => (
                  <div
                    key={c.id}
                    onClick={() => { addHistory({ id: c.id, type: 'college', name: c.name }); navigate(`/colleges/${c.id}`); }}
                    style={{
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: 6, transition: 'all 0.2s',
                      border: '1px solid #f0f0f0',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,200,230,0.03)'; e.currentTarget.style.borderColor = 'rgba(0,200,230,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#f0f0f0'; }}
                  >
                    <div>
                      <Typography.Text strong style={{ fontSize: 14 }}>{c.name}</Typography.Text>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        <EnvironmentOutlined /> {c.city}
                      </div>
                    </div>
                    <Tag color={levelColors[c.level] || 'default'}>{c.level}</Tag>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
