'use client';

import type { EventType, RoutineEvent } from '@/lib/types/routine';
import { useShowError } from '@/lib/stores/errorStore';

interface EventDataMutationVariables<TData> {
  id: string;
  data: TData;
  date: string;
  type: EventType;
}

interface EventDataMutationOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

interface EventDataMutation<TData> {
  mutate: (
    variables: EventDataMutationVariables<TData>,
    options?: EventDataMutationOptions,
  ) => void;
  isPending: boolean;
}

interface UpdateOptions {
  errorMessage: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export function useRoutineEventDataMutation<TData>(
  event: RoutineEvent | null,
  mutation: EventDataMutation<TData>,
) {
  const showError = useShowError();

  const mutateData = (nextData: TData, options: UpdateOptions) => {
    if (!event) return;

    mutation.mutate(
      {
        id: event.id,
        data: nextData,
        date: event.date,
        type: event.type,
      },
      {
        onSuccess: options.onSuccess,
        onError: () => {
          showError(options.errorMessage);
          options.onError?.();
        },
      },
    );
  };

  return {
    mutateData,
    isUpdating: mutation.isPending,
  };
}
