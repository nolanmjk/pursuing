import { useState, useCallback } from 'react';
import { Card, Form, Select, Button, Row, Col, Typography, Alert, Tag, Statistic, Progress } from 'antd';
import { useAppContext } from '../../context/AppContext';
import { analyzeForm } from '../../utils/formBalance';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import admissionData from '../../data/admission_scores.json';
import provincesData from '../../data/provinces.json';

export default function SimulatedFormPage() {
  const { selectedProvince, userRank, userSubject } = useAppContext();
  const province = provincesData.find(p => p.name === selectedProvince);
  const batch = province?.batches[0];
  const [choices, setChoices] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  const availableAdmissions = admissionData.filter(a => {
    const match = a.province === selectedProvince && a.subjectCategory === userSubject && a.batch === batch?.name;
    return match;
  });

  const collegeIds = [...new Set(availableAdmissions.map(a => a.collegeId))];
  const availableColleges = collegesData.filter(c => collegeIds.includes(c.id));

  const majorIds = [...new Set(availableAdmissions.map(a => a.majorId))];
  const availableMajors = majorsData.filter(m => majorIds.includes(m.id));

  const addChoice = useCallback(() => {
    setChoices(prev => [...prev, { collegeId: null, majorId: null }]);
  }, []);

  const updateChoice = useCallback((index, field, value) => {
    setChoices(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const handleAnalyze = () => {
    if (!userRank) return;
    const validChoices = choices.filter(c => c.collegeId && c.majorId).map(c => {
      const admission = availableAdmissions.find(a => a.collegeId === c.collegeId && a.majorId === c.majorId);
      return admission || { collegeId: c.collegeId, majorId: c.majorId, minRank: 999999, minScore: 0 };
    });
    setAnalysis(analyzeForm(validChoices, userRank));
  };

  return (
    <div>
      <Typography.Title level={4}>志愿模拟填报</Typography.Title>
      <Card style={{ marginBottom: 16 }}>
        <Typography.Text>{province?.description}</Typography.Text>
        <div style={{ marginTop: 8 }}>
          <Tag color="blue">{batch?.name} | {batch?.parallelChoices}个平行志愿 | 每志愿{batch?.majorsPerChoice}个专业</Tag>
        </div>
      </Card>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Button type="primary" onClick={addChoice} disabled={choices.length >= batch?.parallelChoices}>
          添加志愿 ({choices.length}/{batch?.parallelChoices})
        </Button>
        <Button onClick={handleAnalyze} disabled={choices.length === 0 || !userRank}>分析志愿表</Button>
        <Button danger onClick={() => { setChoices([]); setAnalysis(null); }}>清空重填</Button>
      </div>

      {choices.map((choice, index) => (
        <Card key={index} size="small" style={{ marginBottom: 8 }} title={
          <span style={{ fontSize: 14 }}>志愿 #{index + 1}</span>
        }>
          <Row gutter={12}>
            <Col span={11}>
              <Select
                showSearch
                value={choice.collegeId}
                onChange={v => updateChoice(index, 'collegeId', v)}
                placeholder="选择院校"
                style={{ width: '100%' }}
                filterOption={(input, option) => option.label.includes(input)}
                options={availableColleges.map(c => ({ value: c.id, label: `${c.name} (${c.level})` }))}
              />
            </Col>
            <Col span={11}>
              <Select
                showSearch
                value={choice.majorId}
                onChange={v => updateChoice(index, 'majorId', v)}
                placeholder="选择专业"
                style={{ width: '100%' }}
                filterOption={(input, option) => option.label.includes(input)}
                options={availableMajors.map(m => ({ value: m.id, label: `${m.name} (${m.category})` }))}
              />
            </Col>
            <Col span={2}>
              <Button danger size="small" onClick={() => setChoices(prev => prev.filter((_, i) => i !== index))}>删除</Button>
            </Col>
          </Row>
        </Card>
      ))}

      {analysis && (
        <Card title="志愿表分析" style={{ marginTop: 24 }}>
          {analysis.warnings.map((w, i) => (
            <Alert key={i} message={w} type={w.includes('合理') ? 'success' : 'warning'} showIcon style={{ marginBottom: 8 }} />
          ))}
          <Row gutter={24} style={{ marginTop: 16 }}>
            <Col span={8}><Card><Statistic title="冲刺" value={analysis.counts['冲刺']} valueStyle={{ color: '#ff4d4f' }} suffix={`个`} /></Card></Col>
            <Col span={8}><Card><Statistic title="稳妥" value={analysis.counts['稳妥']} valueStyle={{ color: '#fa8c16' }} suffix={`个`} /></Card></Col>
            <Col span={8}><Card><Statistic title="保底" value={analysis.counts['保底']} valueStyle={{ color: '#52c41a' }} suffix={`个`} /></Card></Col>
          </Row>
          <div style={{ marginTop: 16 }}>
            <Progress percent={Math.round((analysis.counts['稳妥'] + analysis.counts['保底']) / analysis.choices.length * 100)} />
          </div>
          <div style={{ marginTop: 16 }}>
            {analysis.choices.map(c => {
              const college = collegesData.find(col => col.id === c.collegeId);
              const major = majorsData.find(m => m.id === c.majorId);
              return (
                <Tag key={c.index} color={c.color}>{c.index}. {college?.name} - {major?.name} [{c.level}]</Tag>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
