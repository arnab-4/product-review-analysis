
# ML Sentiment Analysis Server

## Setup Instructions

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Place your ML model files in the `model/` directory:
   - `naive_bayes.pkl` - Your trained Naive Bayes model
   - `vectorizer.pkl` - The TF-IDF vectorizer used during training

4. Run the server:
```bash
python app.py
```

The server will run on http://localhost:5000

## API Endpoints

- `POST /api/analyze-sentiment` - Analyze sentiment of review text
- `GET /api/health` - Check server health and model status
- `GET /` - Basic server info

## Request Format

```json
{
  "reviewText": "This product is amazing!"
}
```

## Response Format

```json
{
  "sentiment": "positive",
  "confidence": 0.95,
  "reviewText": "This product is amazing!",
  "model_used": "actual"
}
```
