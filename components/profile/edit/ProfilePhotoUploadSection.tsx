'use client';

import { useState } from 'react';
import { User } from '@/lib/types';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { Plus } from 'lucide-react';

interface ProfilePhotoUploadSectionProps {
  user: User;
}

export default function ProfilePhotoUploadSection({ user }: ProfilePhotoUploadSectionProps) {
  const [mainPhoto, setMainPhoto] = useState(user.profileImage);
  const [additionalPhotos, setAdditionalPhotos] = useState<(string | null)[]>([null, null, null]);

  const handleMainPhotoUpload = () => {
    // TODO: Implement photo upload
    console.log('Upload main photo');
  };

  const handleAdditionalPhotoUpload = (index: number) => {
    // TODO: Implement additional photo upload
    console.log('Upload additional photo', index);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-card-foreground">프로필</h2>
      <p className="text-xs text-muted-foreground">
        나를 가장 잘 표현할 수 있는 사진을 선택하세요!
      </p>

      <div className="flex gap-2">
        {/* Main Photo - 2:3 ratio (세로가 긴), takes 2/3 of width */}
        <button
          onClick={handleMainPhotoUpload}
          className="relative flex-[2] aspect-[2/3] rounded-2xl overflow-hidden bg-muted/50 border-2 border-dashed border-border hover:border-primary transition-colors group"
        >
          {mainPhoto ? (
            <ImageWithFallback
              src={mainPhoto}
              alt="Profile"
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          )}
        </button>

        {/* Additional Photos - takes 1/3 of width, height matches main photo via aspect ratio */}
        <div className="flex-[1] aspect-[2/3] flex flex-col gap-2">
          {additionalPhotos.map((photo, index) => (
            <button
              key={index}
              onClick={() => handleAdditionalPhotoUpload(index)}
              className="relative w-full flex-1 rounded-xl overflow-hidden bg-muted/50 border-2 border-dashed border-border hover:border-primary transition-colors group"
            >
              {photo ? (
                <ImageWithFallback
                  src={photo}
                  alt={`Additional photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
