import { useState, useMemo } from 'react';
import { Card, Form, InputNumber, Select, Button, Tabs, Table, Tag, Typography, Empty } from 'antd';
import { useAppContext } from '../../context/AppContext';
import { matchColleges } from '../../utils/matchAlgorithm';
import admissionData from '../../data/admission_scores.json';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import { useNavigate } from 'react-router-dom';

export default function ScoreMatchPage() {
  const { selectedProvince, userScore, setUserScore, userRank, setUserRank, userSubject, setUserSubject } = useAppContext();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);

  const filteredData = useMemo(() => {
    return admissionData.filter(a => a.province === selectedProvince && a.subjectCategory === userSubject);
  }, [selectedProvince, userSubject]);

  const handleMatch = () => {
    if (!userRank) return;
    const matched = matchColleges(userRank, filteredData);
    setResults(matched);
  };

  const renderTable = (data) => {
    const enriched = data.map(item => {
      const college = collegesData.find(c => c.id === item.collegeId);
      const major = majorsData.find(m => m.id === item.majorId);
      return { ...item, college, major };
    });

    const columns = [
      { title: '院校', dataIndex: ['college', 'name'], key: 'college', render: (text, r) => (
        <a onClick={() => navigate(`/colleges/${r.collegeId}`)}>{r.college?.name}</a>
      )},
      { title: '专业', dataIndex: ['major', 'name'], key: 'major', render: (text, r) => (
        <a onClick={() => navigate(`/majors/${r.majorId}`)}>{r.major?.name}</a>
      )},
      { title: '最低分', dataIndex: 'minScore', key: 'minScore', width: 80 },
      { title: '最低位次', dataIndex: 'minRank', key: 'minRank', width: 100 },
      { title: '年份', dataIndex: 'year', key: 'year', width: 60 },
      { title: '录取概率', dataIndex: 'probability', key: 'probability', width: 80, render: v => <Tag color={v === '很高' ? 'green' : v === '较高' ? 'blue' : v === '中等' ? 'orange' : 'red'}>{v}</Tag> },
    ];

    return <Table dataSource={enriched} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} size="small" />;
  };

  return (
    <div>
      <Typography.Title level={4}>分数匹配学校</Typography.Title>
      <Card style={{ marginBottom: 24 }}>
        <Form layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
          <Form.Item label="选科类别">
            <Select value={userSubject} onChange={setUserSubject} style={{ width: 120 }} options={[{ value: '物理类', label: '物理类' }, { value: '历史类', label: '历史类' }]} />
          </Form.Item>
          <Form.Item label="你的分数">
            <InputNumber value={userScore} onChange={setUserScore} min={0} max={750} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="你的位次">
            <InputNumber value={userRank} onChange={setUserRank} min={1} style={{ width: 140 }} placeholder="输入位次更准确" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleMatch} disabled={!userRank}>开始匹配</Button>
          </Form.Item>
        </Form>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          提示：位次匹配比分數匹配更准确。位次信息可在高考成绩单上查看。
        </Typography.Text>
      </Card>

      {results && (
        <Tabs items={[
          { key: 'reach', label: <span style={{ color: '#ff4d4f' }}>冲刺 ({results.reach.length})</span>, children: results.reach.length > 0 ? renderTable(results.reach) : <Empty description="没有匹配的冲刺院校" /> },
          { key: 'match', label: <span style={{ color: '#fa8c16' }}>稳妥 ({results.match.length})</span>, children: results.match.length > 0 ? renderTable(results.match) : <Empty description="没有匹配的稳妥院校" /> },
          { key: 'safety', label: <span style={{ color: '#52c41a' }}>保底 ({results.safety.length})</span>, children: results.safety.length > 0 ? renderTable(results.safety) : <Empty description="没有匹配的保底院校" /> },
        ]} />
      )}
    </div>
  );
}
