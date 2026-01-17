/**
 * 이벤트 테마 설정 (Phosphor Icons 기반)
 *
 * 이 파일은 하위 호환성을 위해 theme/event.ts를 re-export합니다.
 * 새로운 코드에서는 '@/lib/config/theme'에서 직접 import하세요.
 */

// Re-export from new theme system
export {
  EVENT_TYPE as EVENT_TYPE_CONFIG,
  EVENT_STATUS as EVENT_STATUS_CONFIG,
  getEventIcon,
  getEventLabel,
  getStatusConfig,
} from './theme/event';

export type { EventType, EventStatus } from './theme/event';
