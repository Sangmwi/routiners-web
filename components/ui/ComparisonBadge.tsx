export default function ComparisonBadge({ diff, label }: { diff: number; label: string }) {
  const isPositive = diff > 0;
  return (
    <span className="text-[11px] font-medium">
      <span className={isPositive ? 'text-positive' : 'text-negative'}>
        {isPositive ? '▲' : '▼'}
        {Math.abs(diff)}%
      </span>
      <span className="text-muted-foreground"> {label} 대비</span>
    </span>
  );
}
