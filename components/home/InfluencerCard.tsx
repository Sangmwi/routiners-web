'use client';

interface InfluencerCardProps {
  author: string;
  title: string;
  imageUrl?: string;
  votes: number;
  onClick?: () => void;
}

export default function InfluencerCard({ author, title, imageUrl, votes, onClick }: InfluencerCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-64 rounded-xl bg-white shadow-sm overflow-hidden transition-colors hover:bg-green-50 cursor-pointer"
    >
      {imageUrl ? (
        <div className="relative w-full h-40">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
          <span className="text-xs text-gray-400">이미지</span>
        </div>
      )}
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1">@{author}</p>
        <h3 className="text-sm font-medium text-green-900 mb-3 line-clamp-2">{title}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-sm">👍</span>
            <span className="text-xs text-muted-foreground">{votes} votes</span>
          </div>
          <button className="text-xs text-primary hover:text-green-700 transition-colors">
            더 알아보기 →
          </button>
        </div>
      </div>
    </div>
  );
}

