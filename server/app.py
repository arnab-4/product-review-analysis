import os
import pickle
import logging

import numpy as np
import torch
import torch.nn as nn
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from torchtext.data.utils import get_tokenizer

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# 1) DEFINE THE BiLSTM MODEL CLASS (must match your training definition)
# ─────────────────────────────────────────────────────────────────────────────
class ImprovedBiLSTMModel(nn.Module):
    def __init__(self, weights_matrix, hidden_dim=256, num_layers=2, dropout=0.5, rnn_dropout=0.3):
        super(ImprovedBiLSTMModel, self).__init__()
        weight_tensor = torch.tensor(weights_matrix, dtype=torch.float32)
        self.embedding = nn.Embedding.from_pretrained(weight_tensor, freeze=True)
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers

        self.lstm = nn.LSTM(
            input_size      = weight_tensor.size(1),   # e.g., 300 for GloVe 300d
            hidden_size     = hidden_dim,
            num_layers      = num_layers,
            batch_first     = True,
            bidirectional   = True,
            dropout         = rnn_dropout if num_layers > 1 else 0.0
        )

        self.dropout = nn.Dropout(dropout)
        self.fc      = nn.Linear(hidden_dim * 2, 1)

        # Xavier initialization for the final layer
        nn.init.xavier_uniform_(self.fc.weight)
        if self.fc.bias is not None:
            nn.init.constant_(self.fc.bias, 0.0)

    def forward(self, text_indices):
        """
        text_indices: LongTensor of shape (batch_size, seq_len)
        """
        embedded = self.embedding(text_indices)             # (batch_size, seq_len, embed_dim)
        lstm_out, _ = self.lstm(embedded)                   # (batch_size, seq_len, hidden_dim*2)
        avg_pool = torch.mean(lstm_out, dim=1)              # (batch_size, hidden_dim*2)
        dropped  = self.dropout(avg_pool)                   # (batch_size, hidden_dim*2)
        logits   = self.fc(dropped).squeeze(1)              # (batch_size,)
        return logits  # raw logits for BCEWithLogitsLoss

# ─────────────────────────────────────────────────────────────────────────────
# 2) GLOBAL VARIABLES: LOAD VOCAB, WEIGHTS, AND MODEL AT STARTUP
# ─────────────────────────────────────────────────────────────────────────────

VOCAB_PATH       = "model/vocab.pkl"
WEIGHTS_PATH     = "model/weights_matrix.npy"
MODEL_CHECKPOINT = "model/best_model.pt"
PAD_LEN          = 100
PAD_TOKEN        = "<pad>"

tokenizer = get_tokenizer("basic_english")

# a) Load torchtext vocab
try:
    with open(VOCAB_PATH, "rb") as f:
        vocab = pickle.load(f)
    vocab.set_default_index(vocab["<unk>"])
    logger.info("Vocabulary loaded successfully.")
except Exception as e:
    logger.error(f"Error loading vocab: {e}")
    vocab = None

# b) Load weights_matrix (NumPy array)
try:
    weights_matrix = np.load(WEIGHTS_PATH)
    logger.info("Weights matrix loaded successfully.")
except Exception as e:
    logger.error(f"Error loading weights_matrix: {e}")
    weights_matrix = None

# c) Instantiate the model and load state_dict
device = torch.device("cpu")  # Inference on CPU; change to "cuda" if GPU available
model = None

if weights_matrix is not None:
    try:
        model = ImprovedBiLSTMModel(
            weights_matrix=weights_matrix,
            hidden_dim=256,
            num_layers=2,
            dropout=0.5,
            rnn_dropout=0.3
        ).to(device)

        state_dict = torch.load(MODEL_CHECKPOINT, map_location=device)
        model.load_state_dict(state_dict)
        model.eval()
        logger.info("BiLSTM model loaded successfully.")
    except Exception as e:
        logger.error(f"Error loading BiLSTM model: {e}")
        model = None

