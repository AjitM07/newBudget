from fastapi import APIRouter
import pandas as pd
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from models.urgency_forecaster import predict_urgency, load_and_merge, build_lag_features

router = APIRouter()
_df_cache = None

def get_df():
    global _df_cache
    if _df_cache is None:
        _df_cache = build_lag_features(load_and_merge())
    return _df_cache

@router.get("/{region_id}")
def get_forecast(region_id: str):
    df = get_df()
    return predict_urgency(region_id, 2024, df)
