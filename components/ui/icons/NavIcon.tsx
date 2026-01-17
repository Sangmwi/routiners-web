'use client';

import {
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpIcon,
  CaretDownIcon,
} from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT, type IconWeight } from '@/lib/config/theme';

type NavDirection = 'left' | 'right' | 'up' | 'down';
type NavSize = keyof typeof ICON_SIZE;
type NavWeightKey = keyof typeof ICON_WEIGHT;

interface NavIconProps {
  /** Arrow direction */
  direction: NavDirection;
  /** Size preset from theme */
  size?: NavSize;
  /** Weight preset from theme or direct Phosphor weight */
  weight?: NavWeightKey | IconWeight;
  /** Additional CSS classes */
  className?: string;
}

const DIRECTION_ICONS = {
  left: CaretLeftIcon,
  right: CaretRightIcon,
  up: CaretUpIcon,
  down: CaretDownIcon,
} as const;

export default function NavIcon({
  direction,
  size = 'sm',
  weight = 'inactive',
  className = '',
}: NavIconProps) {
  const Icon = DIRECTION_ICONS[direction];
  const pixelSize = ICON_SIZE[size];

  const resolvedWeight: IconWeight =
    weight in ICON_WEIGHT
      ? ICON_WEIGHT[weight as NavWeightKey]
      : (weight as IconWeight);

  return <Icon size={pixelSize} weight={resolvedWeight} className={className} />;
}

// Convenience exports
type ConvenienceProps = Omit<NavIconProps, 'direction'>;

export function ExpandIcon(props: ConvenienceProps) {
  return <NavIcon direction="down" {...props} />;
}

export function CollapseIcon(props: ConvenienceProps) {
  return <NavIcon direction="up" {...props} />;
}

export function NextIcon(props: ConvenienceProps) {
  return <NavIcon direction="right" {...props} />;
}

export function BackIcon(props: ConvenienceProps) {
  return <NavIcon direction="left" {...props} />;
}
