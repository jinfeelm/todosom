export function shouldRolloverMist(lastRolloverDate: string | null, today: string): boolean {
  if (!lastRolloverDate) {
    return true;
  }
  return lastRolloverDate < today;
}

export function isMistEligibleTodo(dueDate: string, status: string, today: string): boolean {
  return dueDate < today && status === 'open';
}
