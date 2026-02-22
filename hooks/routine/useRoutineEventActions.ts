'use client';

import { useRouter } from 'next/navigation';
import { useShowError } from '@/lib/stores/errorStore';
import { useUpdateRoutineEvent, useDeleteRoutineEvent } from './mutations';
import type { RoutineEvent } from '@/lib/types/routine';

interface UncompleteOptions {
  errorMessage: string;
}

interface DeleteOptions {
  errorMessage: string;
}

export function useRoutineEventActions() {
  const router = useRouter();
  const showError = useShowError();

  const updateEvent = useUpdateRoutineEvent();
  const deleteEvent = useDeleteRoutineEvent();

  const deleteEventAndGoBack = async (event: RoutineEvent, options: DeleteOptions) => {
    try {
      await deleteEvent.mutateAsync({
        id: event.id,
        date: event.date,
        type: event.type,
      });
      router.back();
    } catch {
      showError(options.errorMessage);
    }
  };

  const uncompleteEvent = (event: RoutineEvent, options: UncompleteOptions) => {
    updateEvent.mutate(
      {
        id: event.id,
        data: { status: 'scheduled' },
      },
      {
        onError: () => showError(options.errorMessage),
      },
    );
  };

  return {
    deleteEventAndGoBack,
    uncompleteEvent,
    isDeleting: deleteEvent.isPending,
    isUncompleting: updateEvent.isPending,
  };
}
