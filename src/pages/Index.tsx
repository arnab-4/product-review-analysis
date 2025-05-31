
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Brain, BarChart3, Zap, Shield } from "lucide-react";

const Index = () => {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load products</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Brain className="text-white w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                SmartReview
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Brain className="w-4 h-4" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                <span>Advanced Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Discover Products with
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Smart Reviews</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Experience dual-model AI sentiment analysis with confidence scoring. Our advanced ML and AI models 
            work together to provide the most accurate review insights.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-2xl mx-auto">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50">
              <div className="text-2xl font-bold text-blue-600">{products?.length || 0}</div>
              <div className="text-sm text-slate-600">Products</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50">
              <div className="text-2xl font-bold text-green-600">95%</div>
              <div className="text-sm text-slate-600">Accuracy</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50">
              <div className="text-2xl font-bold text-purple-600">2</div>
              <div className="text-sm text-slate-600">AI Models</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50">
              <div className="text-2xl font-bold text-orange-600">Real-time</div>
              <div className="text-sm text-slate-600">Analysis</div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-slate-800 mb-4">Advanced AI Features</h3>
          <p className="text-lg text-slate-600">Powered by cutting-edge machine learning and AI technology</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Brain className="text-white w-6 h-6" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">Dual AI Models</h4>
            <p className="text-slate-600 text-sm">ML + AI models work together for maximum accuracy in sentiment detection.</p>
          </div>
          
          <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="text-white w-6 h-6" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">Confidence Scoring</h4>
            <p className="text-slate-600 text-sm">Get detailed confidence metrics for every sentiment analysis result.</p>
          </div>
          
          <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Zap className="text-white w-6 h-6" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">Mismatch Detection</h4>
            <p className="text-slate-600 text-sm">Automatically detect when ratings don't match review sentiment.</p>
          </div>
          
          <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Shield className="text-white w-6 h-6" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">Smart Fallbacks</h4>
            <p className="text-slate-600 text-sm">Intelligent model preferences ensure reliable results every time.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50">
          <h3 className="text-3xl font-bold text-slate-800 text-center mb-8">How Our AI Analysis Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                1
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Dual Analysis</h4>
              <p className="text-slate-600 text-sm">Both ML and AI models analyze your review text and rating simultaneously.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                2
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Smart Comparison</h4>
              <p className="text-slate-600 text-sm">Results are compared with confidence scoring and mismatch detection.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                3
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Final Result</h4>
              <p className="text-slate-600 text-sm">Optimal sentiment with justified confidence and detailed insights.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
