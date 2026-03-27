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
  Grid,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
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

const EditView: React.FC<EditViewProps> = ({ alarm, onSave, onCancel }) => {
  const [title, setTitle] = useState(alarm?.title || '');
  const [repeatType, setRepeatType] = useState<RepeatType>(alarm?.repeat_type || 'None');
  const [triggers, setTriggers] = useState<TriggerInfo[]>(
    alarm?.triggers || [{ date: '', time: '' }]
  );
  const [content, setContent] = useState('');
  const [tab, setTab] = useState(0);

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
    setTriggers([...triggers, { date: '', time: '' }]);
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
                  label="Date"
                />
              </Grid>
              <Grid size={5}>
                <TextField
                  type="time"
                  fullWidth
                  value={t.time || ''}
                  onChange={(e) => handleTriggerChange(i, 'time', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  label="Time"
                />
              </Grid>
              <Grid size={2}>
                <IconButton onClick={() => handleRemoveTrigger(i)} disabled={triggers.length === 1} color="error">
                  <Delete />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Button startIcon={<Add />} onClick={handleAddTrigger} sx={{ mt: 1 }}>Add Date/Time</Button>
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
          label="Time"
          sx={{ mt: 2 }}
        />
      );
    }

    if (repeatType === 'Weekly') {
      return (
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Day of Week</InputLabel>
            <Select
              multiple
              value={triggers[0]?.days_of_week || []}
              onChange={(e) => handleTriggerChange(0, 'days_of_week', e.target.value)}
              label="Day of Week"
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <MenuItem key={day} value={day}>{day}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="time"
            fullWidth
            value={triggers[0]?.time || ''}
            onChange={(e) => handleTriggerChange(0, 'time', e.target.value)}
            InputLabelProps={{ shrink: true }}
            label="Time"
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
                <InputLabel>Week of Month</InputLabel>
                <Select
                  value={triggers[0]?.weeks_of_month || ''}
                  onChange={(e) => handleTriggerChange(0, 'weeks_of_month', e.target.value)}
                  label="Week of Month"
                >
                  {['First', 'Second', 'Third', 'Fourth', 'Last'].map(week => (
                    <MenuItem key={week} value={week}>{week}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  value={triggers[0]?.days_of_week?.[0] || ''}
                  onChange={(e) => handleTriggerChange(0, 'days_of_week', [e.target.value])}
                  label="Day of Week"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
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
                label="Time"
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
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6">{alarm ? 'Edit Alarm' : 'New Alarm'}</Typography>
      </Box>

      <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Repeat Type</InputLabel>
          <Select
            value={repeatType}
            onChange={(e) => {
              setRepeatType(e.target.value as RepeatType);
              setTriggers([{ date: '', time: '', days_of_week: [], weeks_of_month: '' }]);
            }}
            label="Repeat Type"
          >
            <MenuItem value="None">None</MenuItem>
            <MenuItem value="Daily">Daily</MenuItem>
            <MenuItem value="Weekly">Weekly</MenuItem>
            <MenuItem value="Monthly">Monthly</MenuItem>
          </Select>
        </FormControl>

        {renderTriggers()}

        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Edit" />
            <Tab label="Preview" />
          </Tabs>

          <Box sx={{ mt: 2, minHeight: 200, display: 'flex', flexDirection: 'column' }}>
            {tab === 0 ? (
              <TextField
                multiline
                fullWidth
                minRows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Markdown is supported..."
              />
            ) : (
              <Box sx={{
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
              }}>
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
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} variant="outlined">Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!title}>Save</Button>
      </Box>
    </Box>
  );
};

export default EditView;
