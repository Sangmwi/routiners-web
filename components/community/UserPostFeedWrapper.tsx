'use client';

import { useSearchParams } from 'next/navigation';
import UserPostFeed from './UserPostFeed';

interface UserPostFeedWrapperProps {
  userId: string;
}

export default function UserPostFeedWrapper({ userId }: UserPostFeedWrapperProps) {
  const searchParams = useSearchParams();
  const startIndex = parseInt(searchParams.get('startIndex') ?? '0', 10);

  return <UserPostFeed userId={userId} startIndex={startIndex} />;
}
