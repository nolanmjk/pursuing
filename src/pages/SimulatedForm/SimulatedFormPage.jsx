import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Card, Form, Select, Button, Row, Col, Typography, Alert, Tag, Statistic,
  Progress, Table, Collapse, Empty, Badge, Divider, Space, message, Segmented,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, ThunderboltOutlined, BarChartOutlined,
  SettingOutlined, ClearOutlined, TrophyOutlined, RiseOutlined, FallOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { useAppContext } from '../../context/AppContext';
import { analyzeForm } from '../../utils/formBalance';
import { diagnoseForm } from '../../utils/diagnoseForm';
import { matchColleges, classifyChoice } from '../../utils/matchAlgorithm';
import { getAvailableYears } from '../../utils/rankConverter';
import { isMajorCompatible } from '../../utils/subjectFilter';
import { FadeInView, CountUp } from '../../components/AnimatedPresence';
import MonteCarloPanel from '../../components/MonteCarloPanel';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import admissionData from '../../data/admission_scores.json';
import provincesData from '../../data/provinces.json';
import cutoffData from '../../data/cutoff_lines.json';

const levelColorMap = { '冲刺': '#ff4d4f', '稳妥': '#fa8c16', '保底': '#52c41a', '差距较大': '#999' };
const probColorMap = { '很高': 'green', '较高': 'blue', '中等': 'orange', '较低': 'red', '很低': 'default' };
const CURRENT_YEAR = getAvailableYears()[0] || 2025;

