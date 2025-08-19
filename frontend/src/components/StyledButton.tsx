import { Button, ButtonProps } from '@mui/material';
import { styled } from '@mui/system';

interface ButtonProperties extends ButtonProps {
  bgcolor?: string;
  scale: number;
}

const StyledButton = styled(({ bgcolor, scale, ...props }: ButtonProperties) => (
  <Button {...props} />
))(({ bgcolor, scale }) => ({
  background: bgcolor || '#d48e52',
  color: '#fff',
  fontWeight: 500,
  fontSize: 20,
  padding: '12px 28px',
  borderRadius: '12px',
  textTransform: 'none',
  transition: 'all 0.2s ease-in-out',
  boxShadow: '0 3px 6px rgba(0,0,0,0.08)',
  transform: `scale(${scale || 1})`,

  '&:hover': {
  background: bgcolor || '#c77942',
  transform: `scale(${scale * 1.05})`,
  boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
  },

  '&:active': {
    transform: `scale(${scale * 0.97})`,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },

}));


export default StyledButton;
