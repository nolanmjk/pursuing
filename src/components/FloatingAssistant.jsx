import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Input, Space, Tag, Typography } from 'antd';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { QA_KNOWLEDGE, SUGGESTED_QUESTIONS, findBestMatch, personalizeAnswer } from '../utils/qaAssistant';
import { aiChat, buildUserContext } from '../utils/aiChat';

const ROBOT_TAGS = [
  { label: '平行志愿', cat: '平行志愿' },
  { label: '位次法', cat: '位次法' },
  { label: '冲稳保', cat: '冲稳保' },
  { label: '省控线', cat: '批次线' },
  { label: '专业组', cat: '院校专业组' },
  { label: '调剂', cat: '填报技巧' },
];

const GREETINGS = [
  '你好！我是小楷，高考志愿相关问题都可以问我~',
  '平行志愿怎么投档？位次怎么换算？来问我吧！',
  '退档和滑档有什么区别？点我马上知道~',
  '冲稳保怎么分配？45个志愿怎么填？我帮你分析！',
];

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [aiOnline, setAiOnline] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [greeting, setGreeting] = useState(GREETINGS[0]);
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [bubbleIdx, setBubbleIdx] = useState(0);
  const listRef = useRef(null);
  const historyRef = useRef([]);
  const bubbleTimerRef = useRef(null);
  const ctx = useAppContext();

  // Auto-cycle greeting messages
  useEffect(() => {
    if (!bubbleVisible || open) return;
    bubbleTimerRef.current = setInterval(() => {
      setBubbleIdx(prev => (prev + 1) % GREETINGS.length);
    }, 4000);
    return () => clearInterval(bubbleTimerRef.current);
  }, [bubbleVisible, open]);

  // Auto-dismiss bubble after 12s
  useEffect(() => {
    const timer = setTimeout(() => setBubbleVisible(false), 12000);
    return () => clearTimeout(timer);
  }, []);

  const handleRobotClick = () => {
    setBubbleVisible(false);
    setOpen(!open);
  };

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const replyWithFallback = useCallback(async (userMsg) => {
    const userCtx = buildUserContext(ctx);

    // Try AI first
    if (aiOnline) {
      historyRef.current.push({ role: 'user', content: userMsg + userCtx });
      // Keep last 10 messages for context
      if (historyRef.current.length > 20) {
        historyRef.current = historyRef.current.slice(-20);
      }

      const aiReply = await aiChat(historyRef.current);

      if (aiReply) {
        historyRef.current.push({ role: 'assistant', content: aiReply });
        setMessages(prev => [...prev, { role: 'bot', text: aiReply, id: Date.now() }]);
        setTyping(false);
        return;
      }
      // AI failed — mark offline and fall through to keyword
      setAiOnline(false);
    }

    // Keyword fallback
    const match = findBestMatch(userMsg);
    const userCtxObj = { userScore: ctx.userScore, userRank: ctx.userRank, userSubject: ctx.userSubject };
    if (match) {
      setMessages(prev => [...prev, { role: 'bot', text: personalizeAnswer(match.answer, userCtxObj), id: Date.now() }]);
    } else {
      const fallback = '我主要解答甘肃高考志愿填报相关问题，试试问我：平行志愿规则、位次换算、冲稳保策略、退档滑档区别、院校专业组、调剂建议等。';
      setMessages(prev => [...prev, { role: 'bot', text: personalizeAnswer(fallback, userCtxObj), id: Date.now() }]);
    }
    setTyping(false);
  }, [aiOnline, ctx]);

  const handleSend = useCallback((text) => {
    const msg = (text || input).trim();
    if (!msg || typing) return;
    setMessages(prev => [...prev, { role: 'user', text: msg, id: Date.now() }]);
    setInput('');
    setTyping(true);
    replyWithFallback(msg);
  }, [input, typing, replyWithFallback]);

  const handleTagClick = useCallback((cat) => {
    const items = QA_KNOWLEDGE.filter(q => q.category === cat);
    if (items.length > 0) {
      setMessages(prev => [...prev, { role: 'user', text: items[0].question, id: Date.now() }]);
      setTyping(true);
      replyWithFallback(items[0].question);
    }
  }, [replyWithFallback]);

  return (
    <>
      {/* Greeting speech bubble */}
      <AnimatePresence>
        {(hovered || bubbleVisible) && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              bottom: 156,
              right: 24,
              zIndex: 1000,
              maxWidth: 240,
              background: '#fff',
              borderRadius: 14,
              padding: '12px 16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              cursor: 'pointer',
              fontSize: 13,
              color: '#333',
              lineHeight: 1.6,
            }}
            onClick={handleRobotClick}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={hovered ? `h-${greeting}` : bubbleIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                {hovered ? greeting : GREETINGS[bubbleIdx]}
              </motion.div>
            </AnimatePresence>
            {/* Triangle arrow pointing down to robot */}
            <div style={{
              position: 'absolute', bottom: -8, right: 16,
              width: 0, height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid #fff',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.06))',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating robot button */}
      <motion.div
        style={{
          position: 'fixed',
          bottom: 88,
          right: 24,
          zIndex: 1000,
          width: 60,
          height: 60,
          borderRadius: 30,
          background: 'linear-gradient(135deg, #0a1628 0%, #1a3a5c 100%)',
          boxShadow: '0 4px 20px rgba(0,20,50,0.4), 0 0 0 2px rgba(250,175,50,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}
        animate={hovered ? {
          y: 0, boxShadow: [
            '0 4px 20px rgba(0,20,50,0.4), 0 0 0 2px rgba(250,175,50,0.3)',
            '0 4px 24px rgba(0,20,50,0.5), 0 0 0 3px rgba(250,175,50,0.5), 0 0 36px rgba(250,175,50,0.12)',
            '0 4px 20px rgba(0,20,50,0.4), 0 0 0 2px rgba(250,175,50,0.3)',
          ],
        } : {
          y: [0, -3, 0],
          boxShadow: [
            '0 4px 20px rgba(0,20,50,0.4), 0 0 0 2px rgba(250,175,50,0.3)',
            '0 4px 24px rgba(0,20,50,0.5), 0 0 0 3px rgba(250,175,50,0.5), 0 0 36px rgba(250,175,50,0.12)',
            '0 4px 20px rgba(0,20,50,0.4), 0 0 0 2px rgba(250,175,50,0.3)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        onMouseEnter={() => { setHovered(true); setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]); }}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleRobotClick}
      >
        {/* Antenna */}
        <div style={{
          position: 'absolute', top: -12, left: '50%',
          width: 2, height: 14, background: '#faaf32',
          transform: 'translateX(-50%)', borderRadius: 1,
        }} />
        <motion.div animate={hovered ? { rotate: [0, -15, 15, -10, 10, 0], x: '-50%' } : { rotate: 0, x: '-50%' }} transition={{ duration: 0.5 }} style={{
          position: 'absolute', top: -16, left: '50%',
          width: 7, height: 7, background: '#faaf32',
          borderRadius: '50%',
          boxShadow: '0 0 10px #faaf32',
        }} />
        {/* Blush */}
        <motion.div animate={{ opacity: hovered ? 0.45 : 0.18 }} style={{
          position: 'absolute', bottom: 10, left: 6,
          width: 12, height: 6, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,150,100,0.7) 0%, transparent 70%)',
          zIndex: 1, pointerEvents: 'none',
        }} />
        <motion.div animate={{ opacity: hovered ? 0.45 : 0.18 }} style={{
          position: 'absolute', bottom: 10, right: 6,
          width: 12, height: 6, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,150,100,0.7) 0%, transparent 70%)',
          zIndex: 1, pointerEvents: 'none',
        }} />
        {/* Eyes */}
        <div style={{ display: 'flex', gap: 9, position: 'relative', zIndex: 2 }}>
          <motion.div animate={{ scaleY: hovered ? 0.2 : 1 }} transition={{ duration: 0.15 }} style={{ width: 11, height: 11, position: 'relative', transformOrigin: 'center' }}>
            <div style={{ width: 11, height: 11, background: '#faaf32', borderRadius: '50%', boxShadow: '0 0 7px #faaf32, inset 0 0 2px rgba(0,0,0,0.3)' }} />
            <motion.div animate={{ opacity: hovered ? 0 : 1 }} style={{ position: 'absolute', top: 2, left: 2, width: 3, height: 3, background: '#fff', borderRadius: '50%' }} />
          </motion.div>
          <motion.div animate={{ scaleY: hovered ? 0.2 : 1 }} transition={{ duration: 0.15, delay: hovered ? 0.12 : 0 }} style={{ width: 11, height: 11, position: 'relative', transformOrigin: 'center' }}>
            <div style={{ width: 11, height: 11, background: '#faaf32', borderRadius: '50%', boxShadow: '0 0 7px #faaf32, inset 0 0 2px rgba(0,0,0,0.3)' }} />
            <motion.div animate={{ opacity: hovered ? 0 : 1 }} style={{ position: 'absolute', top: 2, left: 2, width: 3, height: 3, background: '#fff', borderRadius: '50%' }} />
          </motion.div>
        </div>
        {/* Mouth */}
        <motion.div
          initial={false}
          animate={hovered ? { scaleX: 1, opacity: 0.7 } : { scaleX: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute', bottom: 8, left: '50%',
            width: 12, height: 6, marginLeft: -6,
            borderBottom: '1.5px solid rgba(250,175,50,0.7)',
            borderRadius: '0 0 8px 8px',
            zIndex: 2,
          }}
        />
      </motion.div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', bottom: 156, right: 24, zIndex: 1000,
              width: 380, height: 520, background: '#fff', borderRadius: 16,
              boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0a1628 0%, #1a3a5c 100%)',
              padding: '12px 16px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 18,
                  background: 'linear-gradient(135deg, #1a3a5c 0%, #0a1628 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                }}>
                  <div style={{ position: 'absolute', top: -4, left: '50%', width: 1, height: 5, background: '#faaf32', transform: 'translateX(-50%)', borderRadius: 1 }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ width: 5, height: 5, background: '#faaf32', borderRadius: '50%' }} />
                    <div style={{ width: 5, height: 5, background: '#faaf32', borderRadius: '50%' }} />
                  </div>
                </div>
                <div>
                  <Typography.Text strong style={{ color: '#fff', fontSize: 15 }}>
                    小楷 {aiOnline && <span style={{ fontSize: 10, color: '#52C41A', marginLeft: 4 }}>AI</span>}
                  </Typography.Text>
                  <Typography.Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, display: 'block' }}>高考志愿答疑助手</Typography.Text>
                </div>
              </div>
              <Button type="text" icon={<CloseOutlined />} onClick={() => setOpen(false)} style={{ color: 'rgba(255,255,255,0.7)' }} size="small" />
            </div>

            {/* Messages */}
            <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f7f8fa' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 32, margin: '0 auto 12px',
                    background: 'linear-gradient(135deg, #0a1628 0%, #1a3a5c 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  }}>
                    <div style={{ position: 'absolute', top: -8, left: '50%', width: 2, height: 10, background: '#faaf32', transform: 'translateX(-50%)', borderRadius: 1 }} />
                    <div style={{ position: 'absolute', top: -12, left: '50%', width: 5, height: 5, background: '#faaf32', transform: 'translateX(-50%)', borderRadius: '50%', boxShadow: '0 0 6px #faaf32' }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div style={{ width: 10, height: 10, background: '#faaf32', borderRadius: '50%', boxShadow: '0 0 6px #faaf32' }} />
                      <div style={{ width: 10, height: 10, background: '#faaf32', borderRadius: '50%', boxShadow: '0 0 6px #faaf32' }} />
                    </div>
                  </div>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    你好！我是小楷，你的高考志愿AI助手
                  </Typography.Text>
                  <div style={{ marginTop: 12 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>试试这些问题：</Typography.Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, justifyContent: 'center' }}>
                      {SUGGESTED_QUESTIONS.map(q => (
                        <Tag key={q} style={{ cursor: 'pointer', padding: '2px 10px', borderRadius: 12, fontSize: 12 }} color="blue" onClick={() => handleSend(q)}>
                          {q.length > 18 ? q.slice(0, 18) + '...' : q}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map(m => (
                <div key={m.id} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%', padding: '8px 14px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                  background: m.role === 'user' ? '#1677ff' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#333',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {m.text}
                </div>
              ))}

              {typing && (
                <div style={{ alignSelf: 'flex-start', padding: '10px 16px', borderRadius: '4px 16px 16px 16px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#bbb', display: 'inline-block', animation: 'typingBounce 1.4s infinite ease-in-out', marginRight: 3 }} />
                  <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#bbb', display: 'inline-block', animation: 'typingBounce 1.4s infinite ease-in-out', animationDelay: '0.2s', marginRight: 3 }} />
                  <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#bbb', display: 'inline-block', animation: 'typingBounce 1.4s infinite ease-in-out', animationDelay: '0.4s' }} />
                </div>
              )}
            </div>

            {/* Tags */}
            <div style={{ padding: '6px 14px', borderTop: '1px solid #f0f0f0', display: 'flex', flexWrap: 'wrap', gap: 4, flexShrink: 0 }}>
              {ROBOT_TAGS.map(t => (
                <Tag key={t.label} style={{ cursor: 'pointer', fontSize: 11, borderRadius: 10 }} onClick={() => handleTagClick(t.cat)}>{t.label}</Tag>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: '8px 14px 12px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input placeholder="输入问题..." value={input} onChange={e => setInput(e.target.value)} onPressEnter={() => handleSend()} style={{ borderRadius: '20px 0 0 20px' }} size="small" />
                <Button type="primary" icon={<SendOutlined />} onClick={() => handleSend()} style={{ borderRadius: '0 20px 20px 0' }} size="small" />
              </Space.Compact>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
