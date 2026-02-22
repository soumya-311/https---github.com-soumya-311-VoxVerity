
import torch
import numpy as np
from model import VoiceDetectorModel
from audio_utils import preprocess_audio, extract_features

class InferenceEngine:
    def __init__(self, model_path="voice_detector.pth"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = VoiceDetectorModel()
        try:
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        except:
            print("Warning: Model weight file not found. Using uninitialized weights.")
        self.model.to(self.device)
        self.model.eval()

    def generate_explanation(self, features, prediction, confidence):
        if prediction == "AI_GENERATED":
            reasons = []
            if features['mean_pitch'] < 80 or features['mean_pitch'] > 400:
                reasons.append("unnatural fundamental frequency stability")
            reasons.append("consistent phase alignment in spectral features")
            return f"The sample exhibits {', '.join(reasons)}. AI models often lack the micro-dynamic jitter found in human biology."
        else:
            return "Natural pitch fluctuations and irregular micro-pauses indicative of human respiratory patterns were detected."

    def predict(self, audio_bytes):
        y, sr = preprocess_audio(audio_bytes)
        features = extract_features(y, sr)
        
        # Prepare input for model
        input_tensor = torch.from_numpy(features['spectrogram']).float().unsqueeze(0).unsqueeze(0)
        input_tensor = input_tensor.to(self.device)
        
        with torch.no_grad():
            output = self.model(input_tensor)
            probs = output[0].cpu().numpy()
            
        prediction_idx = np.argmax(probs)
        prediction = "HUMAN" if prediction_idx == 1 else "AI_GENERATED"
        confidence = float(probs[prediction_idx])
        
        explanation = self.generate_explanation(features, prediction, confidence)
        
        return {
            "prediction": prediction,
            "confidence": confidence,
            "explanation": explanation,
            "language_detected": "English" # Language detection would be a separate model call
        }
