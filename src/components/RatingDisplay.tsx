
import { Star } from "lucide-react";

interface RatingDisplayProps {
  starCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  totalReviews: number;
}

const RatingDisplay = ({ starCounts, totalReviews }: RatingDisplayProps) => {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = starCounts[stars as keyof typeof starCounts];
        const percentage = (count / totalReviews) * 100;
        
        return (
          <div key={stars} className="flex items-center gap-3">
            <div className="flex items-center gap-1 min-w-[60px]">
              <span className="text-sm text-slate-600">{stars}</span>
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm text-slate-600 min-w-[30px] text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default RatingDisplay;
