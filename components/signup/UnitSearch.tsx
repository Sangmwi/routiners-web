'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import Input from '@/components/ui/Input';
import { Unit } from '@/lib/types';

interface UnitSearchProps {
  units: Unit[];
  selectedUnit: Unit | null;
  onSelect: (unit: Unit) => void;
  error?: string;
}

export default function UnitSearch({ units, selectedUnit, onSelect, error }: UnitSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const getFilteredUnits = () => {
    if (!searchQuery.trim()) return units.slice(0, 20); // Show first 20 by default

    const query = searchQuery.toLowerCase();
    return units
      .filter((unit) => {
        const nameMatch = unit.name.toLowerCase().includes(query);
        const locationMatch = unit.location?.toLowerCase().includes(query);
        return nameMatch || locationMatch;
      })
      .slice(0, 20);
  };

  const filteredUnits = getFilteredUnits();

  const handleSelect = (unit: Unit) => {
    onSelect(unit);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null as any);
    setSearchQuery('');
  };

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-foreground">
        소속 부대 <span className="ml-1 text-destructive">*</span>
      </label>

      {selectedUnit ? (
        <div className="flex items-center justify-between rounded-xl border border-border bg-primary/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">{selectedUnit.name}</p>
            {selectedUnit.location && <p className="text-xs text-muted-foreground">{selectedUnit.location}</p>}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <XIcon size={20} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <MagnifyingGlassIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="부대명 또는 지역으로 검색"
              className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 bg-background text-foreground ${
                error
                  ? 'border-destructive/50 focus:border-destructive focus:ring-destructive/20'
                  : 'border-border focus:border-primary focus:ring-primary/20'
              }`}
            />
          </div>

          {isOpen && filteredUnits.length > 0 && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <div className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                {filteredUnits.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => handleSelect(unit)}
                    className="w-full border-b border-border/50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-primary/10"
                  >
                    <p className="text-sm font-medium text-foreground">{unit.name}</p>
                    {unit.location && <p className="text-xs text-muted-foreground">{unit.location}</p>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
