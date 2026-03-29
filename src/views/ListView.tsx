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
  Fab,
  Tooltip
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
  const oneTimeAlarms = alarms.filter((a) => a.repeat_type === 'None');
  const periodicAlarms = alarms.filter((a) => a.repeat_type !== 'None');

  const renderAlarmList = (alarmList: Alarm[], title: string) => {
    if (alarmList.length === 0) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, ml: 1, fontWeight: 'bold' }}>
          {title}
        </Typography>
        <List disablePadding>
          {alarmList.map((alarm, index) => (
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
                      inputProps={{ 'aria-label': '알람 활성화 상태 변경' }}
                    />
                    <Tooltip title="알람 편집">
                      <span>
                        <IconButton onClick={() => onEdit(alarm)} disabled={loading} aria-label="알람 편집">
                          <Edit fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="알람 삭제">
                      <span>
                        <IconButton onClick={() => onDelete(alarm.id)} disabled={loading} color="error" aria-label="알람 삭제">
                          <Delete fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                }
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', mr: 1 }}>
                  <Tooltip title="순서 위로 이동">
                    <span>
                      <IconButton
                        size="small"
                        disabled={index === 0 || loading}
                        onClick={() => onReorder(alarm.id, 'up')}
                        aria-label="순서 위로 이동"
                      >
                        <ArrowUpward fontSize="inherit" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="순서 아래로 이동">
                    <span>
                      <IconButton
                        size="small"
                        disabled={index === alarmList.length - 1 || loading}
                        onClick={() => onReorder(alarm.id, 'down')}
                        aria-label="순서 아래로 이동"
                      >
                        <ArrowDownward fontSize="inherit" />
                      </IconButton>
                    </span>
                  </Tooltip>
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
    );
  };

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

        {renderAlarmList(oneTimeAlarms, '1회성 알림')}

        {oneTimeAlarms.length > 0 && periodicAlarms.length > 0 && (
          <Divider sx={{ my: 2 }} />
        )}

        {renderAlarmList(periodicAlarms, '주기적 알림')}
      </Box>

      <Tooltip title="새 알람 추가" placement="left">
        <span>
          <Fab
            color="secondary"
            aria-label="새 알람 추가"
            sx={{ position: 'absolute', bottom: 16, right: 16 }}
            onClick={() => onEdit()}
            disabled={loading}
          >
            <Add />
          </Fab>
        </span>
      </Tooltip>
    </Box>
  );
};

export default ListView;
