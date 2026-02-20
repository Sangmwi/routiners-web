/**
 * Unit Meal API Layer
 *
 * 부대 식단 메뉴 조회 및 배치 불러오기 API 함수
 */

import type { UnitMealMenu, MealBatchResult } from '@/lib/types/unitMeal';
import type { RoutineEventCreateData } from '@/lib/types/routine';
import { api } from './client';

export const unitMealApi = {
  /**
   * 부대 식단 메뉴 조회 (단일 날짜)
   *
   * @param unitId - 부대 ID
   * @param date - 날짜 (YYYY-MM-DD)
   * @returns 부대 식단 메뉴
   */
  async getUnitMealMenu(unitId: string, date: string): Promise<UnitMealMenu> {
    return api.getOrThrow<UnitMealMenu>(
      `/api/meal/unit-menu?unitId=${encodeURIComponent(unitId)}&date=${encodeURIComponent(date)}`,
    );
  },

  /**
   * 날짜별 순차 식단 조회 (배치 불러오기)
   *
   * 각 날짜를 순차적으로 fetch하며 onProgress 콜백으로 진행 상태 전달.
   * 개별 날짜 실패 시 해당 날짜만 스킵하고 나머지 계속 진행.
   *
   * @param unitId - 부대 ID
   * @param dates - 조회할 날짜 목록
   * @param onProgress - 날짜별 진행 상태 콜백
   * @returns 성공한 메뉴 목록 + 실패한 날짜 목록
   */
  async fetchBatchMenus(
    unitId: string,
    dates: string[],
    onProgress: (date: string, status: 'fetching' | 'fetched' | 'error') => void,
  ): Promise<{ menus: UnitMealMenu[]; failedDates: string[] }> {
    const menus: UnitMealMenu[] = [];
    const failedDates: string[] = [];

    for (const date of dates) {
      onProgress(date, 'fetching');
      try {
        const menu = await this.getUnitMealMenu(unitId, date);
        menus.push(menu);
        onProgress(date, 'fetched');
      } catch {
        failedDates.push(date);
        onProgress(date, 'error');
      }
    }

    return { menus, failedDates };
  },

  /**
   * 식단 이벤트 배치 생성 (aiSessionId 불필요)
   *
   * 이미 존재하는 날짜는 서버에서 스킵 처리.
   *
   * @param events - 생성할 이벤트 데이터 목록
   * @returns 생성 결과 (created + skipped)
   */
  async createMealBatch(events: RoutineEventCreateData[]): Promise<MealBatchResult> {
    return api.post<MealBatchResult>('/api/routine/events/batch-meal', { events });
  },
};
