
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import os
import glob
from audio_utils import preprocess_audio, extract_features
from model import VoiceDetectorModel

class VoiceDataset(Dataset):
    def __init__(self, data_dir, transform=None):
        self.files = []
        self.labels = []
        
        # Load Human data
        for f in glob.glob(os.path.join(data_dir, "human", "*.wav")):
            self.files.append(f)
            self.labels.append(1) # Human
            
        # Load AI data
        for f in glob.glob(os.path.join(data_dir, "ai_generated", "*.wav")):
            self.files.append(f)
            self.labels.append(0) # AI
            
    def __len__(self):
        return len(self.files)
        
    def __getitem__(self, idx):
        file_path = self.files[idx]
        with open(file_path, 'rb') as f:
            audio_bytes = f.read()
        
        y, sr = preprocess_audio(audio_bytes)
        features = extract_features(y, sr)
        spec = features['spectrogram']
        
        # Data Augmentation could be added here (pitch shift, noise)
        
        return torch.from_numpy(spec).float().unsqueeze(0), torch.tensor(self.labels[idx])

def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = VoiceDetectorModel().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    dataset = VoiceDataset("./data")
    train_loader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    num_epochs = 20
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            
        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {running_loss/len(train_loader)}")
        
    torch.save(model.state_dict(), "voice_detector.pth")
    print("Training complete. Model saved.")

if __name__ == "__main__":
    train()
