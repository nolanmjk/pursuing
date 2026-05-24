import { useState, useMemo } from 'react';
import {
  Card, Tabs, Typography, Tag, Table, Row, Col, Space,
  Alert, Collapse, Segmented, Empty, Input,
} from 'antd';
import {
  TrophyOutlined, GlobalOutlined, BankOutlined,
  HomeOutlined, ReadOutlined, RocketOutlined,
  DollarOutlined, StarOutlined,
} from '@ant-design/icons';
import guideData from '../../data/parent_guide_data.json';
import collegesData from '../../data/colleges.json';
import admissionData from '../../data/admission_scores.json';
import { FadeInView } from '../../components/AnimatedPresence';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const { Panel } = Collapse;

const selectionSet = new Set(guideData.selectionTransfer.targetSchools);

export default function ParentGuidePage() {
  const navigate = useNavigate();

  const collegeWithStats = useMemo(() => {
    const map = {};
    admissionData.forEach(a => {
      if (!map[a.collegeId]) map[a.collegeId] = { minScore: Infinity, maxScore: -Infinity, minRank: Infinity, count: 0 };
      map[a.collegeId].minScore = Math.min(map[a.collegeId].minScore, a.minScore);
      map[a.collegeId].maxScore = Math.max(map[a.collegeId].maxScore, a.minScore);
      map[a.collegeId].minRank = Math.min(map[a.collegeId].minRank, a.minRank || Infinity);
      map[a.collegeId].count++;
    });

    return collegesData
      .filter(c => c.level !== '专科' || c.isDoubleFirstClass)
      .map(c => {
        const stats = map[c.id] || {};
        const isSelection = selectionSet.has(c.name);
        const tier = guideData.postgradRates.tiers;
        let postgradTier = null;
        for (const [tKey, tVal] of Object.entries(tier)) {
          if (tVal.schools && tVal.schools.includes(c.name)) {
            postgradTier = tVal.label;
            break;
          }
        }
        // Check employer targets
        const employerTags = [];
        for (const [cat, info] of Object.entries(guideData.targetEmployers.categories)) {
          if (info.schools && info.schools.includes(c.name)) {
            employerTags.push(cat);
          }
        }
        // Back home employment
        const isGansu = c.province === '甘肃';
        const backHomeLevel = guideData.backHomeEmployment.gansuAdvantage.high.includes(c.name) ? '高' :
          isGansu ? '中' : null;

        return {
          ...c,
          minScore: stats.minScore === Infinity ? '-' : stats.minScore,
          minRank: stats.minRank === Infinity ? '-' : stats.minRank?.toLocaleString(),
          recordCount: stats.count,
          isSelection,
          postgradTier,
          employerTags,
          isGansu,
          backHomeLevel,
        };
      })
      .filter(c => c.recordCount > 0);
  }, []);

  const [filterText, setFilterText] = useState('');
  const filtered = useMemo(() => {
    if (!filterText) return collegeWithStats;
    return collegeWithStats.filter(c => c.name.includes(filterText));
  }, [filterText, collegeWithStats]);

  const renderCollegeTable = (data, extraCols = []) => (
    <Table
      dataSource={data}
      rowKey="id"
      size="small"
      pagination={{ pageSize: 15 }}
      columns={[
        { title: '院校', dataIndex: 'name', key: 'name', width: 180, render: (t, r) => {
          let tag = null;
          if (r.level === '985') tag = <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>985</Tag>;
          else if (r.level === '211') tag = <Tag color="orange" style={{ marginLeft: 4, fontSize: 10 }}>211</Tag>;
          else if (r.isDoubleFirstClass) tag = <Tag color="purple" style={{ marginLeft: 4, fontSize: 10 }}>双一流</Tag>;
          return <span><a onClick={() => navigate(`/colleges/${r.id}`)}>{t}</a>{tag}</span>;
        }},
        { title: '省份', dataIndex: 'province', key: 'province', width: 70 },
        { title: '最低分', dataIndex: 'minScore', key: 'minScore', width: 70 },
        { title: '最低位次', dataIndex: 'minRank', key: 'minRank', width: 90 },
        ...extraCols,
      ]}
    />
  );

  return (
    <div>
      <FadeInView>
        <Typography.Title level={4}>家长视角：升学决策参考</Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          考研、留学、考公、选调、就业、回乡——帮你从家长角度评估院校的长线价值
        </Typography.Text>
      </FadeInView>

      <Input.Search
        placeholder="搜索院校名称..."
        allowClear
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 400 }}
      />

      <Tabs
        defaultActiveKey="postgrad"
        items={[
          // ====== Postgrad ======
          {
            key: 'postgrad',
            label: <span><ReadOutlined /> 考研保研</span>,
            children: (
              <FadeInView>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="保研率越高的学校，学生读研压力越小。985头部院校保研率可达20%-30%，普通省属院校通常低于5%。"
                />

                <Card style={{ borderRadius: 12, marginBottom: 16 }} title="各院校保研率梯队">
                  <Row gutter={[16, 16]}>
                    {Object.entries(guideData.postgradRates.tiers).map(([key, tier]) => (
                      <Col xs={24} md={key === 'tier4' || key === 'tier5' ? 12 : 24} key={key}>
                        <Card
                          size="small"
                          style={{
                            borderRadius: 8,
                            borderLeft: `3px solid ${
                              key === 'tier1' ? '#ff4d4f' :
                              key === 'tier2' ? '#fa8c16' :
                              key === 'tier3' ? '#1890ff' :
                              '#d9d9d9'
                            }`,
                          }}
                        >
                          <Typography.Text strong>{tier.label}</Typography.Text>
                          {tier.schools && (
                            <div style={{ marginTop: 4 }}>
                              <Space wrap size={[4, 4]}>
                                {tier.schools.map(s => (
                                  <Tag key={s}>{s}</Tag>
                                ))}
                              </Space>
                            </div>
                          )}
                          {!tier.schools && (
                            <Typography.Text type="secondary" style={{ fontSize: 13 }}>{tier.schools || ''}</Typography.Text>
                          )}
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
                    数据来源：各校教务处公示推免名额及教育部推免指标分配。同校不同专业保研率差异显著。
                  </Typography.Text>
                </Card>

                <Card style={{ borderRadius: 12 }} title="有研究生院的院校（推免比例更高）">
                  <Typography.Paragraph>
                    经教育部批准设立研究生院的59所高校，其推免生比例可按应届本科毕业生数的15%确定（普通院校一般不超过10%）。
                    这意味着有研究生院的院校，学生保研机会显著更大。
                  </Typography.Paragraph>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    提示：在分数允许范围内，优先选择有研究生院的院校，为孩子未来发展留出更多选择空间。
                  </Typography.Text>
                </Card>
              </FadeInView>
            ),
          },

          // ====== Selection ======
          {
            key: 'selection',
            label: <span><TrophyOutlined /> 选调生</span>,
            children: (
              <FadeInView>
                <Card style={{ borderRadius: 12, marginBottom: 16 }}>
                  <Typography.Title level={5}>什么是选调生？</Typography.Title>
                  <Typography.Paragraph>
                    选调生是各省党委组织部门有计划地从高等院校选调品学兼优的应届大学本科及以上毕业生到基层工作，
                    作为党政领导干部后备人选和县级以上党政机关高素质工作人员进行重点培养。简单说：选调生≈公务员中的"管培生"。
                  </Typography.Paragraph>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Card size="small" style={{ borderTop: '3px solid #ff4d4f' }}>
                        <Typography.Text strong>中央选调</Typography.Text>
                        <Typography.Paragraph style={{ fontSize: 13, marginTop: 4 }}>
                          中央部委直接招录，竞争最激烈，基本上只面向Top10高校。甘肃不在此列（中央选调主要面向北京高校）。
                        </Typography.Paragraph>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small" style={{ borderTop: '3px solid #fa8c16' }}>
                        <Typography.Text strong>定向选调</Typography.Text>
                        <Typography.Paragraph style={{ fontSize: 13, marginTop: 4 }}>
                          省委组织部面向指定高校招录，分配至省直/市直机关。甘肃省2025年定向选调面向41所指定高校，招350名。
                        </Typography.Paragraph>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small" style={{ borderTop: '3px solid #1890ff' }}>
                        <Typography.Text strong>常规选调</Typography.Text>
                        <Typography.Paragraph style={{ fontSize: 13, marginTop: 4 }}>
                          面向更广泛的本科及以上应届生，分配到县乡基层。甘肃省2025年常规选调招300名。
                        </Typography.Paragraph>
                      </Card>
                    </Col>
                  </Row>
                </Card>

                <Card style={{ borderRadius: 12 }} title="甘肃省定向选调目标院校（41所）">
                  <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    来源：甘肃省2025年选调应届优秀大学毕业生公告（2024年9月发布），招650名。
                  </Typography.Text>
                  <Space wrap size={[6, 6]}>
                    {guideData.selectionTransfer.targetSchools.map(s => (
                      <Tag
                        key={s}
                        color={s === '兰州大学' ? 'green' : 'blue'}
                        style={{ fontSize: 13, padding: '2px 10px' }}
                      >
                        {s}
                      </Tag>
                    ))}
                  </Space>
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginTop: 12 }}
                    message="以上41所均为985高校+中央财经大学+中国矿业大学。孩子如果能考入这些院校，毕业后多一条定向选调的高质量就业通道。"
                  />
                </Card>
              </FadeInView>
            ),
          },

          // ====== Employers ======
          {
            key: 'employers',
            label: <span><BankOutlined /> 央企大厂</span>,
            children: (
              <FadeInView>
                <Typography.Paragraph>
                  不同行业有各自的"对口院校"。以下院校毕业生在对应领域的校招中有明显优势。
                </Typography.Paragraph>

                <Row gutter={[16, 16]}>
                  {Object.entries(guideData.targetEmployers.categories).map(([key, info]) => (
                    <Col xs={24} md={12} key={key}>
                      <Card
                        style={{ borderRadius: 12, height: '100%' }}
                        title={
                          <Space>
                            <BankOutlined />
                            <span>{key}</span>
                          </Space>
                        }
                      >
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {info.description}
                        </Typography.Text>
                        <div style={{ marginTop: 8 }}>
                          <Space wrap size={[4, 4]}>
                            {info.schools.map(s => (
                              <Tag
                                key={s}
                                color={s === '兰州大学' ? 'green' : 'blue'}
                                style={{ fontSize: 12 }}
                              >
                                {s}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <Card style={{ borderRadius: 12, marginTop: 16 }} title="综合筛选：选调+大厂双重优势院校">
                  <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    同时出现在定向选调名单和互联网/央企校招目标校中的院校
                  </Typography.Text>
                  {(() => {
                    const allEmployer = new Set();
                    Object.values(guideData.targetEmployers.categories).forEach(cat => {
                      (cat.schools || []).forEach(s => allEmployer.add(s));
                    });
                    const both = guideData.selectionTransfer.targetSchools.filter(s => allEmployer.has(s));
                    return (
                      <Space wrap size={[6, 6]}>
                        {both.map(s => <Tag key={s} color="gold" style={{ fontSize: 13 }}>{s} <StarOutlined /></Tag>)}
                      </Space>
                    );
                  })()}
                </Card>
              </FadeInView>
            ),
          },

          // ====== Back Home ======
          {
            key: 'backhome',
            label: <span><HomeOutlined /> 回乡就业</span>,
            children: (
              <FadeInView>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card style={{ borderRadius: 12 }} title="省内院校回乡就业优势高">
                      <Space wrap size={[6, 6]}>
                        {guideData.backHomeEmployment.gansuAdvantage.high.map(s => (
                          <Tag key={s} color="green" style={{ fontSize: 13, padding: '2px 10px' }}>{s}</Tag>
                        ))}
                      </Space>
                      <Typography.Paragraph style={{ marginTop: 12 }}>
                        {guideData.backHomeEmployment.gansuAdvantage.reason}
                      </Typography.Paragraph>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card style={{ borderRadius: 12 }} title="甘肃主要用人单位">
                      <Tabs
                        size="small"
                        items={[
                          {
                            key: 'physical',
                            label: '物理类/理科',
                            children: (
                              <Space wrap size={[4, 4]}>
                                {guideData.backHomeEmployment.popularReturnFields.physical.map(s => (
                                  <Tag key={s} color="blue">{s}</Tag>
                                ))}
                              </Space>
                            ),
                          },
                          {
                            key: 'history',
                            label: '历史类/文科',
                            children: (
                              <Space wrap size={[4, 4]}>
                                {guideData.backHomeEmployment.popularReturnFields.history.map(s => (
                                  <Tag key={s} color="orange">{s}</Tag>
                                ))}
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </Card>
                  </Col>
                </Row>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                  message="省外985甘肃籍学生回省就业的主流路径是考定向选调生或省考公务员，其次是进入央企在甘分支机构（如国家电网甘肃电力、中石油驻甘单位）。"
                />
              </FadeInView>
            ),
          },

          // ====== Study Abroad ======
          {
            key: 'abroad',
            label: <span><GlobalOutlined /> 留学</span>,
            children: (
              <FadeInView>
                <Row gutter={[16, 16]}>
                  {guideData.studyAbroad.factors.map((f, i) => (
                    <Col xs={24} sm={12} key={i}>
                      <Card size="small" style={{ borderRadius: 8 }}>
                        <Typography.Text strong>{f.name}</Typography.Text>
                        <Typography.Paragraph style={{ fontSize: 13, marginTop: 4 }}>
                          {f.description}
                        </Typography.Paragraph>
                        {f.examples.length > 0 && (
                          <Space wrap size={[4, 4]}>
                            {f.examples.map(ex => <Tag key={ex}>{ex}</Tag>)}
                          </Space>
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>

                <Card style={{ borderRadius: 12, marginTop: 16 }} title="留学费用参考（年均）">
                  <Table
                    dataSource={[
                      { region: '美国', tuition: '25-40万', living: '10-15万', total: '35-55万' },
                      { region: '英国', tuition: '15-25万', living: '10-15万', total: '25-40万' },
                      { region: '澳大利亚', tuition: '15-25万', living: '8-12万', total: '23-37万' },
                      { region: '加拿大', tuition: '12-20万', living: '8-12万', total: '20-32万' },
                      { region: '德国/法国（公立）', tuition: '0-3万', living: '6-10万', total: '6-13万' },
                      { region: '日本/韩国', tuition: '3-8万', living: '5-10万', total: '8-18万' },
                      { region: '新加坡/香港', tuition: '8-18万', living: '8-12万', total: '16-30万' },
                      { region: '中外合作2+2（国内段）', tuition: '5-10万', living: '2-4万', total: '7-14万' },
                    ]}
                    rowKey="region"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: '留学目的地', dataIndex: 'region', key: 'region' },
                      { title: '学费（RMB/年）', dataIndex: 'tuition', key: 'tuition' },
                      { title: '生活费', dataIndex: 'living', key: 'living' },
                      { title: '合计', dataIndex: 'total', key: 'total', render: v => <Typography.Text strong>{v}</Typography.Text> },
                    ]}
                  />
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                    以上为估算值，实际费用因城市、学校和个人消费习惯而异。中外合作2+2/3+1模式可大幅降低总成本。
                  </Typography.Text>
                </Card>
              </FadeInView>
            ),
          },

          // ====== Full Table ======
          {
            key: 'all',
            label: <span>全部院校总览</span>,
            children: (
              <FadeInView>
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                  点击院校名称查看详情。当前显示在甘肃有录取数据的院校。
                </Typography.Text>
                {renderCollegeTable(filtered, [
                  {
                    title: '保研梯队', key: 'postgrad', width: 110,
                    render: (_, r) => r.postgradTier ? <Tag>{r.postgradTier}</Tag> : '-',
                  },
                  {
                    title: '选调目标校', key: 'selection', width: 90,
                    render: (_, r) => r.isSelection ? <Tag color="gold">是</Tag> : '-',
                  },
                  {
                    title: '回乡就业', key: 'backhome', width: 80,
                    render: (_, r) => r.backHomeLevel
                      ? <Tag color={r.backHomeLevel === '高' ? 'green' : 'blue'}>{r.backHomeLevel}</Tag>
                      : '-',
                  },
                ])}
              </FadeInView>
            ),
          },
        ]}
      />
    </div>
  );
}
