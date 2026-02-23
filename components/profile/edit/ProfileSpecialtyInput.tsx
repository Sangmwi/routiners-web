'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import { SPECIALTIES, SPECIALTY_LABELS, SPECIALTY_DESCRIPTIONS, type Specialty } from '@/lib/types/user';

interface ProfileSpecialtyInputProps {
  value: Specialty;
  onChange: (value: Specialty) => void;
}

export default function ProfileSpecialtyInput({ value, onChange }: ProfileSpecialtyInputProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSpecialties = searchQuery.trim()
    ? SPECIALTIES.filter((s) => {
        const query = searchQuery.toLowerCase();
        return SPECIALTY_LABELS[s].toLowerCase().includes(query) || SPECIALTY_DESCRIPTIONS[s].toLowerCase().includes(query);
      })
    : SPECIALTIES;

  const handleSelect = (specialty: Specialty) => {
    onChange(specialty);
    setIsSheetOpen(false);
    setSearchQuery('');
  };

  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">병과</label>

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
        <div className="flex-1 min-w-0">
          {value ? (
            <>
              <span className="text-sm font-medium text-foreground">{SPECIALTY_LABELS[value]}</span>
              <p className="text-xs text-muted-foreground">{SPECIALTY_DESCRIPTIONS[value]}</p>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">병과를 선택해 주세요</span>
          )}
        </div>
      </button>

      {/* 바텀시트 모달 */}
      <Modal
        isOpen={isSheetOpen}
        onClose={() => { setIsSheetOpen(false); setSearchQuery(''); }}
        title="병과 선택"
        position="bottom"
        enableSwipe
        height="half"
      >
        <ModalBody>
          <div className="sticky top-0 bg-card px-4 pb-4 pt-2 border-b border-border">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="병과명으로 검색"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2 p-4">
            {filteredSpecialties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                검색 결과가 없어요
              </div>
            ) : (
              filteredSpecialties.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => handleSelect(specialty)}
                  className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
                    specialty === value
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-muted/20 border-2 border-transparent hover:bg-muted/50'
                  }`}
                >
                  <p className="font-medium text-foreground">{SPECIALTY_LABELS[specialty]}</p>
                  <p className="text-sm text-muted-foreground">{SPECIALTY_DESCRIPTIONS[specialty]}</p>
                </button>
              ))
            )}
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