# Ensure PAD_TOKEN is in vocab
if vocab is not None and PAD_TOKEN not in vocab.get_itos():
    logger.warning(f"Pad token '{PAD_TOKEN}' not found in vocab.")

# ─────────────────────────────────────────────────────────────────────────────
# 3) TEXT TO INDEX SEQUENCE FUNCTION (same as training)
# ─────────────────────────────────────────────────────────────────────────────
def generate_sequence(text: str, pad_len: int, pad_token: str = PAD_TOKEN):
    """
    Tokenize `text` using basic_english, then pad/truncate to `pad_len`.
    Returns a list of token indices.
    """
    words = tokenizer(text)
    if len(words) <= pad_len:
        seq_words = words + [pad_token] * (pad_len - len(words))
    else:
        seq_words = words[:pad_len]
    return [vocab[word] for word in seq_words]

# ─────────────────────────────────────────────────────────────────────────────
# 4) PREDICTION FUNCTION: RAW TEXT → (label, probability)
# ─────────────────────────────────────────────────────────────────────────────
def predict_sentiment(text: str):
    """
    Returns a tuple: (label_str, probability_float).
    """
    seq_ids = generate_sequence(text, pad_len=PAD_LEN, pad_token=PAD_TOKEN)
    tensor  = torch.tensor(seq_ids, dtype=torch.long).unsqueeze(0).to(device)  # (1, PAD_LEN)

    with torch.no_grad():
        logits = model(tensor)                    # shape (1,)
        prob   = torch.sigmoid(logits).item()     # float

    label_str = "Positive" if prob >= 0.5 else "Negative"
    return label_str, prob

# ─────────────────────────────────────────────────────────────────────────────
# 5) FLASK ROUTES (mirroring your example structure)
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/')
def home():
    return render_template('home.html')


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None and vocab is not None
    })


@app.route('/api/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    """
    Expects JSON body: { "reviewText": "<text>" }
    Returns JSON: {
        "sentiment": "Positive"/"Negative",
        "confidence": 0.9123,
        "probabilities": {"Negative": 1-0.9123, "Positive": 0.9123},
        "model_type": "bilstm"
    }
    """
    try:
        data = request.get_json(force=True)
        if not data or 'reviewText' not in data:
            return jsonify({'error': 'reviewText is required'}), 400

        review_text = data['reviewText']
        if not isinstance(review_text, str) or not review_text.strip():
            return jsonify({'error': 'Review text cannot be empty'}), 400

        if model is None or vocab is None:
            return jsonify({'error': 'ML model not available'}), 500

        # Get prediction and probability
        label, prob_pos = predict_sentiment(review_text)
        prob_neg = 1.0 - prob_pos

        probabilities = {
            "Negative": round(prob_neg, 4),
            "Positive": round(prob_pos, 4)
        }

        logger.info(f"ML Analysis - Sentiment: {label}, Confidence: {prob_pos:.4f}")

        return jsonify({
            'sentiment': label,
            'confidence': round(prob_pos, 4),
            'probabilities': probabilities,
            'model_type': 'bilstm'
        })

    except Exception as e:
        logger.error(f"Error in sentiment analysis: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/prediction', methods=['GET', 'POST'])
def prediction():
    """
    Renders a form on GET. On POST, reads 'review' from form and returns sentiment in output.html.
    """
    if request.method == 'POST':
        review = request.form.get("review")

        if not review or not review.strip():
            message = 'Enter review.'
            return render_template('home.html', message=message)

        if model is None or vocab is None:
            return render_template('home.html', message='Model not available')

        label, prob = predict_sentiment(review)
        # You can pass prob if you want to display confidence in output.html
        return render_template('output.html', prediction=label, confidence=round(prob, 4))

    # GET request
    return render_template('home.html')


# ─────────────────────────────────────────────────────────────────────────────
# 6) RUN THE FLASK APP
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
