import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import { Add, Delete, ArrowBack } from '@mui/icons-material';
import { Alarm, RepeatType, TriggerInfo } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';

interface EditViewProps {
  alarm?: Alarm;
  onSave: (alarm: Alarm, content: string) => Promise<void>;
  onCancel: () => void;
}

const getCurrentDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const getCurrentTime = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const dayMap: Record<string, string> = {
  'Monday': '월요일',
  'Tuesday': '화요일',
  'Wednesday': '수요일',
  'Thursday': '목요일',
  'Friday': '금요일',
  'Saturday': '토요일',
  'Sunday': '일요일'
};

const weekMap: Record<string, string> = {
  'First': '첫째 주',
  'Second': '둘째 주',
  'Third': '셋째 주',
  'Fourth': '넷째 주',
  'Last': '마지막 주'
};

const EditView: React.FC<EditViewProps> = ({ alarm, onSave, onCancel }) => {
  const [title, setTitle] = useState(alarm?.title || '');
  const [repeatType, setRepeatType] = useState<RepeatType>(alarm?.repeat_type || 'None');
  const [triggers, setTriggers] = useState<TriggerInfo[]>(
    alarm?.triggers || [{ date: getCurrentDate(), time: getCurrentTime() }]
  );
  const [content, setContent] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
    if (alarm) {
      invoke<string>('read_alarm_content', { id: alarm.id }).then(setContent).catch(console.error);
    }
  }, [alarm]);

  useEffect(() => {
    if (tab === 1) {
      setTimeout(() => mermaid.contentLoaded(), 100);
    }
  }, [tab, content]);

  const handleAddTrigger = () => {
    setTriggers([...triggers, { date: getCurrentDate(), time: getCurrentTime() }]);
  };

  const handleRemoveTrigger = (index: number) => {
    setTriggers(triggers.filter((_, i) => i !== index));
  };

  const handleTriggerChange = (index: number, field: keyof TriggerInfo, value: any) => {
    const newTriggers = [...triggers];
    newTriggers[index] = { ...newTriggers[index], [field]: value };
    setTriggers(newTriggers);
  };

  const renderTriggers = () => {
    if (repeatType === 'None') {
      return (
        <Box>
          {triggers.map((t, i) => (
            <Grid container spacing={2} key={i} alignItems="center" sx={{ mb: 1 }}>
              <Grid size={5}>
                <TextField
                  type="date"
                  fullWidth
                  value={t.date || ''}
                  onChange={(e) => handleTriggerChange(i, 'date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  label="날짜"
                />
              </Grid>
              <Grid size={5}>
                <TextField
                  type="time"
                  fullWidth
                  value={t.time || ''}
                  onChange={(e) => handleTriggerChange(i, 'time', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  label="시간"
                />
              </Grid>
              <Grid size={2}>
                <Tooltip title="날짜/시간 삭제">
                  <span>
                    <IconButton onClick={() => handleRemoveTrigger(i)} disabled={triggers.length === 1} color="error" aria-label="날짜/시간 삭제">
                      <Delete />
                    </IconButton>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>
          ))}
          <Button startIcon={<Add />} onClick={handleAddTrigger} sx={{ mt: 1 }}>날짜/시간 추가</Button>
        </Box>
      );
    }

    if (repeatType === 'Daily') {
      return (
        <TextField
          type="time"
          fullWidth
          value={triggers[0]?.time || ''}
          onChange={(e) => handleTriggerChange(0, 'time', e.target.value)}
          InputLabelProps={{ shrink: true }}
          label="시간"
          sx={{ mt: 2 }}
        />
      );
    }

    if (repeatType === 'Weekly') {
      return (
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>요일</InputLabel>
            <Select
              multiple
              value={triggers[0]?.days_of_week || []}
              onChange={(e) => handleTriggerChange(0, 'days_of_week', e.target.value)}
              label="요일"
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <MenuItem key={day} value={day}>{dayMap[day]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="time"
            fullWidth
            value={triggers[0]?.time || ''}
            onChange={(e) => handleTriggerChange(0, 'time', e.target.value)}
            InputLabelProps={{ shrink: true }}
            label="시간"
          />
        </Box>
      );
    }

    if (repeatType === 'Monthly') {
      return (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>주차</InputLabel>
                <Select
                  value={triggers[0]?.weeks_of_month || ''}
                  onChange={(e) => handleTriggerChange(0, 'weeks_of_month', e.target.value)}
                  label="주차"
                >
                  {['First', 'Second', 'Third', 'Fourth', 'Last'].map(week => (
                    <MenuItem key={week} value={week}>{weekMap[week]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>요일</InputLabel>
                <Select
                  value={triggers[0]?.days_of_week?.[0] || ''}
                  onChange={(e) => handleTriggerChange(0, 'days_of_week', [e.target.value])}
                  label="요일"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <MenuItem key={day} value={day}>{dayMap[day]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                type="time"
                fullWidth
                value={triggers[0]?.time || ''}
                onChange={(e) => handleTriggerChange(0, 'time', e.target.value)}
                InputLabelProps={{ shrink: true }}
                label="시간"
              />
            </Grid>
          </Grid>
        </Box>
      );
    }
  };

  const handleSave = () => {
    const newAlarm: Alarm = {
      id: alarm?.id || uuidv4(),
      title,
      repeat_type: repeatType,
      triggers,
      enabled: alarm?.enabled ?? true,
      order: alarm?.order ?? Date.now(),
    };
    onSave(newAlarm, content);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={onCancel}
          sx={{ color: 'white', mr: 1 }}
          aria-label="뒤로 가기"
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h6">{alarm ? '알람 편집' : '새 알람'}</Typography>
      </Box>

      <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
        <TextField
          autoFocus
          required
          fullWidth
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoComplete="off"
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>반복 주기</InputLabel>
          <Select
            value={repeatType}
            onChange={(e) => {
              setRepeatType(e.target.value as RepeatType);
              setTriggers([{ date: getCurrentDate(), time: getCurrentTime(), days_of_week: [], weeks_of_month: '' }]);
            }}
            label="반복 주기"
          >
            <MenuItem value="None">반복 안함</MenuItem>
            <MenuItem value="Daily">매일</MenuItem>
            <MenuItem value="Weekly">매주</MenuItem>
            <MenuItem value="Monthly">매월</MenuItem>
          </Select>
        </FormControl>

        {renderTriggers()}

        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="마크다운 편집 및 미리보기 탭">
            <Tab label="편집" id="tab-0" aria-controls="tabpanel-0" />
            <Tab label="미리보기" id="tab-1" aria-controls="tabpanel-1" />
          </Tabs>

          <Box
            role="tabpanel"
            hidden={tab !== 0}
            id="tabpanel-0"
            aria-labelledby="tab-0"
            sx={{ mt: 2, minHeight: 200, display: tab === 0 ? 'flex' : 'none', flexDirection: 'column' }}
          >
            <TextField
              multiline
              fullWidth
              minRows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="마크다운을 지원합니다..."
            />
          </Box>
          <Box
            role="tabpanel"
            hidden={tab !== 1}
            id="tabpanel-1"
            aria-labelledby="tab-1"
            sx={{
              mt: 2,
              minHeight: 200,
              display: tab === 1 ? 'flex' : 'none',
              flexDirection: 'column',
              p: 2,
              border: '1px solid #ccc',
              borderRadius: 1,
              flex: 1,
              bgcolor: 'white',
              overflow: 'auto',
              '& table': {
                borderCollapse: 'collapse',
              },
              '& th, & td': {
                border: '1px solid #ccc',
                padding: '8px',
              }
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  if (!inline && match && match[1] === 'mermaid') {
                    return <div className="mermaid">{String(children).replace(/\n$/, '')}</div>;
                  }
                  return !inline ? (
                    <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                      <code className={className} {...props}>{children}</code>
                    </pre>
                  ) : (
                    <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }} {...props}>{children}</code>
                  );
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} variant="outlined">취소</Button>
        <Tooltip title={!title ? '제목을 입력해주세요' : ''}>
          <span>
            <Button onClick={handleSave} variant="contained" disabled={!title}>저장</Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default EditView;
