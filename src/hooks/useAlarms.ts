import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Alarm } from '../types';

export function useAlarms() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlarms = async () => {
    setLoading(true);
    try {
      // Use window.__TAURI_INTERNALS__ to check if Tauri is available
      if (window.__TAURI_INTERNALS__) {
        const data = await invoke<Alarm[]>('read_alarms');
        setAlarms(data.sort((a, b) => a.order - b.order));
      } else {
        // Mock data for development when running outside Tauri
        setAlarms([]);
      }
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const saveAlarms = async (newAlarms: Alarm[]) => {
    setLoading(true);
    try {
      await invoke('write_alarms', { alarms: newAlarms });
      setAlarms(newAlarms);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const deleteAlarm = async (id: string) => {
    setLoading(true);
    try {
      try {
        await invoke('unregister_task', { id });
      } catch (e) {
        console.warn('Failed to unregister task, skipping:', e);
      }
      try {
        await invoke('delete_alarm_content', { id });
      } catch (e) {
        console.warn('Failed to delete alarm content, skipping:', e);
      }
      const newAlarms = alarms.filter((a) => a.id !== id);
      await saveAlarms(newAlarms);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleAlarm = async (id: string, enabled: boolean) => {
    setLoading(true);
    try {
      if (enabled) {
        await invoke('enable_task', { id });
      } else {
        await invoke('disable_task', { id });
      }
      const newAlarms = alarms.map((a) => (a.id === id ? { ...a, enabled } : a));
      await saveAlarms(newAlarms);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const reorderAlarms = async (id: string, direction: 'up' | 'down') => {
    const alarm = alarms.find((a) => a.id === id);
    if (!alarm) return;

    const isOneTime = alarm.repeat_type === 'None';
    const groupAlarms = alarms.filter((a) => (a.repeat_type === 'None') === isOneTime);

    const groupIndex = groupAlarms.findIndex((a) => a.id === id);
    if (groupIndex < 0) return;
    if (direction === 'up' && groupIndex === 0) return;
    if (direction === 'down' && groupIndex === groupAlarms.length - 1) return;

    const swapWith = groupAlarms[direction === 'up' ? groupIndex - 1 : groupIndex + 1];

    const index = alarms.findIndex((a) => a.id === alarm.id);
    const swapIndex = alarms.findIndex((a) => a.id === swapWith.id);

    const newAlarms = [...alarms];
    
    // Swap order property
    const tempOrder = newAlarms[index].order;
    newAlarms[index].order = newAlarms[swapIndex].order;
    newAlarms[swapIndex].order = tempOrder;

    // Resort the array
    newAlarms.sort((a, b) => a.order - b.order);

    await saveAlarms(newAlarms);
  };

  useEffect(() => {
    fetchAlarms();
  }, []);

  return { alarms, loading, error, fetchAlarms, saveAlarms, deleteAlarm, toggleAlarm, reorderAlarms };
}
