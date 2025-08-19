import React from 'react';
import { Box, List, ListItem, Checkbox, TextField, Typography, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import StyledButton from '../StyledButton';
import { birds } from './BirdList';


interface BirdSelectionListProps {
  selectedBirds: string[];
  onBirdSelect: (bird: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  error: string | null;
  hideButtons?: boolean;
}

export const BirdSelectionList: React.FC<BirdSelectionListProps> = ({
  selectedBirds,
  onBirdSelect,
  searchQuery,
  onSearchChange,
  error
}) => {
  // Filter birds based on search query (case-insensitive)
  const filteredBirds = birds.filter(bird =>
    bird.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
    sx={{
      flex: 1,
      m: 1,
      maxWidth: 340,
      display: 'flex',
      flexDirection: 'column',
    }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white',
          borderRadius: 2,
          px: 2,
          py: 1,
           }}>
        <SearchIcon sx={{ color: '#444', background: 'ffffff' }} />
        <TextField
          fullWidth
          placeholder="Search for species"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          variant="standard"
          InputProps={{
            endAdornment: searchQuery && (
              <IconButton size="small" onClick={() => onSearchChange('')}>
                <ClearIcon />
              </IconButton>
            ),
            disableUnderline: true,
            style: {
              background: 'white',
              borderRadius: 2,
            },
          }}
          sx={{
            bgcolor: 'white',
            borderRadius: 1,
            fontSize: 18,
            fontWeight: 500,
          }}
        />
      </Box>
      <List sx={{ flex: 1, overflowY: 'auto' }}>
        {filteredBirds.map(bird => (
          <ListItem key={bird} sx={{ px: 0 }}>
            <Checkbox
              checked={selectedBirds.includes(bird)}
              onChange={() => onBirdSelect(bird)}
              sx={{ color: '#444' }}
            />
            <Typography sx={{ color: '#444', fontWeight: 500 }}>{bird}</Typography>
          </ListItem>
        ))}
      </List>
      {error && (
        <Typography sx={{ color: 'error.main', mt: 1, mb: 1 }}>{error}</Typography>
      )}
      
    </Box>
  );
}; 