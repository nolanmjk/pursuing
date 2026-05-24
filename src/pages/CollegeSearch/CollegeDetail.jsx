import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Tabs, Table, Typography, Button, Empty, Row, Col, Statistic, Segmented } from 'antd';
import {
  ArrowLeftOutlined, EnvironmentOutlined, BankOutlined, StarOutlined,
  TeamOutlined, BookOutlined, TrophyOutlined, RiseOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import admissionData from '../../data/admission_scores.json';
import guideData from '../../data/parent_guide_data.json';
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
  const allAdmissions = admissionData.filter(a => a.collegeId === id);

  // Dedup: prefer 本科批(C段) per-major data over 本科批 group-level data
  // for the same (majorId, subjectCategory, groupType)
  const collegeAdmissions = (() => {
    const groups = {};
    allAdmissions.forEach(a => {
      const groupType = (a._groupName || '').includes('国家专项') ? '国家专项' :
        (a._groupName || '').includes('高校专项') ? '高校专项' :
        (a._groupName || '').includes('民族班') ? '民族班' :
        (a._groupName || '').includes('预科') ? '预科' :
        (a._groupName || '').includes('中外合作') ? '中外合作' : '普通类';
      const key = [a.majorId, a.subjectCategory, groupType].join('||');
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    const result = [];
    for (const [key, records] of Object.entries(groups)) {
      const batchC = records.filter(r => r.batch === '本科批(C段)');
      const batchMain = records.filter(r => r.batch === '本科批');
      // When per-major data exists, remove group-level approximations
      if (batchC.length > 0) {
        result.push(...batchC);
        // Keep non-本科批/本科批(C段) records (e.g. 本科提前批)
        const other = records.filter(r => r.batch !== '本科批(C段)' && r.batch !== '本科批');
        result.push(...other);
      } else {
        result.push(...records);
      }
    }
    return result;
  })();

  // Group admissions by group type for chart & filter
  const groupTypes = [...new Set(collegeAdmissions.map(a => {
    const gn = a._groupName || '';
    if (gn.includes('国家专项')) return '国家专项';
    if (gn.includes('高校专项')) return '高校专项';
    if (gn.includes('民族班')) return '民族班';
    if (gn.includes('预科')) return '预科';
    if (gn.includes('中外合作')) return '中外合作';
    return '普通类';
  }))];

  const [admissionFilter, setAdmissionFilter] = useState('普通类');

  const filteredAdmissions = collegeAdmissions.filter(a => {
    const gn = a._groupName || '';
    if (admissionFilter === '全部') return true;
    if (admissionFilter === '普通类') return !gn.includes('国家专项') && !gn.includes('高校专项') && !gn.includes('民族班') && !gn.includes('预科') && !gn.includes('中外合作');
    return gn.includes(admissionFilter);
  });

  const chartData = (() => {
    // Only use 普通类 for the trend chart
    const normalEntries = collegeAdmissions.filter(a => {
      const gn = a._groupName || '';
      return !gn.includes('国家专项') && !gn.includes('高校专项') && !gn.includes('民族班') && !gn.includes('预科') && !gn.includes('中外合作');
    });
    const years = [...new Set(normalEntries.map(a => a.year))].sort();
    return years.map(year => {
      const entries = normalEntries.filter(a => a.year === year);
      const avgMin = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.minScore, 0) / entries.length) : null;
      return { year: `${year}年`, 最低分: avgMin };
    }).filter(d => d.最低分 !== null);
  })();

  // Stats: use filtered admissions
  const latestYear = Math.max(...collegeAdmissions.map(a => a.year), 0);
  const latestEntries = collegeAdmissions.filter(a => a.year === latestYear);
  const normalLatest = latestEntries.filter(a => {
    const gn = a._groupName || '';
    return !gn.includes('国家专项') && !gn.includes('高校专项') && !gn.includes('民族班') && !gn.includes('预科') && !gn.includes('中外合作');
  });
  const avgScore = normalLatest.length > 0 ? Math.round(normalLatest.reduce((s, e) => s + e.minScore, 0) / normalLatest.length) : '-';

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
                <RiseOutlined style={{ color: '#327de1', marginRight: 8 }} />录取趋势（普通类）
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
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography.Text strong style={{ fontSize: 15 }}>录取明细</Typography.Text>
              {groupTypes.length > 1 && (
                <Segmented
                  size="small"
                  value={admissionFilter}
                  onChange={setAdmissionFilter}
                  options={[
                    '普通类',
                    ...groupTypes.filter(g => g !== '普通类'),
                    '全部',
                  ].map(g => ({ label: g, value: g }))}
                />
              )}
            </div>
            <Table
              dataSource={filteredAdmissions}
              rowKey="id"
              size="small"
              columns={[
                { title: '年份', dataIndex: 'year', key: 'year', width: 55 },
                { title: '批次', dataIndex: 'batch', key: 'batch', width: 85 },
                { title: '科类', dataIndex: 'subjectCategory', key: 'subjectCategory', width: 65 },
                { title: '专业', dataIndex: 'majorId', key: 'major', width: 110, ellipsis: true,
                  render: (id) => {
                    const m = majorsData.find(x => x.id === id);
                    return m ? <span title={m.name}>{m.name}</span> : id;
                  }
                },
                { title: '专业组', dataIndex: '_groupName', key: 'groupName', width: 130, ellipsis: true,
                  render: (text) => text ? <Tag style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</Tag> : '-'
                },
                { title: '最低分', dataIndex: 'minScore', key: 'minScore', width: 65 },
                { title: '位次', dataIndex: 'minRank', key: 'minRank', width: 80,
                  render: (v) => v ? v.toLocaleString() : '-'
                },
                { title: '招生', dataIndex: 'plannedEnrollment', key: 'plannedEnrollment', width: 55 },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'career',
      label: '升学就业',
      children: (
        <Row gutter={[16, 16]}>
          {/* 保研梯队 */}
          {(() => {
            let tier = null;
            for (const [tKey, tVal] of Object.entries(guideData.postgradRates.tiers)) {
              if (tVal.schools && tVal.schools.includes(college.name)) {
                tier = tVal.label;
                break;
              }
            }
            const tierColor = !tier ? '#d9d9d9' :
              tier.includes('顶尖') ? '#ff4d4f' :
              tier.includes('优秀') ? '#fa8c16' :
              tier.includes('良好') ? '#1890ff' : '#d9d9d9';
            return (
              <Col xs={24} sm={12}>
                <Card size="small" style={{ borderRadius: 12, borderLeft: `3px solid ${tierColor}` }}>
                  <Typography.Text strong>保研率梯队</Typography.Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: tierColor, margin: '8px 0' }}>
                    {tier || '数据暂缺'}
                  </div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {tier
                      ? '保研率越高，本科生获得推免资格的机会越大，读研压力越小。'
                      : '该院校暂未收录保研率数据。985/有研究生院的院校保研率通常更高。'}
                  </Typography.Text>
                </Card>
              </Col>
            );
          })()}

          {/* 选调生资格 */}
          <Col xs={24} sm={12}>
            <Card size="small" style={{
              borderRadius: 12,
              borderLeft: `3px solid ${guideData.selectionTransfer.targetSchools.includes(college.name) ? '#faad14' : '#d9d9d9'}`,
            }}>
              <Typography.Text strong>甘肃省定向选调</Typography.Text>
              <div style={{ fontSize: 16, fontWeight: 700, margin: '8px 0', color: guideData.selectionTransfer.targetSchools.includes(college.name) ? '#faad14' : '#999' }}>
                {guideData.selectionTransfer.targetSchools.includes(college.name) ? '目标院校' : '非目标院校'}
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {guideData.selectionTransfer.targetSchools.includes(college.name)
                  ? '甘肃省定向选调面向41所指定高校招录，该校毕业生可参加定向选调。'
                  : '该校不在甘肃省定向选调41所目标院校之列，毕业生可通过省考进入公务员系统。'}
              </Typography.Text>
            </Card>
          </Col>

          {/* 企业目标校 */}
          {(() => {
            const tags = [];
            for (const [cat, info] of Object.entries(guideData.targetEmployers.categories)) {
              if (info.schools && info.schools.includes(college.name)) {
                tags.push(cat);
              }
            }
            return tags.length > 0 ? (
              <Col xs={24} sm={12}>
                <Card size="small" style={{ borderRadius: 12, borderLeft: '3px solid #1890ff' }}>
                  <Typography.Text strong>企业校招目标校</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <Space wrap size={[4, 4]}>
                      {tags.map(t => <Tag key={t} color="blue">{t}</Tag>)}
                    </Space>
                  </div>
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                    该校毕业生在以上领域的校招中具有明显优势。
                  </Typography.Text>
                </Card>
              </Col>
            ) : null;
          })()}

          {/* 中外合作办学 */}
          {(() => {
            const hasSino = admissionData.some(a => a.collegeId === college.id && (a._groupName || '').includes('中外合作'));
            return (
              <Col xs={24} sm={12}>
                <Card size="small" style={{
                  borderRadius: 12,
                  borderLeft: `3px solid ${hasSino ? '#722ed1' : '#d9d9d9'}`,
                }}>
                  <Typography.Text strong>中外合作办学项目</Typography.Text>
                  <div style={{ fontSize: 16, fontWeight: 700, margin: '8px 0', color: hasSino ? '#722ed1' : '#999' }}>
                    {hasSino ? '有合作项目' : '未收录'}
                  </div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {hasSino
                      ? '该院校在甘肃有中外合作办学专业组招生，学费通常高于普通专业。'
                      : '该院校暂未收录中外合作办学项目在甘肃的招生数据。'}
                  </Typography.Text>
                </Card>
              </Col>
            );
          })()}

          {/* 回乡就业 */}
          <Col xs={24} sm={12}>
            <Card size="small" style={{
              borderRadius: 12,
              borderLeft: `3px solid ${college.province === '甘肃' ? '#52c41a' : '#d9d9d9'}`,
            }}>
              <Typography.Text strong>甘肃就业优势</Typography.Text>
              <div style={{ fontSize: 16, fontWeight: 700, margin: '8px 0', color: college.province === '甘肃' ? '#52c41a' : '#999' }}>
                {college.province === '甘肃'
                  ? (guideData.backHomeEmployment.gansuAdvantage.high.includes(college.name) ? '省内高认可度' : '省内院校')
                  : '省外院校'}
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {college.province === '甘肃'
                  ? '省内院校在甘肃就业市场认可度高，本地企事业单位校招时优先考虑。'
                  : '省外院校甘肃籍学生回省就业主要通过考公/选调/央企驻甘机构等渠道。'}
              </Typography.Text>
            </Card>
          </Col>

          {/* 转专业建议 */}
          <Col xs={24}>
            <Card size="small" style={{ borderRadius: 12 }}>
              <Typography.Text strong>转专业政策参考</Typography.Text>
              <Typography.Paragraph style={{ fontSize: 13, marginTop: 8, marginBottom: 0 }}>
                不同层次院校的转专业难度差异显著：
              </Typography.Paragraph>
              <Table
                dataSource={[
                  { level: '985高校', policy: '转专业政策较为宽松', detail: '如浙大、中科大等实行大类招生，大二再选专业；多数985允许成绩达标后申请转专业' },
                  { level: '211高校', policy: '有一定门槛', detail: '通常要求大一成绩排名前10-20%，通过笔试/面试方可转专业' },
                  { level: '省属本科', policy: '门槛较高', detail: '名额有限，通常要求成绩排名前列，热门专业转入竞争激烈' },
                  { level: '一般建议', policy: '', detail: '报考前直接选择目标专业最稳妥。如需转专业，入学后尽早了解本校转专业实施细则（一般大一下学期或大二上学期申请）。' },
                ]}
                rowKey="level"
                size="small"
                pagination={false}
                columns={[
                  { title: '院校层次', dataIndex: 'level', key: 'level', width: 100, render: v => <Typography.Text strong>{v}</Typography.Text> },
                  { title: '转专业难度', dataIndex: 'policy', key: 'policy', width: 120, render: v => v ? <Tag>{v}</Tag> : null },
                  { title: '说明', dataIndex: 'detail', key: 'detail' },
                ]}
              />
            </Card>
          </Col>
        </Row>
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
