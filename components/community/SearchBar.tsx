'use client';

import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  onSearchChange: (search: string) => void;
}

export default function SearchBar({ onSearchChange }: SearchBarProps) {
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, 300);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onSearchChange(debouncedValue);
  }, [debouncedValue, onSearchChange]);

  const handleClear = () => {
    setValue('');
  };

  return (
    <div className="relative px-4 pb-2">
      <div className="relative">
        <MagnifyingGlassIcon
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="게시글 검색..."
          className="w-full rounded-full bg-muted/20 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <XIcon size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
