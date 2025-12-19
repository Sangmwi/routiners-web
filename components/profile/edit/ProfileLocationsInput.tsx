'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface ProfileLocationsInputProps {
  defaultLocations?: string[];
}

export default function ProfileLocationsInput({ defaultLocations = [] }: ProfileLocationsInputProps) {
  const [locations, setLocations] = useState<string[]>(defaultLocations);
  const [inputValue, setInputValue] = useState('');

  const handleAddLocation = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !locations.includes(trimmedValue)) {
      setLocations([...locations, trimmedValue]);
      setInputValue('');
    }
  };

  const handleRemoveLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLocation();
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-card-foreground">자주 가는 운동 장소</h2>
      <p className="text-xs text-muted-foreground">
        평소에 자주 가는 헬스장, 조깅 코스 등을 태그로 추가해주세요! 같은 장소에서 운동하는 사람을 찾을 수 있어요!
      </p>

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
          <Plus className="w-4 h-4" />
          <span className="text-sm">추가</span>
        </button>
      </div>

      {/* Tags Display */}
      {locations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {locations.map((location, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-card text-xs text-card-foreground border border-border/50"
            >
              <span>{location}</span>
              <button
                type="button"
                onClick={() => handleRemoveLocation(index)}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
