import { IconButton } from '@mui/material';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';

interface FloatingChatButtonProps {
  onClick: () => void;
}

export default function FloatingChatButton({ onClick }: FloatingChatButtonProps) {
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 48,
        height: 48,
        bgcolor: '#6D28D9',
        color: '#FFFFFF',
        boxShadow: '0 10px 15px rgba(109, 40, 217, 0.3)',
        '&:hover': {
          bgcolor: '#7C3AED',
          transform: 'scale(1.1)',
        },
        transition: 'all 0.2s',
      }}
    >
      <QuestionAnswerIcon />
    </IconButton>
  );
}

