import { useState, useMemo, useCallback } from 'react';
import { Card, Input, Button, Typography, Table, Tag, Statistic, Row, Col, Alert, Divider, Space, message } from 'antd';
import { ThunderboltOutlined, SendOutlined, RocketOutlined, ImportOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { FadeInView, CountUp } from '../../components/AnimatedPresence';
import { parseSentence } from '../../utils/sentenceParser';
import { scoreToRank } from '../../utils/rankConverter';
import { matchColleges, classifyChoice } from '../../utils/matchAlgorithm';
import { filterByPreferences, allocateVolunteerTable, collegeMap, majorMap } from '../../utils/volunteerAllocator';
import { aiChat } from '../../utils/aiChat';
import { aiRecommend } from '../../utils/aiRecommend';
import { isMajorCompatible } from '../../utils/subjectFilter';
import admissionData from '../../data/admission_scores.json';

const PHASES = {
  idle: { label: '', icon: null },
  parsing: { label: '正在理解你的需求...', icon: '🔍' },
  pooling: { label: '正在筛选候选院校...', icon: '📊' },
  recommending: { label: '小楷正在帮你挑选最合适的志愿...', icon: '🤖' },
};

const PLACEHOLDER_EXAMPLES = [
  '580分物理类，想学计算机，去成都西安，保底留甘肃',
  '历史类520分想去北京上海的师范类院校',
  '位次8000名物理类，冲985，电子通信方向',
];

export default function AiFillPage() {
  const navigate = useNavigate();
  const ctx = useAppContext();
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('idle');
  const [parsed, setParsed] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiPowered, setAiPowered] = useState(false);
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState(0);

  const filteredAdmissions = useMemo(() => {
    const subject = parsed?.subject || ctx.userSubject || '物理类';
    return admissionData.filter(a =>
      (a.batch === '本科批' || a.batch?.startsWith('本科批(') || a.batch?.startsWith('本科提前批') ||
       a.batch?.startsWith('高职(专科)') || a.batch?.startsWith('专科批')) &&
      (a.subjectCategory === subject ||
        (subject === '物理类' && a.subjectCategory === '理科') ||
        (subject === '历史类' && a.subjectCategory === '文科')) &&
      isMajorCompatible(a.majorId, subject)
    );
  }, [parsed?.subject, ctx.userSubject]);

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) return;

    // Phase 1: Parse
    setPhase('parsing');
    setProgress(15);
    setAiPowered(false);
    await new Promise(r => setTimeout(r, 300));

    const parsedResult = parseSentence(input);
    const score = parsedResult.score || ctx.userScore;
    const subject = parsedResult.subject || ctx.userSubject || '物理类';
    const rank = parsedResult.rank || (score ? scoreToRank(score, 2025, subject) : null);

    if (!score && !rank) {
      message.warning('请告诉我你的分数（如"580分"）或位次（如"位次8000名"）');
      setPhase('idle');
      return;
    }

    setParsed({ ...parsedResult, score, subject });
    setProgress(30);

    // Phase 2: Build candidate pools (algorithm as data provider)
    setPhase('pooling');
    await new Promise(r => setTimeout(r, 200));

    const strategy = parsedResult.keywords?.includes('aggressive') ? 'aggressive' :
                     parsedResult.keywords?.includes('conservative') ? 'conservative' : 'moderate';
    const pools = matchColleges(rank, filteredAdmissions, strategy);

    const isSafetyOnly = parsedResult.keywords?.includes('safety_only_cities');
    const filteredPools = filterByPreferences(pools, {
      cities: parsedResult.cities,
      majors: parsedResult.majors,
    }, isSafetyOnly);
    setProgress(50);

    // Phase 3: AI recommends (primary path)
    setPhase('recommending');

    let table = null;
    let analysis = '';

    const aiResult = await aiRecommend({
      userContext: { score, rank, subject },
      pools: filteredPools,
      preferences: { cities: parsedResult.cities, majors: parsedResult.majors },
      collegeMap,
      majorMap,
    });

    if (aiResult) {
      // AI succeeded — use its picks
      setAiPowered(true);
      const { reachPicks, matchPicks, safetyPicks, analysis: aiAnalysis } = aiResult;
      analysis = aiAnalysis;

      const allocated = [];
      let idx = 1;
      for (const e of reachPicks) allocated.push({ ...e, index: idx++, zone: '冲刺' });
      for (const e of matchPicks) allocated.push({ ...e, index: idx++, zone: '稳妥' });
      for (const e of safetyPicks) allocated.push({ ...e, index: idx++, zone: '保底' });
      table = allocated;
    } else {
      // AI unavailable — fall back to algorithm
      setAiPowered(false);
      table = allocateVolunteerTable(filteredPools, rank);

      const cityStr = parsedResult.cities.length > 0 ? parsedResult.cities.join('、') : '不限';
      const majorStr = parsedResult.majors.length > 0 ? [...new Set(parsedResult.majors)].slice(0, 5).join('、') : '不限';
      const reachCount = table.filter(t => t.zone === '冲刺').length;
      const matchCount = table.filter(t => t.zone === '稳妥').length;
      const safetyCount = table.filter(t => t.zone === '保底').length;

      // Fallback AI analysis (no structured recommendation, just a summary)
      const scoreStr = score ? `${score}分` : `位次${rank.toLocaleString()}名`;
      const subjectNote = subject === '历史类'
        ? ` 重要：用户是历史类考生，只能报考文科专业（文学、法学、经济学、管理学等），绝对不能推荐任何理工医农专业或提及工科优势。`
        : '';
      const prompt = `用户是甘肃${subject}考生，${scoreStr}，全省位次${rank.toLocaleString()}名。偏好城市：${cityStr}，偏好专业：${majorStr}。${subjectNote}

系统已自动生成一份${table.length}个志愿的冲稳保志愿表：冲刺${reachCount}个、稳妥${matchCount}个、保底${safetyCount}个。

请用热情、鼓励的语气（像学长学姐一样），简要分析这份志愿表的特点和1-2条关键建议。控制在200字以内，开头祝贺一下。`;

      const reply = await aiChat([{ role: 'user', content: prompt }]);
      analysis = reply || `你的${score}分（位次${rank.toLocaleString()}名）志愿表已生成！共${table.length}个志愿：冲刺${reachCount}个、稳妥${matchCount}个、保底${safetyCount}个。建议重点审视冲刺志愿的前5个，那是你"够一够"最可能够到的好学校。保底志愿确保至少10个以上，防止滑档。`;
    }

    setProgress(90);
    setTableData(table);

    const reachCount = table.filter(t => t.zone === '冲刺').length;
    const matchCount = table.filter(t => t.zone === '稳妥').length;
    const safetyCount = table.filter(t => t.zone === '保底').length;
    setStats({ total: table.length, reachCount, matchCount, safetyCount, rank, score, subject });
    setAiExplanation(analysis);
    setProgress(100);
    setPhase('done');
  }, [input, ctx.userScore, ctx.userSubject, filteredAdmissions]);

  const handleImport = () => {
    if (!tableData || !stats) return;
    localStorage.setItem('gaokao_ai_form', JSON.stringify({
      timestamp: Date.now(),
      choices: tableData,
      userRank: stats.rank,
      userScore: stats.score,
      userSubject: stats.subject,
    }));
    message.success('志愿表已保存！正在跳转到模拟填报...');
    navigate('/simulate');
  };

  const columns = [
    { title: '序号', dataIndex: 'index', width: 56, align: 'center' },
    {
      title: '梯度', dataIndex: 'zone', width: 70, align: 'center',
      render: (zone) => {
        const colors = { '冲刺': 'red', '稳妥': 'orange', '保底': 'green' };
        return <Tag color={colors[zone]} style={{ margin: 0 }}>{zone}</Tag>;
      },
    },
    {
      title: '院校', dataIndex: 'collegeId', width: 180,
      render: (id) => {
        const c = collegeMap[id];
        const name = c?.name || id;
        const level = c?.level;
        const doubleFirst = c?.isDoubleFirstClass;
        let tag = null;
        if (level === '985') tag = <Tag color="red" style={{ marginLeft: 4, fontSize: 11, lineHeight: '18px' }}>985</Tag>;
        else if (level === '211') tag = <Tag color="orange" style={{ marginLeft: 4, fontSize: 11, lineHeight: '18px' }}>211</Tag>;
        else if (doubleFirst) tag = <Tag color="purple" style={{ marginLeft: 4, fontSize: 11, lineHeight: '18px' }}>双一流</Tag>;
        else if (level === '省重点') tag = <Tag color="green" style={{ marginLeft: 4, fontSize: 11, lineHeight: '18px' }}>省重点</Tag>;
        return <span>{name}{tag}</span>;
      },
    },
    {
      title: '专业', dataIndex: 'majorId', ellipsis: true, width: 150,
      render: (id, record) => {
        const name = majorMap[id]?.name || id;
        // dxsbb "普通类" groups mapped to 经济学 → show as general class
        if (id === 'maj_020101' && (record._groupName || '').includes('普通类')) {
          return <span>普通类<Tag color="default" style={{ marginLeft: 4, fontSize: 10, lineHeight: '16px' }}>含多专业</Tag></span>;
        }
        return name;
      },
    },
    {
      title: '城市', dataIndex: 'collegeId', width: 80, align: 'center',
      render: (id) => collegeMap[id]?.city || '-',
    },
    {
      title: '最低位次', dataIndex: 'minRank', width: 90, align: 'center',
      render: (v) => v?.toLocaleString(),
    },
    {
      title: '最低分', dataIndex: 'minScore', width: 70, align: 'center',
      render: (v) => v || '-',
    },
    {
      title: '专业组', dataIndex: '_groupName', width: 80, align: 'center',
      render: (v) => v || '-',
    },
  ];

  const isDone = phase === 'done';
  const isLoading = phase !== 'idle' && phase !== 'done';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <FadeInView>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Typography.Title level={3}>
            <ThunderboltOutlined style={{ color: '#faaf32', marginRight: 8 }} />
            AI 智能填志愿
          </Typography.Title>
          <Typography.Text type="secondary">
            用一句话描述你的情况，AI 自动生成完整的志愿表
          </Typography.Text>
        </div>
      </FadeInView>

      {/* Input area */}
      <FadeInView delay={0.1}>
        <Card style={{ borderRadius: 12, marginBottom: 20 }}>
          <Input.TextArea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`例如：${PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)]}`}
            autoSize={{ minRows: 2, maxRows: 4 }}
            style={{ fontSize: 16, borderRadius: 8, marginBottom: 12 }}
            disabled={isLoading}
            onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              包含分数（或位次）、科目、城市偏好、专业意向即可
            </Typography.Text>
            <Button
              type="primary"
              size="large"
              icon={isLoading ? <RocketOutlined spin /> : <SendOutlined />}
              onClick={handleGenerate}
              loading={isLoading}
              disabled={!input.trim()}
              style={{ borderRadius: 20, padding: '0 32px', height: 44 }}
            >
              {isLoading ? '生成中...' : '生成志愿表'}
            </Button>
          </div>
        </Card>
      </FadeInView>

      {/* Loading animation */}
      <AnimatePresence>
        {isLoading && (
          <FadeInView key="loading">
            <Card style={{ borderRadius: 12, marginBottom: 20, textAlign: 'center', padding: '40px 0' }}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 72, height: 72, borderRadius: 24, margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, #0a1628 0%, #1a3a5c 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: -8, left: '50%', width: 2, height: 10, background: '#faaf32', transform: 'translateX(-50%)', borderRadius: 1 }} />
                <div style={{ position: 'absolute', top: -12, left: '50%', width: 5, height: 5, background: '#faaf32', transform: 'translateX(-50%)', borderRadius: '50%', boxShadow: '0 0 8px #faaf32' }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ width: 10, height: 10, background: '#faaf32', borderRadius: '50%', boxShadow: '0 0 6px #faaf32' }} />
                  <div style={{ width: 10, height: 10, background: '#faaf32', borderRadius: '50%', boxShadow: '0 0 6px #faaf32' }} />
                </div>
              </motion.div>
              <Typography.Title level={5}>{PHASES[phase]?.label}</Typography.Title>
              <div style={{ width: 280, height: 4, background: '#f0f0f0', borderRadius: 2, margin: '12px auto', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: 'linear-gradient(90deg, #327de1, #faaf32)', borderRadius: 2 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <CountUp value={Math.floor(progress)} suffix="%" style={{ fontSize: 18, color: '#327de1', fontWeight: 600 }} />
              {parsed && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#f6f8fa', borderRadius: 8, textAlign: 'left', display: 'inline-block' }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    已理解：{parsed.subject || '物理类'} · 位次{parsed.rank?.toLocaleString() || stats?.rank?.toLocaleString() || (parsed.score ? parsed.score + '分' : '?')}名
                    {parsed.cities?.length > 0 && <span> · 倾向城市：{parsed.cities.join('、')}</span>}
                    {parsed.majors?.length > 0 && <span> · 意向专业：{parsed.majors.slice(0, 5).join('、')}</span>}
                  </Typography.Text>
                </div>
              )}
            </Card>
          </FadeInView>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {isDone && stats && tableData && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic title="志愿总数" value={stats.total} suffix="个" />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #ff4d4f' }}>
                  <Statistic title="冲刺" value={stats.reachCount} suffix="个" valueStyle={{ color: '#ff4d4f' }} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #faaf32' }}>
                  <Statistic title="稳妥" value={stats.matchCount} suffix="个" valueStyle={{ color: '#faaf32' }} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #52c41a' }}>
                  <Statistic title="保底" value={stats.safetyCount} suffix="个" valueStyle={{ color: '#52c41a' }} />
                </Card>
              </Col>
            </Row>

            {/* Low-data warning */}
            {stats.total < 20 && (parsed?.majors?.length > 0) && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16, borderRadius: 10 }}
                message="数据库覆盖不足"
                description={
                  stats.total === 0
                    ? `数据库中暂无${stats.subject}"${parsed.majors.slice(0,3).join('、')}"的录取记录。建议前往"小楷"助手咨询，或放宽专业/地区限制。`
                    : `"${parsed.majors.slice(0,3).join('、')}"在${stats.subject}本科批仅有 ${stats.total} 条录取记录，且全部为保底层次。这是因为数据库尚未收录更多院校的该专业数据。建议前往"小楷"助手获取更全面的择校建议。`
                }
              />
            )}

            {/* AI Explanation */}
            {aiExplanation && (
              <Card style={{ borderRadius: 12, marginBottom: 20, background: aiPowered ? 'linear-gradient(135deg, #f0f5ff 0%, #fff7e6 100%)' : '#fafafa', border: aiPowered ? '1px solid #faaf32' : '1px solid #e8e8e8' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: aiPowered ? 'linear-gradient(135deg, #0a1628 0%, #1a3a5c 100%)' : '#d9d9d9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  }}>
                    {aiPowered && (
                      <>
                        <div style={{ position: 'absolute', top: -3, left: '50%', width: 1, height: 5, background: '#faaf32', transform: 'translateX(-50%)' }} />
                        <div style={{ display: 'flex', gap: 3 }}>
                          <div style={{ width: 5, height: 5, background: '#faaf32', borderRadius: '50%' }} />
                          <div style={{ width: 5, height: 5, background: '#faaf32', borderRadius: '50%' }} />
                        </div>
                      </>
                    )}
                    {!aiPowered && <span style={{ fontSize: 18 }}>📋</span>}
                  </div>
                  <div>
                    <Typography.Text strong style={{ fontSize: 14 }}>
                      {aiPowered ? '小楷推荐' : '算法分析'}
                    </Typography.Text>
                    {!aiPowered && (
                      <Tag color="default" style={{ marginLeft: 8, fontSize: 11 }}>AI 暂不可用</Tag>
                    )}
                    <Typography.Paragraph style={{ marginTop: 4, marginBottom: 0, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                      {aiExplanation}
                    </Typography.Paragraph>
                  </div>
                </div>
              </Card>
            )}

            {/* Fallback notice */}
            {!aiPowered && isDone && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16, borderRadius: 10 }}
                message="AI 智能推荐暂不可用"
                description="当前展示的是算法自动生成的志愿表。AI 可用时将优先使用小楷的智能推荐，综合考虑院校层次、专业实力和城市发展等因素。"
              />
            )}

            {/* Table */}
            <Card style={{ borderRadius: 12, marginBottom: 20 }}>
              <Table
                columns={columns}
                dataSource={tableData}
                rowKey="index"
                size="small"
                scroll={{ x: 700 }}
                pagination={{ pageSize: 15, showSizeChanger: false, showTotal: (t) => `共 ${t} 个志愿` }}
                expandable={{
                  rowExpandable: (r) => (r._groupName || '').includes('普通类'),
                  expandedRowRender: (r) => {
                    const college = collegeMap[r.collegeId];
                    if (!college?.majors?.length) return null;
                    const subject = parsed?.subject || ctx.userSubject || '物理类';
                    const compatibleMajors = college.majors.filter(mid => isMajorCompatible(mid, subject));
                    if (!compatibleMajors.length) {
                      return (
                        <div style={{ padding: '8px 12px', background: '#f8f9fb', borderRadius: 6 }}>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            该院校在{subject}下暂无适配的专业方向数据
                          </Typography.Text>
                        </div>
                      );
                    }
                    return (
                      <div style={{ padding: '8px 12px', background: '#f8f9fb', borderRadius: 6 }}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          该专业组涵盖以下专业方向（{compatibleMajors.length}个）：
                        </Typography.Text>
                        <div style={{ marginTop: 6 }}>
                          <Space wrap size={[4, 4]}>
                            {compatibleMajors.map(mid => (
                              <Tag key={mid} color="blue" style={{ fontSize: 12 }}>{majorMap[mid]?.name || mid}</Tag>
                            ))}
                          </Space>
                        </div>
                      </div>
                    );
                  },
                }}
              />
            </Card>

            {/* Actions */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <Button
                type="primary"
                size="large"
                icon={<ImportOutlined />}
                onClick={handleImport}
                style={{ borderRadius: 20, padding: '0 40px', height: 48, fontSize: 16 }}
              >
                一键导入模拟填报
              </Button>
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                导入后可进一步调整、分析、压力测试你的志愿表
              </Typography.Text>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
