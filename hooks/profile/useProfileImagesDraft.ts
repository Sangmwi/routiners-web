'use client';

import { useEffect, useRef, useState } from 'react';
import { validateImageFile } from '@/lib/utils/imageValidation';

// ============================================================
// Types
// ============================================================

export interface DraftImage {
  /** Stable draft identifier */
  id: string;
  /** URL used in UI (blob URL or server URL) */
  displayUrl: string;
  /** Original server URL when this image already exists */
  originalUrl?: string;
  /** File to upload when this is a new image */
  file?: File;
  /** True when this image was newly added in draft state */
  isNew: boolean;
}

export interface ImageChanges {
  /** New images to upload */
  newImages: { file: File; id: string }[];
  /** Existing image URLs to delete */
  deletedUrls: string[];
  /** Final ordering after all draft operations */
  finalOrder: DraftImage[];
  /** True when any change exists */
  hasChanges: boolean;
}

export interface AddImageResult {
  success: boolean;
  error?: string;
}

interface UseProfileImagesDraftOptions {
  maxImages?: number;
  /**
   * When true, incoming initialImages updates are ignored.
   * This avoids resetting draft state while a save request is in flight.
   */
  isSaving?: boolean;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_MAX_IMAGES = 4;

// ============================================================
// Helpers
// ============================================================

const generateId = () => `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createDraftFromUrl = (url: string): DraftImage => ({
  id: generateId(),
  displayUrl: url,
  originalUrl: url,
  isNew: false,
});

const createDraftFromFile = (file: File): DraftImage => ({
  id: generateId(),
  displayUrl: URL.createObjectURL(file),
  file,
  isNew: true,
});

const revokeBlobUrl = (url: string) => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

const appendUniqueUrl = (urls: string[], url: string) =>
  urls.includes(url) ? urls : [...urls, url];

// ============================================================
// Hook
// ============================================================

/**
 * Manages local profile image draft state.
 *
 * It returns change sets for save requests and guarantees blob URL cleanup.
 */
export function useProfileImagesDraft(
  initialImages: string[] = [],
  options: UseProfileImagesDraftOptions = {},
) {
  const { maxImages = DEFAULT_MAX_IMAGES, isSaving = false } = options;

  // ========== State ==========

  const [images, setImages] = useState<DraftImage[]>(() =>
    initialImages.map(createDraftFromUrl),
  );
  const [deletedUrls, setDeletedUrls] = useState<string[]>([]);
  const [baselineUrls, setBaselineUrls] = useState<string[]>(() => initialImages);

  // ========== Refs ==========

  // Used only for cleanup on unmount and reset synchronization.
  const latestImagesRef = useRef<DraftImage[]>(images);

  useEffect(() => {
    latestImagesRef.current = images;
  }, [images]);

  // ========== Effects ==========

  // Reset local draft when source images changed (unless saving).
  useEffect(() => {
    if (isSaving) return;

    const hasInitialChanged =
      JSON.stringify(initialImages) !== JSON.stringify(baselineUrls);

    if (!hasInitialChanged) return;

    latestImagesRef.current.forEach((img) => {
      if (img.isNew) revokeBlobUrl(img.displayUrl);
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBaselineUrls(initialImages);
    setImages(initialImages.map(createDraftFromUrl));
    setDeletedUrls([]);
  }, [baselineUrls, initialImages, isSaving]);

  // Cleanup all blob URLs when unmounted.
  useEffect(() => {
    return () => {
      latestImagesRef.current.forEach((img) => {
        if (img.isNew) revokeBlobUrl(img.displayUrl);
      });
    };
  }, []);

  // ========== Computed ==========

  const hasChanges = (() => {
    if (deletedUrls.length > 0) return true;
    if (images.some((img) => img.isNew)) return true;

    const currentUrls = images
      .map((img) => img.originalUrl)
      .filter((url): url is string => Boolean(url));

    if (currentUrls.length !== baselineUrls.length) return true;

    return currentUrls.some((url, index) => url !== baselineUrls[index]);
  })();

  // ========== Actions ==========

  const addImage = (file: File, index: number): AddImageResult => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    if (images.length >= maxImages && index >= images.length) {
      return {
        success: false,
        error: `You can upload up to ${maxImages} images.`,
      };
    }

    const newDraft = createDraftFromFile(file);

    setImages((prev) => {
      const next = [...prev];

      if (index < next.length && next[index]) {
        const existing = next[index];

        if (existing.isNew) {
          revokeBlobUrl(existing.displayUrl);
        }

        if (existing.originalUrl) {
          setDeletedUrls((urls) => appendUniqueUrl(urls, existing.originalUrl!));
        }

        next[index] = newDraft;
      } else {
        next.push(newDraft);
      }

      return next.slice(0, maxImages);
    });

    return { success: true };
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (!target) return prev;

      if (target.isNew) {
        revokeBlobUrl(target.displayUrl);
      }

      if (target.originalUrl) {
        setDeletedUrls((urls) => appendUniqueUrl(urls, target.originalUrl!));
      }

      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  };

  const reset = () => {
    images.forEach((img) => {
      if (img.isNew) revokeBlobUrl(img.displayUrl);
    });

    setImages(baselineUrls.map(createDraftFromUrl));
    setDeletedUrls([]);
  };

  const getChanges = (): ImageChanges => ({
    newImages: images
      .filter((img) => img.isNew && img.file)
      .map((img) => ({ file: img.file!, id: img.id })),
    deletedUrls,
    finalOrder: images,
    hasChanges,
  });

  // ========== Return ==========

  return {
    images,
    hasChanges,
    addImage,
    removeImage,
    reorderImages,
    reset,
    getChanges,
  };
}
