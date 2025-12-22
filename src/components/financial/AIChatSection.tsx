import { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, List, ListItem, Avatar } from '@mui/material';
import { Send, SmartToy, Person } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { sendAIChat } from '../../lib/api/financialApi';
import { AIChatResponse } from '../../types/financial';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
}

export default function AIChatSection() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response: AIChatResponse = await sendAIChat({ query: input });
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: theme.palette.background.paper }}>
        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>AI Financial Assistant</Typography>
        <Typography variant="body2" color="text.secondary">
          Ask questions about your finances
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: theme.palette.background.paper }}>
        <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {messages.length === 0 && (
            <ListItem>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Start a conversation by asking a question about your finances...
              </Typography>
            </ListItem>
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
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            startIcon={<Send />}
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
