import type { DayPeriod } from '@/lib/dayPeriod';

const ROOM_BACKGROUNDS: Record<DayPeriod, number> = {
  morning: require('@/assets/rooms/default_room/background_morning.png'),
  afternoon: require('@/assets/rooms/default_room/background_afternoon.png'),
  night: require('@/assets/rooms/default_room/background_night.png'),
};

export function getRoomBackground(period: DayPeriod): number {
  return ROOM_BACKGROUNDS[period];
}
