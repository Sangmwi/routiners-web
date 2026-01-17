// 기본 정의
export * from './base';

// 도메인별 테마
export * as navigation from './navigation';
export * as event from './event';
export * as profile from './profile';
export * as ai from './ai';
export * as common from './common';

// 편의 re-export
export { BOTTOM_NAV, HEADER_NAV } from './navigation';
export { EVENT_TYPE, EVENT_STATUS, MEAL_TIME, CALENDAR_ICON, EventIcons, getEventIcon, getEventLabel, getEventConfig, getStatusConfig, getMealTimeConfig } from './event';
export type { EventType, EventStatus, MealTimeType } from './event';
export { MILITARY, BODY_INFO, INBODY, PROFILE_ACTION } from './profile';
export { AI, MEDIA, CHAT_STATUS, CHAT_ICON } from './ai';
export { STATUS, ACTION, CONTROL, SOCIAL, BUTTON_ICON } from './common';
