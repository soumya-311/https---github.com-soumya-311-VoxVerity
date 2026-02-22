
import librosa
import numpy as np
import soundfile as sf
import io
import base64

def preprocess_audio(audio_bytes, target_sr=22050, duration=5):
    # Load audio
    y, sr = librosa.load(io.BytesIO(audio_bytes), sr=target_sr)
    
    # Normalize
    y = librosa.util.normalize(y)
    
    # Trim or pad to fixed duration
    target_length = target_sr * duration
    if len(y) > target_length:
        y = y[:target_length]
    else:
        y = np.pad(y, (0, target_length - len(y)))
        
    return y, target_sr

def extract_features(y, sr):
    # Mel Spectrogram
    mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128)
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
    
    # MFCCs
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
    
    # Spectral Contrast
    spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    
    # Zero Crossing Rate
    zcr = librosa.feature.zero_crossing_rate(y)
    
    return {
        "spectrogram": mel_spec_db,
        "mfccs": mfccs,
        "spectral_contrast": spectral_contrast,
        "zcr": zcr,
        "mean_pitch": np.mean(librosa.yin(y, fmin=50, fmax=2000))
    }
