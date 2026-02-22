
import torch
import torch.nn as nn

class VoiceDetectorModel(nn.Module):
    def __init__(self, num_classes=2):
        super(VoiceDetectorModel, self).__init__()
        # Input shape: (Batch, 1, 128, 128) - Mel Spectrogram
        self.conv_layers = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            
            nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            
            nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
        )
        
        # LSTM for temporal dependencies
        self.lstm = nn.LSTM(input_size=128 * 16, hidden_size=128, num_layers=2, batch_first=True, bidirectional=True)
        
        self.classifier = nn.Sequential(
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes),
            nn.Softmax(dim=1)
        )

    def forward(self, x):
        # x: [Batch, 1, 128, 128]
        x = self.conv_layers(x)
        # Flatten for LSTM - [Batch, 16, 128 * 16] assuming pooled size
        batch_size, channels, h, w = x.size()
        x = x.view(batch_size, h, channels * w)
        
        x, _ = self.lstm(x)
        x = x[:, -1, :] # Take last output of LSTM
        
        logits = self.classifier(x)
        return logits
