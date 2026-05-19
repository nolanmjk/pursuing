import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Table, Typography, Button, Empty, Divider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import majorsData from '../../data/majors.json';
import collegesData from '../../data/colleges.json';
import admissionData from '../../data/admission_scores.json';
import { useAppContext } from '../../context/AppContext';

export default function MajorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addHistory, toggleFavorite, isFavorited } = useAppContext();
  const major = majorsData.find(m => m.id === id);

  if (!major) return <Empty description="专业不存在" />;

  const offeringColleges = collegesData.filter(c => c.majors.includes(id));
  const majorAdmissions = admissionData.filter(a => a.majorId === id);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
        <Typography.Title level={3} style={{ margin: 0 }}>{major.name}</Typography.Title>
        <Button type={isFavorited(id, 'major') ? 'primary' : 'default'} size="small" onClick={() => toggleFavorite({ id, type: 'major', name: major.name })}>
          {isFavorited(id, 'major') ? '★ 已收藏' : '☆ 收藏'}
        </Button>
      </div>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="专业代码">{major.code}</Descriptions.Item>
          <Descriptions.Item label="学科门类">{major.category}</Descriptions.Item>
          <Descriptions.Item label="专业类别">{major.subcategory}</Descriptions.Item>
          <Descriptions.Item label="学位">{major.degree}</Descriptions.Item>
          <Descriptions.Item label="学制">{major.duration}年</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="专业介绍" style={{ marginBottom: 16 }}>
        <Typography.Paragraph>{major.description}</Typography.Paragraph>
        <Divider />
        <Typography.Title level={5}>核心课程</Typography.Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {major.coreCourses.map(c => <Tag key={c} color="blue">{c}</Tag>)}
        </div>
      </Card>

      <Card title="就业前景" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="就业行业">{major.employmentProspects.industries.join('、')}</Descriptions.Item>
          <Descriptions.Item label="薪资水平">{major.employmentProspects.averageSalary}</Descriptions.Item>
          <Descriptions.Item label="需求趋势">{major.employmentProspects.demandTrend}</Descriptions.Item>
        </Descriptions>
        <Typography.Paragraph style={{ marginTop: 12 }}>{major.employmentProspects.summary}</Typography.Paragraph>
      </Card>

      <Card title="适合人群" style={{ marginBottom: 16 }}>
        <Descriptions bordered size="small">
          <Descriptions.Item label="适合类型">{major.suitableFor.interests.join('、')}</Descriptions.Item>
          <Descriptions.Item label="所需能力">{major.suitableFor.skills.join('、')}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={`开设院校 (${offeringColleges.length})`} style={{ marginBottom: 16 }}>
        <Table
          dataSource={offeringColleges}
          rowKey="id"
          size="small"
          columns={[
            { title: '院校名称', dataIndex: 'name', key: 'name', render: (text, r) => <a onClick={() => { addHistory({ id: r.id, type: 'college', name: r.name }); navigate(`/colleges/${r.id}`); }}>{text}</a> },
            { title: '所在地', dataIndex: 'city', key: 'city', width: 100 },
            { title: '层次', dataIndex: 'level', key: 'level', width: 80, render: v => <Tag color={v === '985' ? 'magenta' : v === '211' ? 'blue' : 'default'}>{v}</Tag> },
            { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
          ]}
        />
      </Card>
    </div>
  );
}
