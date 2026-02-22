
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
import base64
from inference import InferenceEngine
import uvicorn

app = FastAPI(title="VoxVerity API", version="1.0.0")
engine = InferenceEngine()

# Mock API Key database
API_KEYS = {"vx_test_12345"}

class DetectionRequest(BaseModel):
    audio_base64: str

def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key not in API_KEYS:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return x_api_key

@app.post("/detect-voice", dependencies=[Depends(verify_api_key)])
async def detect_voice(request: DetectionRequest):
    try:
        # Decode base64
        audio_data = base64.b64decode(request.audio_base64)
        
        # Limit size (10MB)
        if len(audio_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Audio file too large")
            
        # Run inference
        result = engine.predict(audio_data)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
