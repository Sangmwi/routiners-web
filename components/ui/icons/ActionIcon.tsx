'use client';

import { ICON_SIZE, ACTION } from '@/lib/config/theme';

type ActionType = keyof typeof ACTION;
type ActionSize = keyof typeof ICON_SIZE;

interface ActionIconProps {
  /** Action type */
  action: ActionType;
  /** Size preset from theme */
  size?: ActionSize;
  /** Additional CSS classes */
  className?: string;
}

export default function ActionIcon({
  action,
  size = 'md',
  className = '',
}: ActionIconProps) {
  const config = ACTION[action];
  const Icon = config.icon;
  const pixelSize = ICON_SIZE[size];

  return <Icon size={pixelSize} className={className} />;
}

// Convenience exports
type ConvenienceProps = Omit<ActionIconProps, 'action'>;

export function CloseIcon(props: ConvenienceProps) {
  return <ActionIcon action="close" {...props} />;
}

export function AddIcon(props: ConvenienceProps) {
  return <ActionIcon action="add" {...props} />;
}

export function DeleteIcon(props: ConvenienceProps) {
  return <ActionIcon action="delete" {...props} />;
}

export function RefreshIcon(props: ConvenienceProps) {
  return <ActionIcon action="refresh" {...props} />;
}

export function SearchIcon(props: ConvenienceProps) {
  return <ActionIcon action="search" {...props} />;
}

export function MoreIcon(props: ConvenienceProps) {
  return <ActionIcon action="more" {...props} />;
}

export function SettingsIcon(props: ConvenienceProps) {
  return <ActionIcon action="settings" {...props} />;
}

export function LogoutIcon(props: ConvenienceProps) {
  return <ActionIcon action="logout" {...props} />;
}

export function NotificationIcon(props: ConvenienceProps) {
  return <ActionIcon action="notification" {...props} />;
}
