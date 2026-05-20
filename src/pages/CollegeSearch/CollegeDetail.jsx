import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Tabs, Table, Typography, Button, Empty } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, BankOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import admissionData from '../../data/admission_scores.json';
import { useAppContext } from '../../context/AppContext';

const levelColors = { '985': 'magenta', '211': 'blue', '双一流': 'geekblue', '省重点': 'orange', '本科': 'green' };

function campusGradient(level) {
  const gradients = {
    '985': 'linear-gradient(135deg, #0F2027 0%, #203A43 30%, #2C5364 100%)',
    '211': 'linear-gradient(135deg, #1A1A3E 0%, #2D3561 30%, #4A6FA5 100%)',
    '省重点': 'linear-gradient(135deg, #0F1F14 0%, #1A4731 30%, #2D6A4F 100%)',
    '本科': 'linear-gradient(135deg, #1A1A2E 0%, #2B2B5C 30%, #4A4A8A 100%)',
    '专科': 'linear-gradient(135deg, #2D2D2D 0%, #3D3D3D 50%, #505050 100%)',
  };
  return gradients[level] || gradients['本科'];
}

export default function CollegeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addHistory, toggleFavorite, isFavorited } = useAppContext();

  const college = collegesData.find(c => c.id === id);
  if (!college) return <Empty description="院校不存在" />;

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

  const tabItems = [
    {
      key: 'info',
      label: '学校概况',
      children: (
        <Card>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="院校名称">{college.name}</Descriptions.Item>
            <Descriptions.Item label="所在地">{college.city}</Descriptions.Item>
            <Descriptions.Item label="院校类型">{college.type}</Descriptions.Item>
            <Descriptions.Item label="办学层次">{college.level}</Descriptions.Item>
            <Descriptions.Item label="双一流">{college.isDoubleFirstClass ? '是' : '否'}</Descriptions.Item>
            <Descriptions.Item label="官网"><a href={college.website} target="_blank" rel="noreferrer">{college.website}</a></Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 16 }}>
            <Typography.Text>{college.description}</Typography.Text>
          </div>
          <div style={{ marginTop: 16 }}>
            {college.tags.map(t => <Tag key={t} color={levelColors[t] || 'default'}>{t}</Tag>)}
          </div>
        </Card>
      ),
    },
    {
      key: 'majors',
      label: `开设专业 (${collegeMajors.length})`,
      children: (
        <Table
          dataSource={collegeMajors}
          rowKey="id"
          size="small"
          columns={[
            { title: '专业名称', dataIndex: 'name', key: 'name', render: (text, r) => <a onClick={() => { addHistory({ id: r.id, type: 'major', name: r.name }); navigate(`/majors/${r.id}`); }}>{text}</a> },
            { title: '专业代码', dataIndex: 'code', key: 'code', width: 100 },
            { title: '学科门类', dataIndex: 'category', key: 'category', width: 100 },
            { title: '学位', dataIndex: 'degree', key: 'degree', width: 120 },
          ]}
        />
      ),
    },
    {
      key: 'admissions',
      label: '历年录取分数线',
      children: (
        <div>
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip />
                <Line type="monotone" dataKey="最低分" stroke="#00C8E0" strokeWidth={2} dot={{ r: 4, fill: '#00C8E0' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          <Table
            dataSource={collegeAdmissions}
            rowKey="id"
            size="small"
            style={{ marginTop: 16 }}
            columns={[
              { title: '年份', dataIndex: 'year', key: 'year', width: 60 },
              { title: '批次', dataIndex: 'batch', key: 'batch', width: 100 },
              { title: '科类', dataIndex: 'subjectCategory', key: 'subjectCategory', width: 80 },
              { title: '最低分', dataIndex: 'minScore', key: 'minScore', width: 80 },
              { title: '最低位次', dataIndex: 'minRank', key: 'minRank', width: 100 },
              { title: '平均分', dataIndex: 'avgScore', key: 'avgScore', width: 80 },
              { title: '计划招生', dataIndex: 'plannedEnrollment', key: 'plannedEnrollment', width: 80 },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
      </div>

      {/* Campus Photo Hero */}
      <div style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 24,
        height: 260,
        background: college.image ? `url(${college.image}) center/cover no-repeat` : campusGradient(college.level),
      }}>
        {/* Gradient overlay for readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(6,9,24,0.15) 0%, rgba(6,9,24,0.45) 50%, rgba(6,9,24,0.8) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Content overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '28px 32px',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Typography.Title level={2} style={{ color: '#fff', margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
              {college.name}
            </Typography.Title>
            <Button
              type={isFavorited(id, 'college') ? 'primary' : 'default'}
              size="small"
              onClick={() => toggleFavorite({ id, type: 'college', name: college.name })}
              style={{ backdropFilter: 'blur(8px)', background: isFavorited(id, 'college') ? '#00C8E0' : 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: isFavorited(id, 'college') ? '#000' : '#fff' }}
            >
              {isFavorited(id, 'college') ? '★ 已收藏' : '☆ 收藏'}
            </Button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              <EnvironmentOutlined /> {college.city}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              <BankOutlined /> {college.type} · {college.level}
            </span>
            {college.tags.map(t => (
              <Tag key={t} color="rgba(255,255,255,0.15)" style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>
                {t}
              </Tag>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs content */}
      <Tabs items={tabItems} />
    </div>
  );
}
