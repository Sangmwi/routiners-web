'use client';

type TagVariant = 'primary' | 'warning' | 'default';

interface ProfileTagSectionProps {
  title: string;
  items: string[] | null | undefined;
  labelFn?: (item: string) => string;
  variant: TagVariant;
}

const VARIANT_CLASS: Record<TagVariant, string> = {
  primary: 'bg-surface-accent text-primary font-medium',
  warning: 'bg-warning/10 text-warning font-medium',
  default: 'bg-muted text-foreground',
};

export default function ProfileTagSection({ title, items, labelFn, variant }: ProfileTagSectionProps) {
  if (!items?.length) return null;
  return (
    <div className="bg-surface-hover rounded-xl p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className={`px-2.5 py-1 text-xs rounded-full ${VARIANT_CLASS[variant]}`}>
            {labelFn ? labelFn(item) : item}
          </span>
        ))}
      </div>
    </div>
  );
}
