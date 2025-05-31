
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface SentimentChartProps {
  goodReviews: number;
  badReviews: number;
}

const SentimentChart = ({ goodReviews, badReviews }: SentimentChartProps) => {
  const data = [
    { name: "Positive", value: goodReviews, color: "#10b981" },
    { name: "Negative", value: badReviews, color: "#ef4444" },
  ];

  const COLORS = ["#10b981", "#ef4444"];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = goodReviews + badReviews;
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-slate-800 font-medium">{data.name} Reviews</p>
          <p className="text-slate-600">
            {data.value} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/50">
      <h3 className="text-xl font-bold text-slate-800 mb-4">Sentiment Distribution</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">{goodReviews}</div>
          <div className="text-sm text-green-700">Positive Reviews</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-lg font-bold text-red-600">{badReviews}</div>
          <div className="text-sm text-red-700">Negative Reviews</div>
        </div>
      </div>
    </div>
  );
};

export default SentimentChart;
