export type UIStatePayload = Record<string, unknown>;

export type RestoreMeta = {
  restoredAt: number | null;
  isRestored: boolean;
};

export type RouteStateSnapshot<T = unknown> = {
  key: string;
  pathname: string;
  search: string;
  ui: T;
  scrollY?: number;
  createdAt: number;
  updatedAt: number;
  version: 1;
};

