import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Tabs, Table, Typography, Button, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import admissionData from '../../data/admission_scores.json';
import { useAppContext } from '../../context/AppContext';

const levelColors = { '985': 'magenta', '211': 'blue', '双一流': 'geekblue', '省重点': 'orange', '本科': 'green' };

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
                <Line type="monotone" dataKey="最低分" stroke="#1677ff" strokeWidth={2} dot={{ r: 4 }} />
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
        <Typography.Title level={3} style={{ margin: 0 }}>{college.name}</Typography.Title>
        <Button type={isFavorited(id, 'college') ? 'primary' : 'default'} size="small" onClick={() => toggleFavorite({ id, type: 'college', name: college.name })}>
          {isFavorited(id, 'college') ? '★ 已收藏' : '☆ 收藏'}
        </Button>
      </div>
      <Tabs items={tabItems} />
    </div>
  );
}
