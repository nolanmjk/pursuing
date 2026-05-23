import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Statistic, Button, Tag, Input } from 'antd';
import { SearchOutlined, FormOutlined, ExperimentOutlined, HeartOutlined, TrophyOutlined, SwapOutlined, BookOutlined, ReadOutlined, ThunderboltOutlined, SendOutlined, RobotOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { StaggerCards, CardItem, FadeInView, CountUp } from '../../components/AnimatedPresence';
import { SUGGESTED_QUESTIONS, findBestMatch, personalizeAnswer } from '../../utils/qaAssistant';
import collegesData from '../../data/colleges.json';
import majorsData from '../../data/majors.json';
import admissionData from '../../data/admission_scores.json';
import FloatingAssistant from '../../components/FloatingAssistant';

const features = [
  { key: '/ai-fill', icon: <ThunderboltOutlined style={{ fontSize: 34, color: '#FAAD14' }} />, title: 'AI 智能填志愿', desc: '一句话描述，自动生成冲稳保志愿表', color: '#FAAD14', badge: '推荐' },
  { key: '/rank-conversion', icon: <TrophyOutlined style={{ fontSize: 34, color: '#00C8E0' }} />, title: '位次换算', desc: '查位次 → 算等效分 → 定区间', color: '#00C8E0' },
  { key: '/score-match', icon: <SearchOutlined style={{ fontSize: 34, color: '#7C5CFC' }} />, title: '分数匹配', desc: '智能匹配冲/稳/保三档院校', color: '#7C5CFC' },
  { key: '/colleges', icon: <HeartOutlined style={{ fontSize: 34, color: '#52C41A' }} />, title: '院校专业', desc: '浏览院校详情和历年录取数据', color: '#52C41A' },
  { key: '/college-compare', icon: <SwapOutlined style={{ fontSize: 34, color: '#1890FF' }} />, title: '院校对比', desc: '多校横向对比，一目了然', color: '#1890FF' },
  { key: '/major-compare', icon: <BookOutlined style={{ fontSize: 34, color: '#722ED1' }} />, title: '专业对比', desc: '就业前景、薪资、适合人群', color: '#722ED1' },
  { key: '/simulate', icon: <FormOutlined style={{ fontSize: 34, color: '#FA8C16' }} />, title: '模拟填报', desc: '按规则模拟，分析梯度合理性', color: '#FA8C16' },
  { key: '/assessment', icon: <ExperimentOutlined style={{ fontSize: 34, color: '#EB2F96' }} />, title: '兴趣测评', desc: '霍兰德测评，发现适合你的专业', color: '#EB2F96' },
  { key: '/policy', icon: <ReadOutlined style={{ fontSize: 34, color: '#13C2C2' }} />, title: '报考指南', desc: '省控线、填报规则、征集志愿', color: '#13C2C2' },
];

const nebulaOrbs = [
  { bg: 'rgba(0,200,230,0.10)', size: 280, top: '15%', left: '30%', duration: 10 },
  { bg: 'rgba(124,92,252,0.08)', size: 320, top: '45%', left: '55%', duration: 13 },
  { bg: 'rgba(180,100,240,0.06)', size: 260, top: '60%', left: '20%', duration: 11 },
  { bg: 'rgba(0,180,220,0.07)', size: 300, top: '25%', left: '65%', duration: 14 },
  { bg: 'rgba(100,60,200,0.05)', size: 340, top: '10%', left: '50%', duration: 12 },
];

// Generate twinkling stars
const stars = Array.from({ length: 25 }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 2,
  delay: Math.random() * 4,
  duration: 2 + Math.random() * 3,
}));

