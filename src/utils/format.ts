import { Alarm } from '../types';

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

export const formatSchedule = (alarm: Alarm): string => {
  if (!alarm.triggers || alarm.triggers.length === 0) return '일정 없음';
  
  const type = alarm.repeat_type;
  if (type === 'None') {
    const ts = alarm.triggers;
    if (ts.length === 1) {
      return `${ts[0].date} ${ts[0].time}`;
    }
    return `${ts.length}개의 날짜`;
  }

  if (type === 'Daily') {
    return `매일 ${alarm.triggers[0].time}`;
  }

  if (type === 'Weekly') {
    const t = alarm.triggers[0];
    const days = t.days_of_week?.map(d => dayMap[d] || d).join(', ');
    return `매주 ${days} ${t.time}`;
  }

  if (type === 'Monthly') {
    const t = alarm.triggers[0];
    const week = t.weeks_of_month ? (weekMap[t.weeks_of_month] || t.weeks_of_month) : '';
    const day = t.days_of_week?.[0] ? (dayMap[t.days_of_week[0]] || t.days_of_week[0]) : '';
    return `매월 ${week} ${day} ${t.time}`;
  }

  return '알 수 없는 일정';
};
