from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
from models import ModelManager

app = FastAPI(title="FoodBridge ML Forecasting Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ModelManager()

class PredictRequest(BaseModel):
    messId: Optional[str] = "default_mess"
    mealType: str = "DINNER"
    foodCategory: str = "RICE_GRAINS"
    plannedAttendance: int = 650
    preparedKg: float = 75.0
    dayOfWeek: Optional[int] = 3
    isHoliday: Optional[bool] = False
    isExamWeek: Optional[bool] = False
    lag1_leftover: Optional[float] = 12.0
    lag7_leftover: Optional[float] = 14.0
    rolling7_mean: Optional[float] = 13.0

class WhatIfRequest(BaseModel):
    attendance: int = 600
    preparedKg: float = 70.0
    mealType: str = "DINNER"
    foodCategory: str = "RICE_GRAINS"

class TrainRequest(BaseModel):
    records: Optional[List[Dict[str, Any]]] = None
    model_name: Optional[str] = None

@app.get("/health")
def health():
    return {"status": "healthy", "service": "FoodBridge ML Service", "model": manager.active_model_name}

@app.get("/metrics")
def get_metrics():
    return {
        "activeModel": manager.active_model_name,
        "version": manager.version,
        "models": manager.metrics,
        "featureImportance": manager.feature_importance,
        "predictedVsActual": manager.test_predictions,
        "residualsDistribution": manager.residuals,
        "baselineMae": manager.baseline_mae,
    }

@app.post("/predict")
def predict_waste(req: PredictRequest):
    try:
        data = req.dict()
        res = manager.predict_single(data)
        return {"success": True, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/what-if")
def simulate(req: WhatIfRequest):
    try:
        res = manager.simulate_what_if(req.attendance, req.preparedKg, req.mealType, req.foodCategory)
        return {"success": True, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/drift")
def check_drift():
    return manager.evaluate_drift()

@app.post("/train")
def train_model(req: TrainRequest):
    try:
        if req.model_name and req.model_name in manager.models:
            manager.active_model_name = req.model_name

        if req.records and len(req.records) >= 50:
            df = pd.DataFrame(req.records)
            manager.train_all(df)
            manager.version = f"v{float(manager.version.replace('v', '')) + 0.1:.1f}.0"

        return {
            "success": True,
            "message": f"Trained successfully. Active model: {manager.active_model_name}",
            "metrics": manager.metrics,
            "version": manager.version,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
