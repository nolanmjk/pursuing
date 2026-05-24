import { useState, useMemo } from 'react';
import {
  Card, Form, Select, Radio, Button, Steps, Typography,
  Result, Tag, Space, Alert, Row, Col, Descriptions, Collapse,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined,
  AimOutlined, FileProtectOutlined, GiftOutlined,
} from '@ant-design/icons';
import specialPlanData from '../../data/special_plan_data.json';
import { FadeInView } from '../../components/AnimatedPresence';
import { motion } from 'framer-motion';

const { Panel } = Collapse;

const allCounties = specialPlanData.allCountyList;
const nationalCounties = new Set(allCounties); // 58 counties
const universityCounties = new Set([...allCounties, '肃北蒙古族自治县', '阿克塞哈萨克族自治县', '肃南裕固族自治县']); // 61 counties

export default function SpecialPlanPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    county: null,
    hukouType: null,
    hasLocalHukou3Years: null,
    hasLocalXueji3Years: null,
    guardianHasLocalHukou: null,
    guardianRural: null,
    isMinority: null,
    isPovertyRegistered: null,
  });

  const update = (key, val) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  const eligibility = useMemo(() => {
    if (step < 2) return null;
    const { county, hukouType, hasLocalHukou3Years, hasLocalXueji3Years, guardianHasLocalHukou, guardianRural, isMinority } = answers;

    const isRural = hukouType === '农村';
    const has3Year = hasLocalHukou3Years && hasLocalXueji3Years && guardianHasLocalHukou;
    const hasRural3Year = has3Year && isRural && guardianRural;

    return {
      national: nationalCounties.has(county) && has3Year,
      university: universityCounties.has(county) && hasRural3Year,
      local: isRural,
      minority: isMinority,
      tibetan: ['天祝藏族自治县','合作市','临潭县','卓尼县','舟曲县','迭部县','玛曲县','碌曲县','夏河县'].includes(county),
    };
  }, [answers, step]);

  const questions = [
    {
      key: 'county',
      label: '你的户籍所在地是哪里？',
      extra: '请选择你的户口所在的县级行政区',
      render: () => (
        <Select
          showSearch
          placeholder="搜索并选择你的县/市/区"
          style={{ width: '100%', maxWidth: 400 }}
          value={answers.county}
          onChange={v => update('county', v)}
          options={allCounties.map(c => ({ value: c, label: c }))}
          filterOption={(input, option) => option.label.includes(input)}
        />
      ),
    },
    {
      key: 'hukouType',
      label: '你的户籍性质是什么？',
      extra: '农村户籍和城镇户籍在专项计划中资格不同',
      render: () => (
        <Radio.Group value={answers.hukouType} onChange={e => update('hukouType', e.target.value)}>
          <Radio.Button value="农村">农村户籍</Radio.Button>
          <Radio.Button value="城镇">城镇户籍</Radio.Button>
        </Radio.Group>
      ),
    },
    {
      key: 'hasLocalHukou3Years',
      label: '你是否具有当地连续3年以上户籍？',
      extra: '从高考报名之日向前推算，须连续满3年',
      render: () => (
        <Radio.Group value={answers.hasLocalHukou3Years} onChange={e => update('hasLocalHukou3Years', e.target.value)}>
          <Radio.Button value={true}>是，连续满3年</Radio.Button>
          <Radio.Button value={false}>否</Radio.Button>
        </Radio.Group>
      ),
    },
    {
      key: 'hasLocalXueji3Years',
      label: '你是否在户籍所在县（市、区）高中连续就读3年？',
      extra: '须具有连续3年学籍并实际就读',
      render: () => (
        <Radio.Group value={answers.hasLocalXueji3Years} onChange={e => update('hasLocalXueji3Years', e.target.value)}>
          <Radio.Button value={true}>是，连续就读3年</Radio.Button>
          <Radio.Button value={false}>否</Radio.Button>
        </Radio.Group>
      ),
    },
    {
      key: 'guardianHasLocalHukou',
      label: '你的父亲/母亲/法定监护人是否具有当地户籍？',
      render: () => (
        <Radio.Group value={answers.guardianHasLocalHukou} onChange={e => update('guardianHasLocalHukou', e.target.value)}>
          <Radio.Button value={true}>是</Radio.Button>
          <Radio.Button value={false}>否</Radio.Button>
        </Radio.Group>
      ),
    },
    {
      key: 'guardianRural',
      label: '你的父亲/母亲/法定监护人是否为农村户籍？',
      extra: '高校专项和地方专项要求监护人也是农村户籍',
      render: () => (
        <Radio.Group value={answers.guardianRural} onChange={e => update('guardianRural', e.target.value)}>
          <Radio.Button value={true}>是，农村户籍</Radio.Button>
          <Radio.Button value={false}>否，城镇户籍</Radio.Button>
        </Radio.Group>
      ),
    },
    {
      key: 'isMinority',
      label: '你是否为少数民族？',
      extra: '少数民族考生可报考民族班和民族预科',
      render: () => (
        <Radio.Group value={answers.isMinority} onChange={e => update('isMinority', e.target.value)}>
          <Radio.Button value={true}>是</Radio.Button>
          <Radio.Button value={false}>否</Radio.Button>
        </Radio.Group>
      ),
    },
    {
      key: 'isPovertyRegistered',
      label: '你是否为建档立卡贫困户？',
      extra: '建档立卡专项面向已脱贫但继续享受政策的家庭',
      render: () => (
        <Radio.Group value={answers.isPovertyRegistered} onChange={e => update('isPovertyRegistered', e.target.value)}>
          <Radio.Button value={true}>是</Radio.Button>
          <Radio.Button value={false}>否/不清楚</Radio.Button>
        </Radio.Group>
      ),
    },
  ];

  const currentQ = questions[step];

  const allAnswered = () => {
    const q = questions[step];
    const val = answers[q.key];
    return val !== null && val !== undefined && val !== '';
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setStep(questions.length); // results
    }
  };

  return (
    <div>
      <FadeInView>
        <Typography.Title level={4}>专项计划资格自测</Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          回答8个问题，自动判断你可以报考哪些专项计划。数据来源：甘肃省教育考试院《2025年重点高校招生专项计划实施办法》
        </Typography.Text>
      </FadeInView>

      {step < questions.length && (
        <FadeInView key={step}>
          <Card style={{ marginBottom: 16, borderRadius: 12 }}>
            <Steps
              current={step}
              size="small"
              style={{ marginBottom: 24 }}
              items={[
                { title: '户籍信息' }, { title: '就读情况' }, { title: '监护人' }, { title: '补充信息' },
                { title: '补充信息' }, { title: '补充信息' }, { title: '补充信息' }, { title: '补充信息' },
              ]}
            />

            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              <Typography.Title level={5} style={{ marginBottom: 4 }}>
                {currentQ.label}
              </Typography.Title>
              {currentQ.extra && (
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  {currentQ.extra}
                </Typography.Text>
              )}
              <div style={{ marginTop: 16, marginBottom: 32 }}>
                {currentQ.render()}
              </div>

              <Space>
                {step > 0 && (
                  <Button onClick={() => setStep(step - 1)}>上一题</Button>
                )}
                <Button
                  type="primary"
                  onClick={handleNext}
                  disabled={!allAnswered()}
                >
                  {step < questions.length - 1 ? '下一题' : '查看结果'}
                </Button>
              </Space>
            </div>
          </Card>
        </FadeInView>
      )}

      {/* Results */}
      {step === questions.length && eligibility && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card style={{ marginBottom: 16, borderRadius: 12 }}>
            <Typography.Title level={5} style={{ marginBottom: 16 }}>
              你的专项计划资格评估结果
            </Typography.Title>

            <Row gutter={[16, 16]}>
              {[
                {
                  key: 'national',
                  title: '国家专项计划',
                  batch: '本科提前批B段',
                  icon: <AimOutlined />,
                  color: eligibility.national ? '#52c41a' : '#ff4d4f',
                  eligible: eligibility.national,
                  reason: eligibility.national
                    ? `你的户籍（${answers.county}）在58个实施区域内，且满足户籍+学籍各3年的条件`
                    : !nationalCounties.has(answers.county)
                      ? `你的户籍（${answers.county}）不在58个实施区域内`
                      : '你尚未同时满足户籍和学籍各3年的条件',
                  detail: specialPlanData.plans.national,
                },
                {
                  key: 'university',
                  title: '高校专项计划',
                  batch: '本科提前批B段',
                  icon: <GiftOutlined />,
                  color: eligibility.university ? '#52c41a' : '#ff4d4f',
                  eligible: eligibility.university,
                  reason: eligibility.university
                    ? `你的户籍（${answers.county}）在61个实施区域内，且为农村户籍，满足全部条件`
                    : !universityCounties.has(answers.county)
                      ? `你的户籍（${answers.county}）不在61个实施区域内`
                      : !(answers.hukouType === '农村')
                        ? '高校专项计划仅限农村户籍考生'
                        : '你尚未同时满足农村户籍+学籍各3年的条件',
                  detail: specialPlanData.plans.university,
                },
                {
                  key: 'local',
                  title: '地方专项计划',
                  batch: '本科批C段',
                  icon: <FileProtectOutlined />,
                  color: eligibility.local ? '#52c41a' : '#ff4d4f',
                  eligible: eligibility.local,
                  reason: eligibility.local
                    ? '你是甘肃省农村户籍考生，具备地方专项计划报考资格'
                    : '地方专项计划仅限甘肃省农村户籍考生',
                  detail: specialPlanData.plans.local,
                },
              ].map(plan => (
                <Col xs={24} md={8} key={plan.key}>
                  <Card
                    size="small"
                    style={{
                      borderRadius: 12,
                      borderTop: `3px solid ${plan.color}`,
                      background: plan.eligible ? '#f6ffed' : '#fff2f0',
                    }}
                  >
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 32 }}>
                        {plan.eligible ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                      </span>
                      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{plan.title}</div>
                      <Tag color={plan.eligible ? 'green' : 'red'} style={{ marginTop: 4 }}>
                        {plan.eligible ? '具备资格' : '不具备资格'}
                      </Tag>
                    </div>
                    <Typography.Text style={{ fontSize: 13 }}>
                      {plan.reason}
                    </Typography.Text>
                    {plan.eligible && (
                      <>
                        <div style={{ marginTop: 8, fontSize: 13 }}>
                          <Typography.Text strong>录取批次：</Typography.Text>{plan.detail.batch}
                        </div>
                      </>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>

            {/* 其他特殊类型 */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {[
                {
                  title: '民族班/民族预科',
                  eligible: eligibility.minority,
                  reason: eligibility.minority
                    ? '你是少数民族考生，可报考民族班和民族预科'
                    : '仅限少数民族考生',
                },
                {
                  title: '藏区专项',
                  eligible: eligibility.tibetan,
                  reason: eligibility.tibetan
                    ? '你的户籍在藏区专项实施区域'
                    : '仅限甘南州和天祝县藏区户籍考生',
                },
                {
                  title: '建档立卡专项',
                  eligible: answers.isPovertyRegistered,
                  reason: answers.isPovertyRegistered
                    ? '你属于建档立卡家庭考生'
                    : '仅限建档立卡贫困户考生',
                },
              ].map(item => (
                <Col xs={24} sm={8} key={item.title}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: item.eligible ? '#e6f7ff' : '#fafafa',
                    border: `1px solid ${item.eligible ? '#91d5ff' : '#f0f0f0'}`,
                  }}>
                    <Space>
                      {item.eligible
                        ? <CheckCircleOutlined style={{ color: '#1890ff' }} />
                        : <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
                      }
                      <Typography.Text strong={item.eligible}>{item.title}</Typography.Text>
                    </Space>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{item.reason}</div>
                  </div>
                </Col>
              ))}
            </Row>

            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
              message="重要提醒"
              description="往年被专项计划录取后放弃入学资格或退学的考生，不再具有专项计划报考资格。高校专项计划需在每年4月25日前通过教育部阳光高考平台提交申请，错过时间将无法补报。"
            />
          </Card>

          {/* Detailed conditions */}
          <Card style={{ borderRadius: 12 }} title="各专项计划详细报考条件">
            <Collapse ghost>
              {Object.entries(specialPlanData.plans).map(([key, plan]) => (
                <Panel
                  key={key}
                  header={
                    <Space>
                      <Tag color={eligibility[key] ? 'green' : 'default'}>{plan.name}</Tag>
                      <Typography.Text type="secondary" style={{ fontSize: 13 }}>{plan.batch}</Typography.Text>
                    </Space>
                  }
                >
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="实施区域" span={2}>
                      {key === 'local' ? '甘肃省全省农村' : `${plan.targetCounties}个县（市、区）`}
                    </Descriptions.Item>
                    <Descriptions.Item label="户籍要求" span={2}>
                      {plan.conditions.ruralOnly ? '农村户籍' : '实施区域户籍（城乡均可）'}
                      {plan.conditions.hukouYears && ` · ${plan.conditions.hukouYears}`}
                    </Descriptions.Item>
                    <Descriptions.Item label="学籍要求" span={2}>
                      {plan.conditions.xueji}
                    </Descriptions.Item>
                    <Descriptions.Item label="监护人要求" span={2}>
                      {plan.conditions.guardian}
                    </Descriptions.Item>
                    {plan.conditions.extraStep && (
                      <Descriptions.Item label="额外步骤" span={2}>
                        <Typography.Text type="warning">{plan.conditions.extraStep}</Typography.Text>
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="备注" span={2}>
                      {plan.conditions.note}
                    </Descriptions.Item>
                  </Descriptions>
                  {plan.participatingSchools && (
                    <div style={{ marginTop: 12 }}>
                      <Typography.Text strong>参与院校：</Typography.Text>
                      <div style={{ marginTop: 4 }}>
                        <Space wrap>
                          {plan.participatingSchools.map(s => (
                            <Tag key={s} color="blue">{s}</Tag>
                          ))}
                        </Space>
                      </div>
                    </div>
                  )}
                </Panel>
              ))}

              {specialPlanData.otherSpecialTypes.map(type => (
                <Panel
                  key={type.name}
                  header={
                    <Space>
                      <Tag color="purple">{type.name}</Tag>
                      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                        {type.qualification || type.description.slice(0, 30)}
                      </Typography.Text>
                    </Space>
                  }
                >
                  <Typography.Paragraph>{type.description}</Typography.Paragraph>
                  {type.types && (
                    <Row gutter={[12, 12]}>
                      {type.types.map(t => (
                        <Col xs={24} sm={12} key={t.name}>
                          <Card size="small">
                            <Typography.Text strong>{t.name}</Typography.Text>
                            <br />
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              承担院校：{t.undertaker}
                            </Typography.Text>
                            <br />
                            <Typography.Text style={{ fontSize: 12 }}>
                              义务：{t.obligation}
                            </Typography.Text>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                  <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                    {type.note}
                  </Typography.Text>
                </Panel>
              ))}
            </Collapse>
          </Card>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={() => { setStep(0); setAnswers({}); }}>
              重新测试
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
