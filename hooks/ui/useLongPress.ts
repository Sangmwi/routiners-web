import { useRef } from 'react';

const LONG_PRESS_DURATION = 500;
const MOVE_THRESHOLD = 10;

/**
 * 롱프레스 제스처 훅
 *
 * - 500ms 홀드 후 콜백 실행
 * - 터치 이동(스크롤) 시 자동 취소
 * - 롱프레스 발동 시 후속 click 이벤트 차단 (네비게이션 방지)
 */
export function useLongPress(onLongPress: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = (x: number, y: number) => {
    clear();
    firedRef.current = false;
    startPos.current = { x, y };
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress();
    }, LONG_PRESS_DURATION);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    start(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!startPos.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startPos.current.x;
    const dy = touch.clientY - startPos.current.y;
    if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
      clear();
    }
  };

  const onTouchEnd = () => {
    clear();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    start(e.clientX, e.clientY);
  };

  const onMouseUp = () => {
    clear();
  };

  const onMouseLeave = () => {
    clear();
  };

  const onClick = (e: React.MouseEvent) => {
    if (firedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      firedRef.current = false;
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onClick,
  };
}
