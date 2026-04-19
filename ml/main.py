"""
main.py  — BudgetOS ML Microservice (FastAPI)
=============================================
Start: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys, os

# Make sure models/ is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "models"))

from routes.forecast import router as forecast_router
from routes.optimize import router as optimize_router
from routes.simulate import router as simulate_router
from routes.explain  import router as explain_router

app = FastAPI(
    title="BudgetOS ML Service",
    description="ML-powered public budget allocation optimization",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast_router, prefix="/forecast", tags=["Forecast"])
app.include_router(optimize_router, prefix="/optimize", tags=["Optimize"])
app.include_router(simulate_router, prefix="/simulate", tags=["Simulate"])
app.include_router(explain_router,  prefix="/explain",  tags=["Explain"])


@app.get("/health")
def health():
    return {"status": "ok", "models": ["urgency_forecaster", "hdi_predictor", "nsga2", "causal_dag"]}


@app.get("/districts")
def list_districts():
    """Returns all district IDs and names available in the dataset."""
    import pandas as pd
    base = os.path.join(os.path.dirname(__file__), "models", "datasets")
    meta = pd.read_csv(os.path.join(base, "district_meta.csv"))
    return meta.to_dict(orient="records")
