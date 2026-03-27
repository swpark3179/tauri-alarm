import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Switch,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Divider,
  Fab
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  Edit,
  Delete,
  Add
} from '@mui/icons-material';
import { Alarm } from '../types';
import { formatSchedule } from '../utils/format';

interface ListViewProps {
  alarms: Alarm[];
  loading: boolean;
  onEdit: (alarm?: Alarm) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
}

const ListView: React.FC<ListViewProps> = ({
  alarms,
  loading,
  onEdit,
  onDelete,
  onToggle,
  onReorder,
}) => {
  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6">알람 목록</Typography>
        {loading && <CircularProgress size={24} color="inherit" />}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 1, bgcolor: 'background.default' }}>
        {alarms.length === 0 && !loading && (
          <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
            등록된 알람이 없습니다.
          </Typography>
        )}
        <List>
          {alarms.map((alarm, index) => (
            <Paper key={alarm.id} sx={{ mb: 1, p: 1 }}>
              <ListItem
                disablePadding
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Switch
                      edge="end"
                      checked={alarm.enabled}
                      onChange={(e) => onToggle(alarm.id, e.target.checked)}
                      disabled={loading}
                    />
                    <IconButton onClick={() => onEdit(alarm)} disabled={loading}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => onDelete(alarm.id)} disabled={loading} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', mr: 1 }}>
                  <IconButton
                    size="small"
                    disabled={index === 0 || loading}
                    onClick={() => onReorder(alarm.id, 'up')}
                  >
                    <ArrowUpward fontSize="inherit" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={index === alarms.length - 1 || loading}
                    onClick={() => onReorder(alarm.id, 'down')}
                  >
                    <ArrowDownward fontSize="inherit" />
                  </IconButton>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <ListItemText
                  primary={<Typography variant="subtitle1" fontWeight="bold">{alarm.title}</Typography>}
                  secondary={formatSchedule(alarm)}
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      </Box>

      <Fab
        color="secondary"
        aria-label="add"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
        onClick={() => onEdit()}
        disabled={loading}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default ListView;
