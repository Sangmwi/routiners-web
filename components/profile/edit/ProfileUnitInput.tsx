'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import { UNITS } from '@/lib/constants/units';

interface ProfileUnitInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ProfileUnitInput({ value, onChange }: ProfileUnitInputProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeUnits = UNITS.filter((u) => u.isActive);

  const filteredUnits = searchQuery.trim()
    ? activeUnits.filter((unit) => {
        const query = searchQuery.toLowerCase();
        return (
          unit.name.toLowerCase().includes(query) ||
          unit.region?.toLowerCase().includes(query)
        );
      })
    : activeUnits;

  const handleSelect = (name: string) => {
    onChange(name);
    setIsSheetOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">부대</label>

      {/* 트리거 카드 */}
      <button
        type="button"
        onClick={() => setIsSheetOpen(true)}
        className={`w-full px-4 py-3 flex items-center gap-3 rounded-xl border-1 transition-all text-left ${
          value
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card hover:border-primary/50'
        }`}
      >
        <MagnifyingGlassIcon size={18} className="text-muted-foreground flex-shrink-0" />
        <span className={`flex-1 text-sm ${value ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          {value || '부대를 검색해 주세요'}
        </span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleClear(); } }}
            className="p-0.5 rounded-full hover:bg-muted cursor-pointer"
          >
            <XIcon size={14} className="text-muted-foreground" />
          </span>
        ) : null}
      </button>

      {/* 바텀시트 모달 */}
      <Modal
        isOpen={isSheetOpen}
        onClose={() => { setIsSheetOpen(false); setSearchQuery(''); }}
        title="소속 부대 검색"
        position="bottom"
        enableSwipe
        height="full"
        size="lg"
      >
        <ModalBody>
          <div className="sticky top-0 bg-card px-4 pb-4 pt-2 border-b border-border">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="부대명 또는 지역으로 검색"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2 p-4">
            {filteredUnits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                검색 결과가 없어요
              </div>
            ) : (
              filteredUnits.slice(0, 50).map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => handleSelect(unit.name)}
                  className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
                    unit.name === value
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-muted/20 border-2 border-transparent hover:bg-muted/50'
                  }`}
                >
                  <p className="font-medium text-foreground">{unit.name}</p>
                  {unit.region && (
                    <p className="text-sm text-muted-foreground">{unit.region}</p>
                  )}
                </button>
              ))
            )}

            {filteredUnits.length > 50 && (
              <p className="text-center text-xs text-muted-foreground py-2">
                검색어를 더 입력해 주세요 ({filteredUnits.length - 50}개 더 있음)
              </p>
            )}
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
