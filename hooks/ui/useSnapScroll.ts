/**
 * 가장 가까운 캐러셀 아이템으로 스냅하는 유틸리티
 *
 * 마우스 드래그 종료 시 호출하여 CSS scroll-snap과 유사한
 * 프로그래매틱 스냅 동작을 제공합니다.
 */
export function snapToNearest(
  container: HTMLElement,
  itemSelector = '[data-carousel-item]'
): void {
  const items = container.querySelectorAll(itemSelector);
  if (items.length === 0) return;

  const containerLeft = container.scrollLeft;
  const containerPadding =
    parseInt(getComputedStyle(container).paddingLeft, 10) || 0;

  let closestOffset = 0;
  let closestDistance = Infinity;

  items.forEach((item) => {
    const el = item as HTMLElement;
    const itemLeft = el.offsetLeft - containerPadding;
    const distance = Math.abs(containerLeft - itemLeft);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestOffset = itemLeft;
    }
  });

  container.scrollTo({ left: closestOffset, behavior: 'smooth' });
}
