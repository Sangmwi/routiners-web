// Base Query Hooks
export {
  useBaseQuery,
  useConditionalQuery,
  STALE_TIME,
  type StaleTimeKey,
} from './useBaseQuery';

// Suspense Query Hooks
export {
  useSuspenseBaseQuery,
  useQueryErrorResetBoundary,
} from './useSuspenseBaseQuery';

// Event Listeners
export {
  useDocumentEventListener,
  useWindowEventListener,
  useCustomEventListener,
} from './useEventListener';
