from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from predictor import KidneyDiseasePredictor

app = FastAPI(title=" Chronic Kidney Disease Classification API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = KidneyDiseasePredictor()

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    result = predictor.predict(contents, filename=file.filename)
    return result

@app.get("/health")
def health_check():
    return {"status": "healthy"}
