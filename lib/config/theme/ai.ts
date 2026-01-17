import {
  RobotIcon, SparkleIcon, ChatCircleIcon, PaperPlaneRightIcon,
  CameraIcon, ImageSquareIcon, VideoCameraIcon, WarningIcon, ListIcon
} from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from './base';

// AI 기능
export const AI = {
  bot: { icon: RobotIcon, label: 'AI' },
  sparkle: { icon: SparkleIcon, label: '추천' },
  chat: { icon: ChatCircleIcon },
  send: { icon: PaperPlaneRightIcon },
} as const;

// 미디어 입력
export const MEDIA = {
  camera: { icon: CameraIcon },
  gallery: { icon: ImageSquareIcon },
  video: { icon: VideoCameraIcon },
} as const;

// 챗 상태
export const CHAT_STATUS = {
  warning: { icon: WarningIcon, weight: ICON_WEIGHT.emphasis },
  menu: { icon: ListIcon },
} as const;

// 챗 아이콘 크기
export const CHAT_ICON = {
  avatar: ICON_SIZE.md,
  action: ICON_SIZE.lg,
  input: ICON_SIZE.md,
} as const;
