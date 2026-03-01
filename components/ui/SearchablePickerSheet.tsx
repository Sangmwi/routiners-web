'use client';

import { type ReactNode } from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import { useFilteredList } from '@/hooks/common';

interface SearchablePickerSheetProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: readonly T[];
  filterFn: (item: T, query: string) => boolean;
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
  placeholder?: string;
  maxResults?: number;
  height?: 'half' | 'full';
}

/**
 * 검색 + 목록 선택 패턴을 위한 공통 바텀시트.
 * ProfileSpecialtyInput, ProfileUnitInput, SpecialtyStep, UnitStep 등에서
 * 반복되던 sticky 검색 헤더 + 필터드 리스트 패턴을 단일 컴포넌트로 추출.
 */
export default function SearchablePickerSheet<T>({
  isOpen,
  onClose,
  title,
  items,
  filterFn,
  renderItem,
  getKey,
  placeholder = '검색',
  maxResults,
  height = 'half',
}: SearchablePickerSheetProps<T>) {
  const { query, setQuery, filtered, totalFiltered, hasOverflow } = useFilteredList(
    items,
    filterFn,
    maxResults,
  );

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      position="bottom"
      enableSwipe
      height={height}
    >
      <ModalBody>
        {/* Sticky 검색 헤더 */}
        <div className="sticky top-0 bg-card px-4 pb-4 pt-2 border-b border-border">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-focus focus:border-primary"
              autoFocus
            />
          </div>
        </div>

        {/* 목록 */}
        <div className="space-y-2 p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">검색 결과가 없어요</div>
          ) : (
            filtered.map((item) => (
              <div key={getKey(item)}>{renderItem(item)}</div>
            ))
          )}

          {hasOverflow && (
            <p className="text-center text-xs text-muted-foreground py-2">
              검색어를 더 입력해 주세요 ({totalFiltered - (maxResults ?? 0)}개 더 있음)
            </p>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
