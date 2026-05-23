import { useState } from 'react';
import { Card, Button, Radio, Typography, Progress, Result, Row, Col, Tag, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import assessmentData from '../../data/assessment.json';
import majorsData from '../../data/majors.json';
import { FadeInView } from '../../components/AnimatedPresence';
import { motion, AnimatePresence } from 'framer-motion';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const goNext = () => {
    if (currentIndex < assessmentData.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setFinished(true);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  if (finished) {
    const scores = {};
    Object.entries(answers).forEach(([questionId, value]) => {
      const question = assessmentData.questions.find(q => q.id === questionId);
      if (question) {
        scores[question.dimension] = (scores[question.dimension] || 0) + value;
      }
    });

    const sortedDimensions = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topDimensions = sortedDimensions.slice(0, 3);
    const maxScore = sortedDimensions[0]?.[1] || 1;

    const recommendedMajorIds = topDimensions.flatMap(([dim]) =>
      assessmentData.dimensions[dim]?.suitableMajors || []
    );
    const recommendedMajors = [...new Set(recommendedMajorIds)]
      .map(id => majorsData.find(m => m.id === id))
      .filter(Boolean)
      .slice(0, 12);

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Result status="success" title="测评完成！" subTitle="以下是你的霍兰德职业兴趣测评结果" />
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="你的兴趣类型">
              {sortedDimensions.map(([dim, score]) => {
                const dimInfo = assessmentData.dimensions[dim];
                const percent = Math.round((score / (5 * 5)) * 100);
                return (
                  <div key={dim} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography.Text strong>{dimInfo.name}</Typography.Text>
                      <Typography.Text>{percent}%</Typography.Text>
                    </div>
                    <Progress percent={percent} strokeColor={percent > 60 ? '#52c41a' : percent > 40 ? '#fa8c16' : '#1677ff'} />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{dimInfo.description}</Typography.Text>
                  </div>
                );
              })}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="推荐专业方向">
              <Space wrap>
                {recommendedMajors.map(m => (
                  <Tag key={m.id} color="blue" style={{ cursor: 'pointer', padding: '4px 8px' }} onClick={() => navigate(`/majors/${m.id}`)}>
                    {m.name}
                  </Tag>
                ))}
              </Space>
              <div style={{ marginTop: 16 }}>
                <Button type="primary" onClick={() => navigate('/score-match')}>用推荐专业去匹配院校</Button>
              </div>
            </Card>
          </Col>
        </Row>
      </motion.div>
    );
  }

  const currentQ = assessmentData.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = assessmentData.questions.length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <motion.div style={{ maxWidth: 600, margin: '0 auto' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <Typography.Title level={4}>兴趣测评</Typography.Title>
      <div style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">进度：{answeredCount}/{totalQuestions} 题</Typography.Text>
        <Progress percent={progress} size="small" />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
        >
          <Card title={`第 ${currentIndex + 1} 题`}>
            <Typography.Title level={5}>{currentQ.text}</Typography.Title>
            <Radio.Group
              style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}
              value={answers[currentQ.id]}
              onChange={e => handleAnswer(currentQ.id, e.target.value)}
            >
              {assessmentData.options.map(opt => (
                <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
              ))}
            </Radio.Group>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
              <Button onClick={goPrev} disabled={currentIndex === 0}>上一题</Button>
              <Button type="primary" onClick={goNext} disabled={!answers[currentQ.id]}>
                {currentIndex === totalQuestions - 1 ? '完成测评' : '下一题'}
              </Button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
