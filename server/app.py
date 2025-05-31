from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variable for loaded model
model = None

def load_model():
    global model
    try:
        model_path = 'model/naive_bayes.pkl'
        if os.path.exists(model_path):
            model = joblib.load(model_path)
            print("✅ Loaded actual ML model")
        else:
            print("⚠️ ML model not found, using mock predictions")
    except Exception as e:
        print(f"❌ Error loading model: {e}")

# Fallback mock analysis
def mock_sentiment_analysis(text):
    positive_words = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'wonderful', 'fantastic', 'awesome', 'nice']
    negative_words = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing', 'poor', 'useless']
    
    text_lower = text.lower()
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    if positive_count > negative_count:
        return 'positive'
    elif negative_count > positive_count:
        return 'negative'
    else:
        return 'neutral'

@app.route('/')
def home():
    return jsonify({"message": "ML Sentiment Analysis API is running"})

@app.route('/api/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    try:
        data = request.get_json()
        
        if not data or 'reviewText' not in data:
            return jsonify({"error": "Review text is required"}), 400
            
        review_text = data['reviewText'].strip()
        if not review_text:
            return jsonify({"error": "Review text cannot be empty"}), 400

        if model:
            try:
                prediction = model.predict([review_text])[0]
                probabilities = model.predict_proba([review_text])[0]
                confidence = max(probabilities)
                sentiment = prediction
                model_used = "actual"
            except Exception as e:
                print(f"Model prediction error: {e}")
                sentiment = mock_sentiment_analysis(review_text)
                confidence = 0.8
                model_used = "mock"
        else:
            sentiment = mock_sentiment_analysis(review_text)
            confidence = 0.8
            model_used = "mock"

        return jsonify({
            "sentiment": sentiment,
            "confidence": round(float(confidence), 4),
            "reviewText": review_text,
            "model_used": model_used
        })

    except Exception as e:
        print(f"Error in sentiment analysis: {e}")
        return jsonify({"error": "An error occurred during sentiment analysis."}), 500

if __name__ == '__main__':
    load_model()
    app.run(debug=True)
