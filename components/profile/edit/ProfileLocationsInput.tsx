'use client';

import { useState } from 'react';
import { XIcon, PlusIcon } from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Tag from '@/components/ui/Tag';

interface ProfileLocationsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export default function ProfileLocationsInput({ value, onChange }: ProfileLocationsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddLocation = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue]);
      setInputValue('');
    }
  };

  const handleRemoveLocation = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLocation();
    }
  };

  return (
    <section className="space-y-3">
      <SectionHeader
        title="자주 가는 운동 장소"
        description="헬스장, 조깅 코스 등을 추가해주세요!"
      />

      {/* Input Field */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="예: 육군훈련소 체력단련실"
          className="flex-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
        <button
          type="button"
          onClick={handleAddLocation}
          className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1"
        >
          <PlusIcon size={16} />
          <span className="text-sm">추가</span>
        </button>
      </div>

      {/* Tags Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((location, index) => (
            <Tag key={index} className="pr-2">
              <span>{location}</span>
              <button
                type="button"
                onClick={() => handleRemoveLocation(index)}
                className="ml-1.5 hover:text-destructive transition-colors"
              >
                <XIcon size={14} />
              </button>
            </Tag>
          ))}
        </div>
      )}
    </section>
  );
}