function XiaoKaiCard({ navigate }) {
  const [hovered, setHovered] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const chatRef = useRef(null);
  const ctx = useAppContext();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, thinking]);

  const doReply = (userMsg) => {
    const userCtx = { userScore: ctx.userScore, userRank: ctx.userRank, userSubject: ctx.userSubject };
    setThinking(true);
    // Small delay for natural feel, then keyword-match
    setTimeout(() => {
      const match = findBestMatch(userMsg);
      const text = match
        ? personalizeAnswer(match.answer, userCtx)
        : personalizeAnswer('我主要解答甘肃高考志愿填报相关问题，试试问我：平行志愿规则、位次换算、冲稳保策略、退档滑档区别等~', userCtx);
      setMessages(prev => [...prev, { role: 'bot', text, id: Date.now() }]);
      setThinking(false);
    }, 400);
  };

  const handleSend = (text) => {
    const msg = (text || chatInput).trim();
    if (!msg || thinking) return;
    setMessages(prev => [...prev, { role: 'user', text: msg, id: Date.now() }]);
    setChatInput('');
    doReply(msg);
  };

  const handleQuickAsk = (q) => {
    setMessages(prev => [...prev, { role: 'user', text: q, id: Date.now() }]);
    doReply(q);
  };

  return (
    <FadeInView delay={0.3}>
      <Typography.Title level={5} className="pursuing-section-title">
        小楷助手 <span style={{ fontSize: 12, fontWeight: 400, color: '#999' }}>— 直接问我志愿问题</span>
      </Typography.Title>
      <Card
        style={{
          borderRadius: 16, marginBottom: 40, marginTop: 20,
          background: 'linear-gradient(135deg, #080C16 0%, #0d1a2d 50%, #080C16 100%)',
          border: '1px solid rgba(0,200,230,0.12)',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Row wrap={false}>
          {/* Left: robot + input */}
          <Col flex="none" style={{
            width: 200, padding: '20px 0 20px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            gap: 12,
          }}>
            <motion.div
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onClick={() => navigate('/assistant')}
              animate={hovered ? { scale: 1.08, y: 0 } : { y: [0, -3, 0] }}
              transition={hovered ? { type: 'spring', stiffness: 300, damping: 15 } : { y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
              style={{
                width: 80, height: 80, borderRadius: 24, flexShrink: 0,
                background: 'linear-gradient(135deg, #0a1628 0%, #1a3a5c 100%)',
                cursor: 'pointer', position: 'relative',
                boxShadow: hovered
                  ? '0 0 30px rgba(0,200,230,0.3), 0 0 60px rgba(0,200,230,0.1)'
                  : '0 4px 20px rgba(0,20,50,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible',
              }}
            >
              {/* Graduation cap */}
              <motion.div
                animate={hovered ? { rotate: [0, -3, 3, 0], y: -2 } : { y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ position: 'absolute', top: -32, left: '50%', marginLeft: -13, zIndex: 3 }}
              >
                {/* Skull cap */}
                <div style={{
                  width: 16, height: 7, background: 'linear-gradient(180deg, #2c2c54 0%, #1a1a2e 100%)',
                  borderRadius: '4px 4px 0 0', margin: '0 auto',
                  border: '1px solid rgba(250,175,50,0.2)',
                }} />
                {/* Board */}
                <div style={{
                  width: 26, height: 6, background: 'linear-gradient(180deg, #3d3d6b 0%, #2c2c54 100%)',
                  borderRadius: 2, margin: '0 auto',
                  transform: 'translateY(-13px)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(250,175,50,0.25)',
                }} />
                {/* Gold button on top */}
                <div style={{
                  position: 'absolute', top: -5, left: '50%', marginLeft: -2,
                  width: 4, height: 4, background: '#faaf32',
                  borderRadius: '50%', boxShadow: '0 0 4px #faaf32',
                }} />
                {/* Tassel */}
                <div style={{
                  position: 'absolute', top: -3, right: -2,
                  width: 1.5, height: 8, background: '#faaf32',
                  transform: 'rotate(25deg)', transformOrigin: 'top center',
                  borderRadius: 1,
                }} />
                {/* Tassel end */}
                <motion.div
                  animate={hovered ? { x: [0, 2, -1, 0] } : {}}
                  transition={{ duration: 0.6 }}
                  style={{
                    position: 'absolute', top: 5, right: -4,
                    width: 3, height: 4, background: '#faaf32',
                    borderRadius: '50%', boxShadow: '0 0 4px #faaf32',
                  }}
                />
              </motion.div>
              {/* Antenna */}
              <motion.div
                animate={hovered ? { rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                style={{
                  position: 'absolute', top: -12, left: '50%',
                  width: 2, height: 14, background: '#faaf32',
                  transform: 'translateX(-50%)', borderRadius: 1,
                  transformOrigin: 'bottom center',
                }}
              />
              <motion.div
                animate={hovered ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.4 }}
                style={{
                  position: 'absolute', top: -16, left: '50%',
                  width: 6, height: 6, background: '#faaf32',
                  transform: 'translateX(-50%)', borderRadius: '50%',
                  boxShadow: '0 0 10px #faaf32',
                }}
              />
              {/* Blush */}
              <motion.div animate={{ opacity: hovered ? 0.5 : 0.2 }} style={{
                position: 'absolute', bottom: 14, left: 10,
                width: 16, height: 8, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(255,150,100,0.7) 0%, transparent 70%)',
                zIndex: 1, pointerEvents: 'none',
              }} />
              <motion.div animate={{ opacity: hovered ? 0.5 : 0.2 }} style={{
                position: 'absolute', bottom: 14, right: 10,
                width: 16, height: 8, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(255,150,100,0.7) 0%, transparent 70%)',
                zIndex: 1, pointerEvents: 'none',
              }} />
              {/* Eyes */}
              <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 2 }}>
                <motion.div
                  animate={hovered ? { scaleY: 0.2 } : { scaleY: 1 }}
                  transition={{ duration: 0.15 }}
                  style={{ width: 12, height: 12, position: 'relative', transformOrigin: 'center' }}
                >
                  <div style={{ width: 12, height: 12, background: '#faaf32', borderRadius: '50%', boxShadow: '0 0 8px #faaf32, inset 0 0 3px rgba(0,0,0,0.3)' }} />
                  <motion.div animate={{ opacity: hovered ? 0 : 1 }} style={{ position: 'absolute', top: 2, left: 2, width: 3.5, height: 3.5, background: '#fff', borderRadius: '50%' }} />
                </motion.div>
                <motion.div
                  animate={hovered ? { scaleY: 0.2 } : { scaleY: 1 }}
                  transition={{ duration: 0.15 }}
                  style={{ width: 12, height: 12, position: 'relative', transformOrigin: 'center' }}
                >
                  <div style={{ width: 12, height: 12, background: '#faaf32', borderRadius: '50%', boxShadow: '0 0 8px #faaf32, inset 0 0 3px rgba(0,0,0,0.3)' }} />
                  <motion.div animate={{ opacity: hovered ? 0 : 1 }} style={{ position: 'absolute', top: 2, left: 2, width: 3.5, height: 3.5, background: '#fff', borderRadius: '50%' }} />
                </motion.div>
              </div>
              {/* Mouth */}
              <motion.div
                initial={false}
                animate={hovered ? { scaleX: 1, opacity: 0.7 } : { scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute', bottom: 11, left: '50%',
                  width: 16, height: 8, marginLeft: -8,
                  borderBottom: '2px solid rgba(250,175,50,0.7)',
                  borderRadius: '0 0 10px 10px',
                  zIndex: 2,
                }}
              />
            </motion.div>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' }}>
              {hovered ? '(* ^_^ *)' : '鼠标移过来~'}
            </Typography.Text>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center' }}>
              点击头像 → 全屏助手
            </Typography.Text>
          </Col>

          {/* Right: chat area */}
          <Col flex="auto" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Messages */}
            <div
              ref={chatRef}
              style={{
                flex: 1, minHeight: messages.length > 0 ? 180 : 120,
                maxHeight: 280, overflow: 'auto',
                padding: '16px 20px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              {messages.length === 0 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                  <Typography.Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                    <RobotOutlined style={{ color: '#faaf32', marginRight: 6 }} />
                    你好，我是小楷！直接问我高考志愿相关问题：
                  </Typography.Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {SUGGESTED_QUESTIONS.slice(0, 6).map(q => (
                      <Tag
                        key={q}
                        style={{
                          cursor: 'pointer', borderRadius: 12, padding: '2px 12px',
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.7)', fontSize: 12,
                        }}
                        onClick={() => handleQuickAsk(q)}
                      >
                        {q.length > 14 ? q.slice(0, 14) + '…' : q}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%', padding: '6px 12px',
                  borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
                  background: m.role === 'user' ? '#1677ff' : 'rgba(255,255,255,0.08)',
                  color: m.role === 'user' ? '#fff' : 'rgba(255,255,255,0.85)',
                  fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {m.text}
                </div>
              ))}
              {thinking && (
                <div style={{ alignSelf: 'flex-start', padding: '8px 14px', borderRadius: '4px 12px 12px 12px', background: 'rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#666', display: 'inline-block', animation: 'typingBounce 1.4s infinite ease-in-out', marginRight: 2 }} />
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#666', display: 'inline-block', animation: 'typingBounce 1.4s infinite ease-in-out', animationDelay: '0.2s', marginRight: 2 }} />
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#666', display: 'inline-block', animation: 'typingBounce 1.4s infinite ease-in-out', animationDelay: '0.4s' }} />
                </div>
              )}
              {messages.length > 0 && !thinking && (
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <a
                    onClick={() => navigate('/assistant')}
                    style={{
                      color: 'rgba(0,200,230,0.6)', fontSize: 12,
                      cursor: 'pointer', borderBottom: '1px solid rgba(0,200,230,0.2)',
                      paddingBottom: 1,
                    }}
                  >
                    需要更深入的解答？去小楷全屏助手聊聊 →
                  </a>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '10px 20px 14px',
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="输入问题，回车发送..."
                onPressEnter={() => handleSend()}
                variant="borderless"
                style={{
                  flex: 1, borderRadius: 8, fontSize: 13, padding: '4px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                }}
              />
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSend()}
                disabled={!chatInput.trim() || thinking}
                style={{ borderRadius: 14, flexShrink: 0 }}
              />
            </div>
          </Col>
        </Row>
      </Card>
    </FadeInView>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { history } = useAppContext();
  const gansuColleges = collegesData.filter(c => c.province === '甘肃');
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouse({ x: 0.5, y: 0.5 });
  }, []);

  // Parallax offset: convert mouse [0,1] to pixel offset [-range, +range]
  const px = (range) => (mouse.x - 0.5) * range * 2;
  const py = (range) => (mouse.y - 0.5) * range * 2;

  return (
    <div>
      {/* Hero */}
      <div className="pursuing-hero" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        {/* Parallax background layer */}
        <div
          style={{
            position: 'absolute', inset: 0,
            transform: `translate(${px(10)}px, ${py(10)}px)`,
            transition: 'transform 0.6s ease-out',
            zIndex: 0, pointerEvents: 'none',
          }}
        >
          {/* Nebula clouds */}
          {nebulaOrbs.map((orb, i) => (
            <motion.div
              key={`neb-${i}`}
              animate={{
                x: [0, i % 2 === 0 ? 60 : -50, 0],
                y: [0, i % 3 === 0 ? -30 : i % 3 === 1 ? 40 : -20, 0],
                scale: [1, 1.12, 1],
                opacity: [0.4, 0.75, 0.4],
              }}
              transition={{
                duration: orb.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 2,
              }}
              style={{
                position: 'absolute',
                width: orb.size,
                height: orb.size,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${orb.bg} 0%, transparent 70%)`,
                filter: 'blur(80px)',
                top: orb.top,
                left: orb.left,
              }}
            />
          ))}
          {/* Twinkling stars */}
          {stars.map((s, i) => (
            <motion.div
              key={`star-${i}`}
              animate={{ opacity: [0.15, 1, 0.15] }}
              transition={{
                duration: s.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: s.delay,
              }}
              style={{
                position: 'absolute',
                width: s.size,
                height: s.size,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: s.size > 1.5
                  ? '0 0 3px rgba(180,200,255,0.6), 0 0 8px rgba(100,160,255,0.3)'
                  : '0 0 2px rgba(180,200,255,0.4)',
                top: `${s.y}%`,
                left: `${s.x}%`,
              }}
            />
          ))}
          {/* Shooting star */}
          <motion.div
            animate={{
              top: ['-5%', '75%'],
              left: ['85%', '-10%'],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatDelay: 6,
              ease: 'easeIn',
              delay: 3,
            }}
            style={{
              position: 'absolute',
              width: 80, height: 2,
              borderRadius: '50%',
              background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0.8) 100%)',
              filter: 'blur(0.5px)',
              transform: 'rotate(-25deg)',
            }}
          />
          {/* Constellation lines */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
            <line x1="10%" y1="20%" x2="25%" y2="45%" stroke="rgba(180,200,240,0.5)" strokeWidth="0.5" />
            <line x1="25%" y1="45%" x2="40%" y2="15%" stroke="rgba(180,200,240,0.4)" strokeWidth="0.5" />
            <line x1="40%" y1="15%" x2="55%" y2="60%" stroke="rgba(180,200,240,0.3)" strokeWidth="0.5" />
            <line x1="70%" y1="30%" x2="85%" y2="50%" stroke="rgba(180,200,240,0.4)" strokeWidth="0.5" />
            <line x1="85%" y1="50%" x2="75%" y2="70%" stroke="rgba(180,200,240,0.3)" strokeWidth="0.5" />
            <line x1="15%" y1="70%" x2="35%" y2="85%" stroke="rgba(180,200,240,0.35)" strokeWidth="0.5" />
            <line x1="50%" y1="10%" x2="65%" y2="5%" stroke="rgba(180,200,240,0.4)" strokeWidth="0.5" />
            <line x1="20%" y1="55%" x2="8%" y2="35%" stroke="rgba(180,200,240,0.3)" strokeWidth="0.5" />
          </svg>
          {/* Ringed planet */}
          <div style={{
            position: 'absolute', bottom: '8%', right: '10%',
            width: 50, height: 50, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(180,160,220,0.25), rgba(100,80,160,0.10))',
            boxShadow: '0 0 12px rgba(140,120,200,0.15)',
          }} />
          <div style={{
            position: 'absolute', bottom: '6.5%', right: '7.5%',
            width: 68, height: 14, borderRadius: '50%',
            border: '1.5px solid rgba(180,160,220,0.2)',
            transform: 'rotate(-20deg)',
          }} />
        </div>
        <h1>
          {'Pursuing'.split('').map((ch, i) => (
            <motion.span
              key={i}
              className="glass-letter"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 * i, ease: 'easeOut' }}
            >
              {ch}
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="subtitle"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
        >
          位 次 换 算 · 科 学 填 报 · 追 逐 梦 想
        </motion.p>
        <div style={{ position: 'relative', zIndex: 1, marginTop: 28 }}>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/ai-fill')}
            className="hero-cta-btn"
            style={{ padding: '0 40px', height: 44, fontSize: 15, fontWeight: 600, letterSpacing: 1, borderRadius: 8 }}
          >
            开始填报
          </Button>
          <div style={{ marginTop: 12 }}>
            <a
              onClick={() => navigate('/score-match')}
              style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: 2 }}
            >
              或直接匹配院校
            </a>
          </div>
        </div>
        {/* Bottom fade to content */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
            background: 'linear-gradient(180deg, transparent, rgba(8,12,22,0.6))',
            pointerEvents: 'none', zIndex: 0,
          }}
        />
      </div>

      {/* Feature cards */}
      <Typography.Title level={5} className="pursuing-section-title">全部功能</Typography.Title>
      <StaggerCards style={{ marginBottom: 40 }}>
        <Row gutter={[16, 16]}>
          {features.map(f => (
            <Col xs={12} sm={8} md={8} lg={f.key === '/ai-fill' ? 8 : 4} key={f.key}>
              <CardItem>
                <Card
                  hoverable
                  className="pursuing-feature-card"
                  onClick={() => navigate(f.key)}
                  style={{ '--card-accent': f.color, borderTop: `3px solid ${f.color}` }}
                >
                  {f.badge && (
                    <span className="feature-badge" style={{ background: `linear-gradient(135deg, ${f.color}, ${f.color}CC)` }}>
                      {f.badge}
                    </span>
                  )}
                  <div
                    className="feature-icon-circle"
                    style={{ '--accent': f.color, color: f.color }}
                  >
                    {f.icon}
                  </div>
                  <Typography.Title level={5} style={{ marginBottom: 6 }}>{f.title}</Typography.Title>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>{f.desc}</Typography.Text>
                </Card>
              </CardItem>
            </Col>
          ))}
        </Row>
      </StaggerCards>

      {/* 小楷助手 */}
      <XiaoKaiCard navigate={navigate} />

      {/* Stats */}
      <FadeInView>
        <Typography.Title level={5} className="pursuing-section-title">数据概览</Typography.Title>
      </FadeInView>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <FadeInView delay={0}>
            <Card className="pursuing-stat-card">
              <Statistic title="收录院校" value={collegesData.length}
                formatter={v => <CountUp value={v} suffix="所" style={{ color: '#00C8E0', fontWeight: 700, fontSize: 30 }} />} />
            </Card>
          </FadeInView>
        </Col>
        <Col xs={12} sm={6}>
          <FadeInView delay={0.1}>
            <Card className="pursuing-stat-card">
              <Statistic title="收录专业" value={majorsData.length}
                formatter={v => <CountUp value={v} suffix="个" style={{ color: '#7C5CFC', fontWeight: 700, fontSize: 30 }} />} />
            </Card>
          </FadeInView>
        </Col>
        <Col xs={12} sm={6}>
          <FadeInView delay={0.2}>
            <Card className="pursuing-stat-card">
              <Statistic title="录取数据" value={admissionData.length}
                formatter={v => <CountUp value={v} suffix="条" style={{ color: '#52C41A', fontWeight: 700, fontSize: 30 }} />} />
            </Card>
          </FadeInView>
        </Col>
        <Col xs={12} sm={6}>
          <FadeInView delay={0.3}>
            <Card className="pursuing-stat-card">
              <Statistic title="甘肃院校" value={gansuColleges.length}
                formatter={v => <CountUp value={v} suffix="所" style={{ color: '#FA8C16', fontWeight: 700, fontSize: 30 }} />} />
            </Card>
          </FadeInView>
        </Col>
      </Row>

      {/* Recent history */}
      {history.length > 0 && (
        <FadeInView delay={0.4}>
          <div style={{ marginTop: 40 }}>
            <Typography.Title level={5} className="pursuing-section-title">最近浏览</Typography.Title>
            <Row gutter={[12, 12]}>
              {history.slice(0, 4).map(h => (
                <Col xs={24} sm={12} md={6} key={h.id + h.type}>
                  <Card size="small" hoverable onClick={() => navigate(`/${h.type === 'college' ? 'colleges' : 'majors'}/${h.id}`)}>
                    {h.name}
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </FadeInView>
      )}

      <FloatingAssistant />
    </div>
  );
}
