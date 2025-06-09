
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load model once at startup
try:
    model = joblib.load('model/model.pkl')
    logger.info("ML model loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {e}")
    model = None

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    })

@app.route('/api/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    try:
        data = request.get_json()
        if not data or 'reviewText' not in data:
            return jsonify({'error': 'reviewText is required'}), 400
        
        review_text = data['reviewText']
        
        if not review_text.strip():
            return jsonify({'error': 'Review text cannot be empty'}), 400
        
        if model is None:
            return jsonify({'error': 'ML model not available'}), 500
        
        # Get prediction and probability scores
        prediction = model.predict([review_text])[0]
        probabilities = model.predict_proba([review_text])[0]
        
        # Get confidence score (max probability)
        confidence = float(np.max(probabilities))
        
        # Get class labels (assuming model has classes_ attribute)
        if hasattr(model, 'classes_'):
            classes = model.classes_
            prob_dict = {classes[i]: float(probabilities[i]) for i in range(len(classes))}
        else:
            # Fallback if classes_ not available
            prob_dict = {
                'negative': float(probabilities[0]) if len(probabilities) > 0 else 0.0,
                'positive': float(probabilities[1]) if len(probabilities) > 1 else 0.0
            }
        
        logger.info(f"ML Analysis - Sentiment: {prediction}, Confidence: {confidence:.3f}")
        
        return jsonify({
            'sentiment': prediction,
            'confidence': confidence,
            'probabilities': prob_dict,
            'model_type': 'naive_bayes'
        })
        
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/prediction', methods=['GET', 'POST'])
def prediction():
    reviewer = request.form.get("reviewer name")
    product = request.form.get('product name')
    
    if request.method == 'POST':
        review = request.form.get("review")

        if not review:
            message = 'Enter review.'
            return render_template('home.html', message=message)
        else:
            if model is None:
                return render_template('home.html', message='Model not available')
            
            prediction = model.predict([review])[0]
            return render_template('output.html', prediction=prediction)
    else:
        return render_template('home.html')

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
