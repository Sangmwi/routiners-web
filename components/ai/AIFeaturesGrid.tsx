'use client';

import { HeartbeatIcon, ChartBarIcon, CrosshairIcon, TrophyIcon } from '@phosphor-icons/react';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const FEATURES: Feature[] = [
  {
    icon: HeartbeatIcon,
    title: '자세 분석',
    description: '실시간으로 운동 자세를 분석하고 교정합니다',
    color: 'text-primary',
  },
  {
    icon: ChartBarIcon,
    title: '운동 기록',
    description: '세트, 반복수, 무게를 자동으로 기록합니다',
    color: 'text-success',
  },
  {
    icon: CrosshairIcon,
    title: '맞춤 추천',
    description: '당신의 목표에 맞는 운동을 추천합니다',
    color: 'text-primary',
  },
  {
    icon: TrophyIcon,
    title: '성과 분석',
    description: '운동 효과를 분석하고 개선점을 제안합니다',
    color: 'text-purple-500',
  },
];

/**
 * AI 기능 그리드
 */
export default function AIFeaturesGrid() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {FEATURES.map((feature) => {
        const Icon = feature.icon;
        return (
          <div
            key={feature.title}
            className="rounded-xl bg-card p-4 shadow-sm border border-border/50 hover:bg-primary/5 transition-colors"
          >
            <Icon size={32} className={`${feature.color} mb-3`} weight="fill" />
            <h4 className="text-sm font-bold text-card-foreground mb-1">{feature.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
          </div>
        );
      })}
    </div>
  );
}