export default function SimulatedFormPage() {
  const { userRank, userScore, userSubject } = useAppContext();
  const province = provincesData.find(p => p.name === '甘肃');
  const [batchIndex, setBatchIndex] = useState(0);
  const [strategyType, setStrategyType] = useState('moderate');
  const [regionFilter, setRegionFilter] = useState('省内');
  const [choices, setChoices] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);

  // AI import detection
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gaokao_ai_form');
      if (saved && choices.length === 0) {
        const data = JSON.parse(saved);
        if (data.choices?.length > 0) {
          const imported = data.choices.map(c => ({
            collegeId: c.collegeId,
            majorId: c.majorId,
            minRank: c.minRank,
            minScore: c.minScore,
            groupCode: c._groupCode,
            groupName: c._groupName,
            subjectCategory: c.subjectCategory,
            zone: c.zone,
          }));
          setChoices(imported);
          localStorage.removeItem('gaokao_ai_form');

          // Show detailed import summary
          const zones = {};
          imported.forEach(c => { if (c.zone) zones[c.zone] = (zones[c.zone] || 0) + 1; });
          const parts = [];
          if (zones['冲刺']) parts.push(`冲刺${zones['冲刺']}个`);
          if (zones['稳妥']) parts.push(`稳妥${zones['稳妥']}个`);
          if (zones['保底']) parts.push(`保底${zones['保底']}个`);
          message.success(`已导入${imported.length}个AI志愿（${parts.join('、')}），点击「分析志愿表」查看评估`);
        }
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const batch = useMemo(() => province?.batches?.[batchIndex], [province, batchIndex]);

  // Find cutoff line for current batch + year + subject
  const batchCutoff = useMemo(() => {
    const yearData = cutoffData.find(d => d.year === CURRENT_YEAR);
    if (!yearData) return null;
    return yearData.batches.find(
      b => b.name === batch?.name && b.subject === userSubject
    );
  }, [batch, userSubject]);

  // Check if user's score is below batch cutoff
  const scoreBelowCutoff = useMemo(() => {
    if (userScore == null || !batchCutoff) return false;
    return userScore < batchCutoff.score;
  }, [userScore, batchCutoff]);

  // Filter admissions for region + subject + batch
  const filteredAdmissions = useMemo(() => {
    if (!batch) return [];
    const collegeMap = {};
    collegesData.forEach(c => { collegeMap[c.id] = c; });
    return admissionData.filter(a => {
      const college = collegeMap[a.collegeId];
      if (!college) return false;
      if (regionFilter === '省内' && college.province !== '甘肃') return false;
      if (regionFilter === '省外' && college.province === '甘肃') return false;
      // Match batch variants: 本科批 matches 本科批(C段) etc.
      if (a.batch !== batch.name &&
          !a.batch?.startsWith(batch.name) &&
          !batch.name?.startsWith(a.batch)) return false;
      if (!isMajorCompatible(a.majorId, userSubject)) return false;
      if (a.subjectCategory === userSubject) return true;
      if (userSubject === '物理类' && a.subjectCategory === '理科') return true;
      if (userSubject === '历史类' && a.subjectCategory === '文科') return true;
      return false;
    });
  }, [regionFilter, userSubject, batch]);

  // Smart recommendations from matching algorithm
  const recommendations = useMemo(() => {
    if (userRank == null || filteredAdmissions.length === 0) return null;
    return matchColleges(userRank, filteredAdmissions, strategyType);
  }, [userRank, filteredAdmissions, strategyType]);

  // Get college/major names for display
  const collegeMap = useMemo(() => {
    const m = {};
    collegesData.forEach(c => { m[c.id] = c; });
    return m;
  }, []);
  const majorMap = useMemo(() => {
    const m = {};
    majorsData.forEach(maj => { m[maj.id] = maj; });
    return m;
  }, []);

  // All colleges/majors available for search — no pre-filtering
  // User searches by typing, no need to show all at once
  const availableColleges = useMemo(() => collegesData, []);
  const availableMajors = useMemo(() => majorsData, []);

  // ── Actions ──
  const addChoice = useCallback(() => {
    setChoices(prev => [...prev, { collegeId: null, majorId: null }]);
    setAnalysis(null);
  }, []);

  const addRecommendation = useCallback((item) => {
    const exists = choices.find(c => c.collegeId === item.collegeId && c.majorId === item.majorId);
    if (exists) return;
    setChoices(prev => [...prev, { collegeId: item.collegeId, majorId: item.majorId, minRank: item.minRank }]);
    setAnalysis(null);
  }, [choices]);

  const updateChoice = useCallback((index, field, value) => {
    setChoices(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      // Auto-fill minRank when both college and major selected
      if (next[index].collegeId && next[index].majorId) {
        const admission = filteredAdmissions.find(
          a => a.collegeId === next[index].collegeId && a.majorId === next[index].majorId
        );
        if (admission) {
          next[index].minRank = admission.minRank;
          next[index].minScore = admission.minScore;
          next[index].groupCode = admission._groupCode;
          next[index].groupName = admission._groupName;
          next[index].subjectCategory = admission.subjectCategory;
        }
      }
      return next;
    });
    setAnalysis(null);
  }, [filteredAdmissions]);

  const removeChoice = useCallback((index) => {
    setChoices(prev => prev.filter((_, i) => i !== index));
    setAnalysis(null);
  }, []);

  const clearAll = useCallback(() => {
    setChoices([]);
    setAnalysis(null);
  }, []);

  const handleAnalyze = () => {
    if (userRank == null) return;
    const validChoices = choices.filter(c => c.collegeId && c.majorId).map(c => {
      const admission = filteredAdmissions.find(a => a.collegeId === c.collegeId && a.majorId === c.majorId);
      return admission || { collegeId: c.collegeId, majorId: c.majorId, minRank: null, minScore: null, _noData: true };
    });
    const formAnalysis = analyzeForm(validChoices, userRank);
    const enriched = validChoices.map(c => {
      const admission = filteredAdmissions.find(a => a.collegeId === c.collegeId && a.majorId === c.majorId);
      const zoneMatch = formAnalysis.choices.find(fc => fc.collegeId === c.collegeId && fc.majorId === c.majorId);
      return { ...c, minRank: admission?.minRank || c.minRank, zone: admission ? zoneMatch?.level : c.zone, groupName: admission?._groupName || c.groupName };
    });
    formAnalysis.diagnosis = diagnoseForm(enriched, userRank, userSubject);
    setAnalysis(formAnalysis);
  };

  // Export志愿表 as printable HTML
  const handleExport = () => {
    const validChoices = choices.filter(c => c.collegeId && c.majorId);
    const rows = validChoices.map((c, i) => {
      const college = collegeMap[c.collegeId];
      const major = majorMap[c.majorId];
      const cls = getChoiceClass(c);
      return `
        <tr style="border-bottom:1px solid #ddd">
          <td style="padding:8px 12px;text-align:center">${i + 1}</td>
          <td style="padding:8px 12px">${college?.name || '—'}</td>
          <td style="padding:8px 12px">${major?.name || '—'}</td>
          <td style="padding:8px 12px;color:${cls ? levelColorMap[cls.level] : '#999'}">${cls?.level || '—'}</td>
          <td style="padding:8px 12px">${college?.city || '—'}</td>
          <td style="padding:8px 12px">${c.minRank?.toLocaleString() || '—'}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>甘肃高考志愿填报表</title>
    <style>body{font-family:'Microsoft YaHei',sans-serif;padding:30px;color:#222;max-width:800px;margin:0 auto}
    h2{text-align:center;margin-bottom:6px}h2 em{font-size:14px;color:#666;font-style:normal}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#1a1a2e;color:#fff;padding:10px 12px;font-size:13px;text-align:left}
    .info{margin-top:16px;color:#666;font-size:13px}
    @media print{body{padding:10px}}</style></head><body>
    <h2>甘肃省高考志愿填报表 <em>— Pursuing 高考志愿助手生成</em></h2>
    <div class="info">
      <span>省份：甘肃</span> &nbsp;|&nbsp;
      <span>批次：${batch?.name || '—'}</span> &nbsp;|&nbsp;
      <span>科类：${userSubject}</span> &nbsp;|&nbsp;
      <span>位次：${userRank?.toLocaleString() || '—'}名</span> &nbsp;|&nbsp;
      <span>志愿数：${validChoices.length}/${maxChoices}</span>
    </div>
    <table>
      <thead><tr>
        <th>序号</th><th>院校</th><th>专业</th><th>梯度</th><th>城市</th><th>最低位次</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="info" style="margin-top:24px">
      提示：本表由 Pursuing 高考志愿助手自动生成，仅供参考。正式填报请登录甘肃省教育考试院网站。
    </div>
    </body></html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      message.warning('弹窗被浏览器拦截，请允许本站弹窗后重试');
      return;
    }
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  // Classify a choice for real-time color coding
  const getChoiceClass = (choice) => {
    if (userRank == null || !choice.minRank) return null;
    return classifyChoice(userRank, choice.minRank);
  };

  // ── Render helpers ──
  const renderRecommendationTable = (data) => {
    const enriched = data.slice(0, 8).map(item => ({
      ...item,
      college: collegeMap[item.collegeId],
      major: majorMap[item.majorId],
      added: choices.some(c => c.collegeId === item.collegeId && c.majorId === item.majorId),
    }));

    return (
      <Table
        dataSource={enriched}
        rowKey="id"
        size="small"
        pagination={false}
        columns={[
          { title: '院校', dataIndex: ['college', 'name'], width: 130, ellipsis: true },
          { title: '专业', dataIndex: ['major', 'name'], width: 130, ellipsis: true },
          { title: '最低分', dataIndex: 'minScore', width: 55 },
          { title: '最低位次', dataIndex: 'minRank', width: 75 },
          { title: '概率', dataIndex: 'probability', width: 55,
            render: v => <Tag color={probColorMap[v]} style={{ fontSize: 11 }}>{v}</Tag> },
          { title: '', width: 50,
            render: (_, r) => (
              <Button size="small" type="link" disabled={r.added}
                onClick={() => addRecommendation(r)}
                style={{ padding: 0, fontSize: 12 }}>
                {r.added ? '已添加' : '+ 添加'}
              </Button>
            ),
          },
        ]}
      />
    );
  };

  const choiceBadge = (cls) => {
    if (!cls) return null;
    return (
      <Tag color={cls.color} style={{ fontSize: 11, padding: '0 8px' }}>
        {cls.level}
      </Tag>
    );
  };

  const maxChoices = batch?.parallelChoices || 45;
  const validCount = choices.filter(c => c.collegeId && c.majorId).length;

  return (
    <div>
      <Typography.Title level={4}>
        <SettingOutlined style={{ color: '#faaf32', marginRight: 8 }} />志愿模拟填报
      </Typography.Title>

      {/* ── Province / Batch Info ── */}
      {province && batch ? (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} sm={4}>
              <Statistic title="省份" value="甘肃" valueStyle={{ fontSize: 18, color: '#00194b' }} />
            </Col>
            <Col xs={24} sm={4}>
              <Form.Item label="批次" style={{ margin: 0 }}>
                <Select value={batchIndex} onChange={v => { setBatchIndex(v); clearAll(); }}
                  size="small" style={{ width: 140 }}
                  options={province.batches.map((b, i) => ({ value: i, label: b.name }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={4}>
              <Form.Item label="地区" style={{ margin: 0 }}>
                <Segmented value={regionFilter} onChange={v => { setRegionFilter(v); clearAll(); }} size="small"
                  options={[{ value: '省内', label: '省内' }, { value: '省外', label: '省外' }, { value: '不限', label: '不限' }]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={4}>
              <Statistic title="科类" value={userSubject} valueStyle={{ fontSize: 14 }} />
            </Col>
            <Col xs={24} sm={4}>
              <Statistic title="你的位次" value={userRank ?? '未设置'} suffix="名" valueStyle={{ fontSize: 14, color: userRank ? '#327de1' : '#999' }} />
            </Col>
            <Col xs={24} sm={4}>
              <Tag color="blue" style={{ fontSize: 12 }}>{batch.parallelChoices}个平行志愿 · 每志愿{batch.majorsPerChoice}个专业</Tag>
              {batchCutoff && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {CURRENT_YEAR}年{batchCutoff.name}线：<strong style={{ color: '#327de1' }}>{batchCutoff.score}分</strong>
                </div>
              )}
            </Col>
          </Row>
          {scoreBelowCutoff && (
            <Alert
              type="error"
              showIcon
              style={{ marginTop: 12 }}
              message={`你的分数 (${userScore}分) 未达到${CURRENT_YEAR}年${batchCutoff?.name}线 (${batchCutoff?.score}分)，无法投档该批次`}
            />
          )}
        </Card>
      ) : (
        <Alert message="请先在首页设置省份和位次信息" type="info" showIcon style={{ marginBottom: 16 }} />
      )}

      {/* ── Smart Recommendations ── */}
      {userRank != null && recommendations && (
        <Collapse
          style={{ marginBottom: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          items={[{
            key: 'recs',
            label: (
              <span>
                <ThunderboltOutlined style={{ color: '#faaf32', marginRight: 8 }} />
                智能推荐 — 基于你的位次 ({userRank}名) 自动匹配
              </span>
            ),
            extra: (
              <Select value={strategyType} onChange={setStrategyType} size="small" style={{ width: 100 }}
                onClick={e => e.stopPropagation()}
                options={[
                  { value: 'moderate', label: '稳健型' },
                  { value: 'aggressive', label: '进取型' },
                  { value: 'conservative', label: '保守型' },
                ]} />
            ),
            children: (
              <div>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Card size="small" title={<span style={{ color: '#ff4d4f' }}>冲刺 ({recommendations.reach.length})</span>}
                      style={{ borderRadius: 10, borderLeft: '3px solid #ff4d4f', background: 'rgba(255,255,255,0.015)' }}
                      styles={{ body: { padding: '8px 12px' } }}>
                      {recommendations.reach.length > 0 ? renderRecommendationTable(recommendations.reach)
                        : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可推荐的冲刺选项" />}
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" title={<span style={{ color: '#fa8c16' }}>稳妥 ({recommendations.match.length})</span>}
                      style={{ borderRadius: 10, borderLeft: '3px solid #fa8c16', background: 'rgba(255,255,255,0.015)' }}
                      styles={{ body: { padding: '8px 12px' } }}>
                      {recommendations.match.length > 0 ? renderRecommendationTable(recommendations.match)
                        : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可推荐的稳妥选项" />}
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" title={<span style={{ color: '#52c41a' }}>保底 ({recommendations.safety.length})</span>}
                      style={{ borderRadius: 10, borderLeft: '3px solid #52c41a', background: 'rgba(255,255,255,0.015)' }}
                      styles={{ body: { padding: '8px 12px' } }}>
                      {recommendations.safety.length > 0 ? renderRecommendationTable(recommendations.safety)
                        : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可推荐的保底选项" />}
                    </Card>
                  </Col>
                </Row>
              </div>
            ),
          }]} />
      )}

      {/* ── Action Bar ── */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={addChoice} disabled={choices.length >= maxChoices}>
          手动添加志愿 ({validCount}/{maxChoices})
        </Button>
        <Button onClick={handleAnalyze} icon={<BarChartOutlined />} disabled={validCount === 0 || userRank == null}>
          分析志愿表
        </Button>
        <Button
          icon={<ThunderboltOutlined />}
          onClick={() => setShowMonteCarlo(true)}
          disabled={validCount === 0 || userRank == null}
          style={{ borderColor: '#faaf32', color: '#faaf32' }}
        >
          AI 压力测试
        </Button>
        {(userRank == null || validCount === 0) && (
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {userRank == null ? '请先在「位次换算」或「分数匹配」中设置你的位次 ' : ''}
            {userRank == null && validCount === 0 ? '| ' : ''}
            {validCount === 0 ? '请先添加至少1个志愿' : ''}
          </Typography.Text>
        )}
        <Button danger icon={<ClearOutlined />} onClick={clearAll} disabled={choices.length === 0}>
          清空重填
        </Button>
        <Button icon={<PrinterOutlined />} onClick={handleExport} disabled={validCount === 0}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', color: '#aab' }}>
          导出打印
        </Button>
        <span style={{ color: '#556', fontSize: 12, marginLeft: 'auto' }}>
          已选 {choices.length} 个，已填完整 {validCount} 个
        </span>
      </div>

      {/* ── Choice Cards ── */}
      {choices.length === 0 ? (
        <Empty description="还没有添加志愿，从上方智能推荐点击添加，或点「手动添加志愿」开始"
          style={{ padding: 40, background: 'rgba(255,255,255,0.015)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)' }} />
      ) : (
        <Row gutter={[12, 12]}>
          {choices.map((choice, index) => {
            const cls = getChoiceClass(choice);
            const borderColor = cls ? levelColorMap[cls.level] : 'rgba(255,255,255,0.1)';
            const college = choice.collegeId ? collegeMap[choice.collegeId] : null;
            const major = choice.majorId ? majorMap[choice.majorId] : null;

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                <Card size="small" hoverable
                  style={{
                    borderRadius: 10, borderLeft: `4px solid ${borderColor}`,
                    background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)',
                    borderLeftColor: borderColor, height: '100%',
                  }}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Badge count={`#${index + 1}`} style={{ backgroundColor: borderColor, fontSize: 10 }} />
                      {choiceBadge(cls)}
                    </div>
                  }
                  extra={
                    <Button type="text" danger size="small" icon={<DeleteOutlined />}
                      onClick={() => removeChoice(index)} />
                  }
                >
                  <Select
                    showSearch
                    value={choice.collegeId}
                    onChange={v => updateChoice(index, 'collegeId', v)}
                    placeholder="选择院校"
                    style={{ width: '100%', marginBottom: 8 }}
                    size="small"
                    filterOption={(input, option) => (option?.label || '').includes(input)}
                    options={availableColleges.map(c => ({ value: c.id, label: `${c.name} (${c.level})` }))}
                  />
                  <Select
                    showSearch
                    value={choice.majorId}
                    onChange={v => updateChoice(index, 'majorId', v)}
                    placeholder="选择专业"
                    style={{ width: '100%', marginBottom: 8 }}
                    size="small"
                    filterOption={(input, option) => (option?.label || '').includes(input)}
                    options={availableMajors.map(m => ({ value: m.id, label: `${m.name} (${m.category})` }))}
                  />

                  {college && major && (
                    <div style={{ fontSize: 12, color: '#667', marginTop: 4, lineHeight: 1.8 }}>
                      <div>{college.name} — {major.name}</div>
                      <div>
                        <span style={{ color: '#556' }}>{college.city} · {college.level} · {college.type}</span>
                      </div>
                      {choice.groupCode && (
                        <div>
                          专业组：<Tag style={{ fontSize: 10, padding: '0 4px' }}>{choice.groupCode}{choice.groupName ? ` ${choice.groupName}` : ''}</Tag>
                        </div>
                      )}
                      {choice.groupName?.includes('普通类') && (() => {
                        const adsMajors = admissionData
                          .filter(a => a.collegeId === choice.collegeId && a._groupCode === choice.groupCode)
                          .map(a => a.majorId);
                        const clgMajors = college?.majors || [];
                        const compatibleMajors = [...new Set([...adsMajors, ...clgMajors])]
                          .filter(mid => isMajorCompatible(mid, userSubject));
                        if (!compatibleMajors.length) return null;
                        return (
                          <details style={{ marginTop: 4, fontSize: 11 }}>
                            <summary style={{ color: '#327de1', cursor: 'pointer', userSelect: 'none' }}>
                              查看涵盖专业方向 ({compatibleMajors.length}个)
                            </summary>
                            <div style={{ marginTop: 4, maxHeight: 100, overflowY: 'auto' }}>
                              {compatibleMajors.map(mid => (
                                <Tag key={mid} color="blue" style={{ fontSize: 10, marginBottom: 2 }}>
                                  {majorMap[mid]?.name || mid}
                                </Tag>
                              ))}
                            </div>
                          </details>
                        );
                      })()}
                      {choice.minRank && (
                        <div>
                          最低位次：<strong style={{ color: '#333' }}>{choice.minRank.toLocaleString()}</strong>
                          {userRank != null && (
                            <span style={{ marginLeft: 6, color: borderColor }}>
                              ({choice.minRank > userRank ? '低' : '高'}
                              {Math.abs(choice.minRank - userRank).toLocaleString()}名)
                            </span>
                          )}
                        </div>
                      )}
                      {!choice.minRank && choice._noData && (
                        <div style={{ color: '#999', fontSize: 12 }}>暂无该组合的录取数据</div>
                      )}
                      {choice.minScore && (
                        <div>最低分：<strong style={{ color: '#327de1' }}>{choice.minScore}分</strong></div>
                      )}
                      {cls && (
                        <Tag color={cls.color} style={{ marginTop: 4, fontSize: 11 }}>
                          录取概率：{cls.level}
                        </Tag>
                      )}
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* ── Analysis Results ── */}
      {analysis && (
        <Card
          title={<span><BarChartOutlined style={{ color: '#327de1', marginRight: 8 }} />志愿表分析报告</span>}
          style={{ marginTop: 24, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Warnings */}
          {analysis.warnings.map((w, i) => (
            <Alert key={i} message={w} type={w.includes('合理') ? 'success' : (w.includes('极大') ? 'error' : 'warning')}
              showIcon style={{ marginBottom: 8 }} />
          ))}

          {/* Stats Row */}
          <Row gutter={[16, 16]} style={{ marginTop: 16, marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <FadeInView delay={0}>
                <div style={{ borderRadius: 10, padding: '16px 20px', background: 'rgba(255,77,79,0.08)', border: '1px solid rgba(255,77,79,0.2)' }}>
                  <Statistic title="冲刺" value={analysis.counts['冲刺']}
                    formatter={v => <CountUp value={v} suffix={` / ${analysis.choices.length} 个`} style={{ color: '#ff4d4f', fontSize: 28, fontWeight: 700 }} />} />
                  <Progress percent={Math.round(analysis.counts['冲刺'] / analysis.choices.length * 100)}
                    strokeColor="#ff4d4f" size="small" showInfo={false} />
                </div>
              </FadeInView>
            </Col>
            <Col xs={24} sm={8}>
              <FadeInView delay={0.1}>
                <div style={{ borderRadius: 10, padding: '16px 20px', background: 'rgba(250,175,50,0.08)', border: '1px solid rgba(250,175,50,0.2)' }}>
                  <Statistic title="稳妥" value={analysis.counts['稳妥']}
                    formatter={v => <CountUp value={v} suffix={` / ${analysis.choices.length} 个`} style={{ color: '#fa8c16', fontSize: 28, fontWeight: 700 }} />} />
                  <Progress percent={Math.round(analysis.counts['稳妥'] / analysis.choices.length * 100)}
                    strokeColor="#fa8c16" size="small" showInfo={false} />
                </div>
              </FadeInView>
            </Col>
            <Col xs={24} sm={8}>
              <FadeInView delay={0.2}>
                <div style={{ borderRadius: 10, padding: '16px 20px', background: 'rgba(82,196,26,0.08)', border: '1px solid rgba(82,196,26,0.2)' }}>
                  <Statistic title="保底" value={analysis.counts['保底']}
                    formatter={v => <CountUp value={v} suffix={` / ${analysis.choices.length} 个`} style={{ color: '#52c41a', fontSize: 28, fontWeight: 700 }} />} />
                  <Progress percent={Math.round(analysis.counts['保底'] / analysis.choices.length * 100)}
                    strokeColor="#52c41a" size="small" showInfo={false} />
                </div>
              </FadeInView>
            </Col>
          </Row>

          {/* Overall balance bar */}
          <div style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>冲/稳/保 比例</Typography.Text>
            <Progress
              percent={Math.round((analysis.counts['稳妥'] + analysis.counts['保底']) / Math.max(analysis.choices.length, 1) * 100)}
              format={() => `${analysis.counts['稳妥'] + analysis.counts['保底']}/${analysis.choices.length} 稳妥+保底`}
            />
          </div>

          {/* Detailed list */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {analysis.choices.map(c => {
              const college = collegeMap[c.collegeId];
              const major = majorMap[c.majorId];
              return (
                <Tag key={c.index} color={c.color} style={{ fontSize: 12, padding: '4px 10px', margin: 0 }}>
                  {c.index}. {college?.name || '?'} — {major?.name || '?'}
                  <span style={{ marginLeft: 4, opacity: 0.8 }}>[{c.level}]</span>
                </Tag>
              );
            })}
          </div>

          {/* ── Diagnosis Section ── */}
          {analysis.diagnosis && (
            <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
              <Typography.Title level={5} style={{ marginBottom: 12 }}>
                志愿表体检得分：
                <span style={{
                  color: analysis.diagnosis.score >= 80 ? '#52c41a' :
                    analysis.diagnosis.score >= 60 ? '#fa8c16' : '#ff4d4f',
                  fontSize: 28, fontWeight: 700, marginLeft: 8,
                }}>
                  {analysis.diagnosis.score}分
                </span>
              </Typography.Title>

              {analysis.diagnosis.findings.length === 0 ? (
                <Alert type="success" showIcon message="未发现明显问题，志愿表结构合理！" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {analysis.diagnosis.findings.map((f, i) => (
                    <Alert
                      key={i}
                      type={f.severity === 'error' ? 'error' : f.severity === 'warning' ? 'warning' : 'info'}
                      showIcon
                      message={<Typography.Text strong>{f.title}</Typography.Text>}
                      description={
                        <div>
                          <Typography.Text style={{ fontSize: 13 }}>{f.detail}</Typography.Text>
                          {f.fix && (
                            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                              建议：{f.fix}
                            </Typography.Text>
                          )}
                        </div>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      <MonteCarloPanel
        choices={choices.filter(c => c.collegeId && c.majorId).map((c, i) => ({
          index: i + 1,
          minRank: c.minRank || 0,
          collegeId: c.collegeId,
          majorId: c.majorId,
        }))}
        userRank={userRank}
        visible={showMonteCarlo}
        onClose={() => setShowMonteCarlo(false)}
      />
    </div>
  );
}
