import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, Input, Button, Typography, Tag, Empty, Row, Col } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, BulbOutlined, ThunderboltOutlined, RobotFilled } from '@ant-design/icons';
import { useAppContext } from '../../context/AppContext';
import { FadeInView } from '../../components/AnimatedPresence';
import { QA_KNOWLEDGE, SUGGESTED_QUESTIONS, findBestMatch, personalizeAnswer } from '../../utils/qaAssistant';
import { aiChat, buildUserContext } from '../../utils/aiChat';

export default function AssistantPage() {
  const appCtx = useAppContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [aiOnline, setAiOnline] = useState(true);
  const messagesEnd = useRef(null);
  const historyRef = useRef([]);

  const scrollToBottom = useCallback(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, typing]);

  const replyWithFallback = useCallback(async (userMsg) => {
    const userCtx = buildUserContext(appCtx);

    // Try AI first
    if (aiOnline) {
      historyRef.current.push({ role: 'user', content: userMsg + userCtx });
      if (historyRef.current.length > 20) {
        historyRef.current = historyRef.current.slice(-20);
      }

      const aiReply = await aiChat(historyRef.current);

      if (aiReply) {
        historyRef.current.push({ role: 'assistant', content: aiReply });
        setMessages(prev => [...prev, { role: 'assistant', text: aiReply, id: Date.now() + 1 }]);
        setTyping(false);
        return;
      }
      setAiOnline(false);
    }

    // Keyword fallback
    const match = findBestMatch(userMsg);
    if (match) {
      setMessages(prev => [...prev, { role: 'assistant', text: personalizeAnswer(match.answer, appCtx), id: Date.now() + 1 }]);
    } else {
      setMessages(prev => [...prev, { role: 'assistant', text: '抱歉，我目前的知识库中还没有覆盖这个问题。\n\n你可以尝试换一种问法，或者查看以下相关功能页面：\n• 分数匹配 — 输入分数查院校推荐\n• 一分一段 — 查位次和排名\n• 政策指南 — 了解平行志愿和省控线\n• 模拟填报 — 按真实格式练习填志愿\n\n如果问题比较复杂，建议咨询学校老师或甘肃省教育考试院。', id: Date.now() + 1 }]);
    }
    setTyping(false);
  }, [aiOnline, appCtx]);

  const sendMessage = useCallback((text) => {
    const q = text.trim();
    if (!q) return;

    setMessages(prev => [...prev, { role: 'user', text: q, id: Date.now() }]);
    setInput('');
    setTyping(true);
    replyWithFallback(q);
  }, [replyWithFallback]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <FadeInView>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          {/* Robot avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            border: '2px solid rgba(50,125,225,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(50,125,225,0.25)',
          }}>
            <RobotFilled style={{ fontSize: 26, color: '#327de1' }} />
            {/* Antenna dot */}
            <div style={{
              position: 'absolute', top: -5, left: '50%', marginLeft: -3,
              width: 6, height: 6, borderRadius: '50%',
              background: '#faaf32',
              boxShadow: '0 0 8px rgba(250,175,50,0.6)',
            }} />
          </div>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              <span style={{ color: '#327de1' }}>小楷</span>
              <span style={{ fontSize: 14, fontWeight: 400, color: '#999', marginLeft: 8 }}>DeepSeek AI 答疑</span>
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              关于甘肃高考志愿填报的任何问题，都可以问我
            </Typography.Text>
          </div>
        </div>
      </FadeInView>

      {/* Chat messages */}
      <FadeInView delay={0.1}>
        <Card
          style={{ borderRadius: 12, marginBottom: 16, minHeight: 360, maxHeight: 'calc(100vh - 340px)', overflow: 'auto' }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          {messages.length === 0 ? (
            <div>
              <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
                {/* Robot character */}
                <div style={{
                  width: 88, height: 88, borderRadius: 28,
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                  border: '3px solid rgba(50,125,225,0.5)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                  boxShadow: '0 8px 40px rgba(50,125,225,0.3), 0 0 0 8px rgba(50,125,225,0.05)',
                  marginBottom: 16,
                }}>
                  {/* Eyes */}
                  <div style={{ display: 'flex', gap: 12, position: 'absolute', top: 22 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: '#faaf32',
                      boxShadow: '0 0 8px rgba(250,175,50,0.5)',
                    }} />
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: '#faaf32',
                      boxShadow: '0 0 8px rgba(250,175,50,0.5)',
                    }} />
                  </div>
                  {/* Mouth */}
                  <div style={{
                    position: 'absolute', bottom: 16,
                    width: 20, height: 2,
                    background: 'rgba(50,125,225,0.6)',
                    borderRadius: 1,
                  }} />
                  {/* Antenna */}
                  <div style={{
                    position: 'absolute', top: -6, left: '50%', marginLeft: -6,
                    width: 3, height: 12,
                    background: 'linear-gradient(180deg, #faaf32, transparent)',
                    borderRadius: '2px 2px 0 0',
                  }} />
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', marginLeft: -4,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#faaf32',
                    boxShadow: '0 0 12px rgba(250,175,50,0.7)',
                  }} />
                </div>
                <Typography.Title level={4} style={{ margin: '4px 0' }}>
                  你好！我是 <span style={{ color: '#327de1' }}>小楷</span>
                </Typography.Title>
                <Typography.Text type="secondary">我可以解答甘肃高考志愿填报的常见问题</Typography.Text>
              </div>

              {appCtx.userScore != null && appCtx.userRank != null && (
                <Card size="small" style={{ marginBottom: 16, background: 'rgba(50,125,225,0.04)', border: '1px solid rgba(50,125,225,0.12)' }}>
                  <Typography.Text style={{ fontSize: 13 }}>
                    你当前的成绩：<strong style={{ color: '#327de1' }}>{appCtx.userScore}分</strong>
                    ，位次 <strong style={{ color: '#327de1' }}>{appCtx.userRank.toLocaleString()}名</strong>
                    ，科类 <strong>{appCtx.userSubject}</strong>
                    。回答会结合这些信息给出个性化建议。
                  </Typography.Text>
                </Card>
              )}

              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>试试这些问题：</Typography.Text>
              <Row gutter={[8, 8]}>
                {SUGGESTED_QUESTIONS.map(q => (
                  <Col xs={24} sm={12} key={q}>
                    <Button
                      block
                      icon={<BulbOutlined />}
                      onClick={() => sendMessage(q)}
                      style={{ textAlign: 'left', height: 'auto', padding: '8px 14px', fontSize: 13 }}
                    >
                      {q}
                    </Button>
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #327de1, #4b96e1)'
                      : 'linear-gradient(135deg, #52C41A, #73d13d)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {msg.role === 'user'
                      ? <UserOutlined style={{ color: '#fff', fontSize: 14 }} />
                      : <RobotFilled style={{ color: '#fff', fontSize: 14 }} />}
                  </div>
                  <div style={{
                    maxWidth: '82%',
                    padding: '10px 16px',
                    borderRadius: 12,
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #327de1, #2563c8)'
                      : '#f5f5f5',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    fontSize: 14,
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #52C41A, #73d13d)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <RobotFilled style={{ color: '#fff', fontSize: 14 }} />
                  </div>
                  <span style={{ color: '#999', fontSize: 12, marginLeft: 4 }}>小楷正在输入...</span>
                </div>
              )}
              <div ref={messagesEnd} />
            </div>
          )}
        </Card>
      </FadeInView>

      {/* Quick tags after conversation starts */}
      {messages.length > 0 && (
        <FadeInView delay={0.05}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {['平行志愿', '位次法', '冲稳保', '省控线', '专业组', '调剂'].map(tag => (
              <Tag
                key={tag}
                style={{ cursor: 'pointer', fontSize: 12, padding: '2px 10px' }}
                onClick={() => sendMessage(tag)}
              >{tag}</Tag>
            ))}
            <Button type="link" size="small" onClick={() => setMessages([])}>清空对话</Button>
          </div>
        </FadeInView>
      )}

      {/* Input */}
      <FadeInView delay={0.05}>
        <Input.Search
          value={input}
          onChange={e => setInput(e.target.value)}
          onSearch={sendMessage}
          placeholder="输入你的问题……"
          enterButton={<span><SendOutlined /> 发送</span>}
          size="large"
          disabled={typing}
        />
      </FadeInView>
    </div>
  );
}
