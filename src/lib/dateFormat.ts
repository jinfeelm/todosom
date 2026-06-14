export function formatKoreanDateHeader(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'long' }).format(date);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일 ${weekday}`;
}

export function getWeekStartDate(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
