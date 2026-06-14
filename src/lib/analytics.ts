type AnalyticsPayload = Record<string, string | number | boolean | null>;

export function trackEvent(name: string, payload: AnalyticsPayload = {}): void {
  if (__DEV__) {
    const sanitized = { ...payload };
    delete sanitized.title;
    delete sanitized.todoTitle;
    console.log(`[analytics] ${name}`, sanitized);
  }
}
