import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Tabs, Table, Typography, Button, Empty, Row, Col, Statistic } from 'antd';
import {
  ArrowLeftOutlined, EnvironmentOutlined, BankOutlined, StarOutlined,
  TeamOutlined, BookOutlined, TrophyOutlined, RiseOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import admissionData from '../../data/admission_scores.json';
import { useAppContext } from '../../context/AppContext';
import { FadeInView } from '../../components/AnimatedPresence';

const levelColors = { '985': 'gold', '211': 'blue', '双一流': 'geekblue', '省重点': 'orange', '本科': 'cyan' };

function campusGradient(level) {
  const gradients = {
    '985': 'linear-gradient(135deg, #00194b 0%, #0d2b5e 30%, #1a3d7c 100%)',
    '211': 'linear-gradient(135deg, #00194b 0%, #1a3570 30%, #2e5aa8 100%)',
    '省重点': 'linear-gradient(135deg, #0d2640 0%, #163d60 30%, #1f5480 100%)',
    '本科': 'linear-gradient(135deg, #162840 0%, #243d60 30%, #325580 100%)',
    '专科': 'linear-gradient(135deg, #2D2D2D 0%, #3D3D3D 50%, #505050 100%)',
  };
  return gradients[level] || gradients['本科'];
}

function levelAccent(level) {
  const accents = { '985': '#faaf32', '211': '#327de1', '双一流': '#4b96e1', '省重点': '#52C41A', '本科': '#4b96e1' };
  return accents[level] || '#4b96e1';
}

export default function CollegeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addHistory, toggleFavorite, isFavorited } = useAppContext();

  const college = collegesData.find(c => c.id === id);
  if (!college) return <Empty description="院校不存在" />;

  const accent = levelAccent(college.level);
  const collegeMajors = majorsData.filter(m => college.majors.includes(m.id));
  const collegeAdmissions = admissionData.filter(a => a.collegeId === id);

  const chartData = (() => {
    const years = [...new Set(collegeAdmissions.map(a => a.year))].sort();
    return years.map(year => {
      const entries = collegeAdmissions.filter(a => a.year === year);
      const avgMin = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.minScore, 0) / entries.length) : null;
      return { year: `${year}年`, 最低分: avgMin };
    }).filter(d => d.最低分 !== null);
  })();

  // Stats
  const latestYear = Math.max(...collegeAdmissions.map(a => a.year), 0);
  const latestEntries = collegeAdmissions.filter(a => a.year === latestYear);
  const avgScore = latestEntries.length > 0 ? Math.round(latestEntries.reduce((s, e) => s + e.minScore, 0) / latestEntries.length) : '-';

  const tabItems = [
    {
      key: 'info',
      label: '学校概况',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Card style={{ borderRadius: 12, background: '#fff', border: '1px solid #E2E5EA' }}>
              <Typography.Title level={5} style={{ marginBottom: 16 }}>
                <BookOutlined style={{ color: accent, marginRight: 8 }} />学校简介
              </Typography.Title>
              <Typography.Paragraph style={{ fontSize: 15, lineHeight: 1.9, color: '#555' }}>
                {college.description}
              </Typography.Paragraph>
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(college.tags || []).map(t => (
                  <Tag key={t} color={levelColors[t]} style={{ fontSize: 13, padding: '2px 12px' }}>{t}</Tag>
                ))}
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card style={{ borderRadius: 12, background: '#fff', border: '1px solid #E2E5EA' }}>
              <Descriptions column={1} size="small" bordered labelStyle={{ fontWeight: 500 }}>
                <Descriptions.Item label={<><EnvironmentOutlined /> 所在地</>}>{college.city}</Descriptions.Item>
                <Descriptions.Item label={<><BankOutlined /> 类型</>}>{college.type}</Descriptions.Item>
                <Descriptions.Item label={<><TrophyOutlined /> 层次</>}>
                  <Tag color={levelColors[college.level]}>{college.level}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="双一流">{college.isDoubleFirstClass ? '✅ 是' : '否'}</Descriptions.Item>
                <Descriptions.Item label="开设专业">{college.majors.length} 个</Descriptions.Item>
                {college.website && (
                  <Descriptions.Item label="官网">
                    <a href={college.website} target="_blank" rel="noreferrer" style={{ color: '#327de1' }}>访问</a>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'majors',
      label: `开设专业 (${collegeMajors.length})`,
      children: (
        <Card style={{ borderRadius: 12, background: '#fff', border: '1px solid #E2E5EA' }}>
          <Table
            dataSource={collegeMajors}
            rowKey="id"
            size="small"
            columns={[
              { title: '专业名称', dataIndex: 'name', key: 'name', render: (text, r) => (
                <a onClick={() => { addHistory({ id: r.id, type: 'major', name: r.name }); navigate(`/majors/${r.id}`); }}
                   style={{ fontWeight: 500 }}>{text}</a>
              )},
              { title: '专业代码', dataIndex: 'code', key: 'code', width: 100 },
              { title: '学科门类', dataIndex: 'category', key: 'category', width: 100 },
              { title: '学位', dataIndex: 'degree', key: 'degree', width: 120 },
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'admissions',
      label: '历年录取',
      children: (
        <div>
          {chartData.length > 0 && (
            <Card style={{ borderRadius: 12, background: '#fff', border: '1px solid #E2E5EA', marginBottom: 16 }}>
              <Typography.Title level={5} style={{ marginBottom: 16 }}>
                <RiseOutlined style={{ color: '#327de1', marginRight: 8 }} />录取趋势
              </Typography.Title>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="year" stroke="#556" />
                  <YAxis domain={['dataMin - 10', 'dataMax + 10']} stroke="#556" />
                  <Tooltip contentStyle={{ background: '#141824', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="最低分" stroke={accent} strokeWidth={3} dot={{ r: 5, fill: accent, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
          <Card style={{ borderRadius: 12, background: '#fff', border: '1px solid #E2E5EA' }}>
            <Table
              dataSource={collegeAdmissions}
              rowKey="id"
              size="small"
              columns={[
                { title: '年份', dataIndex: 'year', key: 'year', width: 60 },
                { title: '批次', dataIndex: 'batch', key: 'batch', width: 100 },
                { title: '科类', dataIndex: 'subjectCategory', key: 'subjectCategory', width: 80 },
                { title: '最低分', dataIndex: 'minScore', key: 'minScore', width: 80 },
                { title: '最低位次', dataIndex: 'minRank', key: 'minRank', width: 100 },
                { title: '平均分', dataIndex: 'avgScore', key: 'avgScore', width: 80 },
                { title: '招生人数', dataIndex: 'plannedEnrollment', key: 'plannedEnrollment', width: 80 },
              ]}
            />
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>

      {/* ── Hero ── */}
      <FadeInView>
      <div style={{
        position: 'relative', borderRadius: 16, overflow: 'hidden',
        marginBottom: 24, height: 300,
        background: campusGradient(college.level),
      }}>
        {/* Dot pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.12,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: -80, right: -60, width: 280, height: 280,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -40, width: 200, height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(50,125,225,0.12) 0%, transparent 70%)`,
        }} />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(6,9,24,0.1) 0%, rgba(6,9,24,0.3) 40%, rgba(6,9,24,0.85) 100%)',
          pointerEvents: 'none',
        }} />
        {/* Content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 36px', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: `linear-gradient(135deg, ${accent}33, rgba(255,255,255,0.08))`,
              border: `1px solid ${accent}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, flexShrink: 0,
            }}>
              <BankOutlined style={{ color: accent }} />
            </div>
            <div>
              <Typography.Title level={2} style={{ color: '#fff', margin: 0, textShadow: '0 2px 16px rgba(0,0,0,0.4)', lineHeight: 1.2 }}>
                {college.name}
              </Typography.Title>
              {college.englishName && (
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  background: `linear-gradient(90deg, ${accent}, ${accent}88, rgba(255,255,255,0.5))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: 4,
                }}>
                  {college.englishName}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                  <EnvironmentOutlined /> {college.city}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                  <BankOutlined /> {college.type} · {college.level}
                </span>
                {(college.tags || []).slice(0, 3).map(t => (
                  <Tag key={t} style={{
                    color: '#fff', fontSize: 11,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(4px)',
                  }}>{t}</Tag>
                ))}
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Button
                type={isFavorited(id, 'college') ? 'primary' : 'default'}
                size="middle"
                onClick={() => toggleFavorite({ id, type: 'college', name: college.name })}
                style={{
                  backdropFilter: 'blur(8px)',
                  background: isFavorited(id, 'college') ? accent : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${isFavorited(id, 'college') ? accent : 'rgba(255,255,255,0.2)'}`,
                  color: isFavorited(id, 'college') ? '#fff' : '#ddd',
                  fontWeight: 500,
                }}
              >
                {isFavorited(id, 'college') ? '★ 已收藏' : '☆ 收藏'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      </FadeInView>

      {/* ── Quick Stats Row ── */}
      <FadeInView delay={0.15}>
      {latestEntries.length > 0 && (
        <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <div style={{
              borderRadius: 10, padding: '16px 20px',
              background: '#fff', border: '1px solid #E2E5EA',
              borderLeft: `3px solid ${accent}`,
            }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>最新最低分</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: accent }}>{avgScore}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{latestYear}年</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{
              borderRadius: 10, padding: '16px 20px',
              background: '#fff', border: '1px solid #E2E5EA',
              borderLeft: '3px solid #4b96e1',
            }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>开设专业</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#4b96e1' }}>{collegeMajors.length}</div>
              <div style={{ fontSize: 11, color: '#999' }}>个本科专业</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{
              borderRadius: 10, padding: '16px 20px',
              background: '#fff', border: '1px solid #E2E5EA',
              borderLeft: '3px solid #327de1',
            }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>录取批次</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#327de1' }}>{[...new Set(collegeAdmissions.map(a => a.batch))].join('/')}</div>
              <div style={{ fontSize: 11, color: '#999' }}>招生批次</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{
              borderRadius: 10, padding: '16px 20px',
              background: '#fff', border: '1px solid #E2E5EA',
              borderLeft: '3px solid #52C41A',
            }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>院校层次</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#52C41A' }}>{college.level}</div>
              <div style={{ fontSize: 11, color: '#999' }}>
                {college.isDoubleFirstClass ? '双一流' : college.tags[0] || ''}
              </div>
            </div>
          </Col>
        </Row>
      )}

      </FadeInView>

      {/* ── Tabs ── */}
      <FadeInView delay={0.2}>
      <Tabs
        items={tabItems}
        tabBarStyle={{ marginBottom: 16 }}
      />
      </FadeInView>
    </div>
  );
}
