import { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, List, ListItem, Avatar, Chip, IconButton, Collapse } from '@mui/material';
import { Send, SmartToy, Person, Close, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { sendAIChat } from '../../lib/api/financialApi';
import { AIChatResponse } from '../../types/financial';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
}

interface AIChatSectionProps {
  floating?: boolean;
  minimized?: boolean;
  onMinimize?: () => void;
  onClose?: () => void;
}

const QUICK_QUESTIONS = [
  'How much did I spend this month?',
  'What are my top spending categories?',
  'Show me unusual transactions',
  'How can I save money?',
];

export default function AIChatSection({ floating = false, minimized = false, onMinimize, onClose }: AIChatSectionProps) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(minimized);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleQuickQuestion = (question: string) => {
    setInput(question);
    // Auto-send quick questions
    setTimeout(() => {
      const userMessage: Message = { role: 'user', content: question };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      handleSendMessage(question);
    }, 100);
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || loading) return;

    setLoading(true);
    try {
      const response: AIChatResponse = await sendAIChat({ query: textToSend });
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        data: response.data,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    const textToSend = input;
    setInput('');
    handleSendMessage(textToSend);
  };

  if (floating && isMinimized) {
    return (
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: { xs: 100, sm: 24 },
          right: { xs: 16, sm: 100 },
          zIndex: 1000,
          borderRadius: 3,
          overflow: 'hidden',
          minWidth: { xs: 'calc(100vw - 32px)', sm: 300 },
          maxWidth: { xs: 'calc(100vw - 32px)', sm: 400 },
        }}
      >
        <Box
          sx={{
            p: 2,
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setIsMinimized(false)}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && setIsMinimized(false)}
          aria-label="Expand AI chat assistant"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              AI Assistant
            </Typography>
          </Box>
          {onClose && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              sx={{ color: 'white' }}
              aria-label="Close chat"
            >
              <Close />
            </IconButton>
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: floating ? '600px' : '100%',
        ...(floating && {
          position: 'fixed',
          bottom: { xs: 100, sm: 24 },
          right: { xs: 16, sm: 100 },
          zIndex: 1000,
          width: { xs: 'calc(100vw - 32px)', sm: '400px' },
          maxWidth: { xs: 'calc(100vw - 32px)', sm: 'calc(100vw - 120px)' },
        }),
      }}
    >
      <Paper
        elevation={floating ? 8 : 1}
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: theme.palette.background.paper,
          borderRadius: floating ? 3 : 1,
          borderTopLeftRadius: floating ? 3 : 1,
          borderTopRightRadius: floating ? 3 : 1,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              AI Financial Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ask questions about your finances
            </Typography>
          </Box>
          {floating && (
            <Box>
              {onMinimize && (
                <IconButton
                  size="small"
                  onClick={() => {
                    setIsMinimized(true);
                    onMinimize();
                  }}
                  aria-label="Minimize chat"
                >
                  <ExpandMore />
                </IconButton>
              )}
              {onClose && (
                <IconButton size="small" onClick={onClose} aria-label="Close chat">
                  <Close />
                </IconButton>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      <Paper
        elevation={floating ? 8 : 1}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: theme.palette.background.paper,
          borderRadius: floating ? '0 0 12px 12px' : 1,
        }}
      >
        <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {messages.length === 0 && (
            <Box>
              <ListItem>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                  Start a conversation by asking a question about your finances, or try one of these:
                </Typography>
              </ListItem>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, px: 2 }}>
                {QUICK_QUESTIONS.map((question, index) => (
                  <Chip
                    key={index}
                    label={question}
                    onClick={() => handleQuickQuestion(question)}
                    sx={{
                      justifyContent: 'flex-start',
                      height: 'auto',
                      py: 1.5,
                      '& .MuiChip-label': {
                        whiteSpace: 'normal',
                        textAlign: 'left',
                      },
                    }}
                    variant="outlined"
                    aria-label={`Ask: ${question}`}
                  />
                ))}
              </Box>
            </Box>
          )}
          {messages.map((message, index) => (
            <ListItem
              key={index}
              sx={{
                display: 'flex',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <Avatar sx={{ bgcolor: message.role === 'user' ? theme.palette.primary.main : theme.palette.secondary.main }}>
                {message.role === 'user' ? <Person /> : <SmartToy />}
              </Avatar>
              <Box
                sx={{
                  maxWidth: '70%',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: message.role === 'user' ? theme.palette.primary.main : (theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6'),
                  color: message.role === 'user' ? (theme.palette.mode === 'dark' ? '#000000' : 'white') : theme.palette.text.primary,
                }}
              >
                <Typography variant="body1">{message.content}</Typography>
                {message.data && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                    {message.data.total_spending_30_days && (
                      <Typography variant="body2">
                        Total Spending (30 days): Rs. {message.data.total_spending_30_days.toFixed(2)}
                      </Typography>
                    )}
                    {message.data.transaction_count && (
                      <Typography variant="body2">
                        Transactions: {message.data.transaction_count}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </ListItem>
          ))}
          {loading && (
            <ListItem>
              <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                <SmartToy />
              </Avatar>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Thinking...
              </Typography>
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ask a question about your finances..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading}
            aria-label="Chat input"
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            startIcon={<Send />}
            aria-label="Send message"
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}



