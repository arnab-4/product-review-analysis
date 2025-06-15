
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Review } from "@/hooks/useReviews";

// Helper to convert sentiment to a numeric score for Y-axis positioning
const sentimentToScore = (sentiment: string) => {
  const value = (sentiment || '').toLowerCase().trim();
  if (value === "positive") return 1;
  if (value === "negative") return -1;
  if (value === "neutral") return 0;
  // Fallback for any unexpected value
  console.warn('Unknown sentiment value:', sentiment);
  return 0;
};

interface ReviewSentimentTrendChartProps {
  reviews: Review[] | undefined;
}

// Helper for tooltip to show correct string
function formatSentiment(v: number) {
  if (v > 0.5) return "Positive";
  if (v < -0.5) return "Negative";
  return "Neutral";
}

const ReviewSentimentTrendChart = ({ reviews }: ReviewSentimentTrendChartProps) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/50">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Sentiment Trend Over Time</h3>
        <p className="text-slate-600 text-center">No reviews to show trend.</p>
      </div>
    );
  }

  // Group reviews by date (YYYY-MM-DD format for consistency)
  const grouped: Record<string, number[]> = {};
  reviews.forEach(review => {
    const date = new Date(review.created_at).toISOString().split('T')[0]; // Get YYYY-MM-DD format
    if (!grouped[date]) grouped[date] = [];
    const sentimentScore = sentimentToScore(review.sentiment);
    grouped[date].push(sentimentScore);
    console.log(`Review sentiment: ${review.sentiment} -> Score: ${sentimentScore} for date: ${date}`);
  });

  // Create sorted trend data with average sentiment per date
  const data = Object.entries(grouped)
    .map(([date, scores]) => {
      const averageSentiment = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      console.log(`Date: ${date}, Scores: [${scores.join(', ')}], Average: ${averageSentiment}`);
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sentiment: Number(averageSentiment.toFixed(3)), // Round to 3 decimal places for precision
        rawDate: date
      };
    })
    .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/50">
      <h3 className="text-xl font-bold text-slate-800 mb-4">Sentiment Trend Over Time</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            
            {/* Neutral reference line at Y=0 - make it more prominent */}
            <ReferenceLine 
              y={0} 
              stroke="#374151" 
              strokeDasharray="5 5" 
              strokeWidth={2}
              label={{ value: "Neutral", position: "insideTopRight", fill: "#374151", fontSize: 12 }}
            />
            
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }} 
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis
              domain={[-1.1, 1.1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => {
                if (value === 1) return "Positive (+1)";
                if (value === 0.5) return "+0.5";
                if (value === 0) return "Neutral (0)";
                if (value === -0.5) return "-0.5";
                if (value === -1) return "Negative (-1)";
                return value.toString();
              }}
              label={{
                value: "Sentiment Score",
                angle: -90,
                position: "insideLeft",
                fontSize: 12,
                fill: "#64748b"
              }}
            />
            <Tooltip
              formatter={(value: number) => [
                `${formatSentiment(value)} (${value.toFixed(2)})`,
                "Average Sentiment"
              ]}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}
            />
            <Line
              type="monotone"
              dataKey="sentiment"
              stroke="#2563eb"
              strokeWidth={3}
              dot={(props) => {
                const { cx, cy, payload } = props;
                const sentiment = payload?.sentiment || 0;
                let color = "#6b7280"; // neutral gray
                let size = 5;
                
                if (sentiment > 0.1) {
                  color = "#10b981"; // green for positive
                  size = 6;
                }
                if (sentiment < -0.1) {
                  color = "#ef4444"; // red for negative  
                  size = 6;
                }
                
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={size}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{
                r: 8,
                fill: "#2563eb",
                stroke: "#1e40af",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend and explanation */}
      <div className="mt-4 space-y-3">
        <div className="flex justify-center items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-green-700 font-medium">Positive (+1 to +0.1)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-gray-400"></div>
            <span className="text-gray-600 font-medium">Neutral (-0.1 to +0.1)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-red-600 font-medium">Negative (-0.1 to -1)</span>
          </div>
        </div>
        <p className="text-center text-xs text-slate-500">
          Chart shows average daily sentiment: Positive reviews above neutral line (0), Negative reviews below
        </p>
      </div>
    </div>
  );
};

export default ReviewSentimentTrendChart;