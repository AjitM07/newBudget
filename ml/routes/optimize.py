from fastapi import APIRouter
from pydantic import BaseModel
import pandas as pd
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from models.urgency_forecaster import predict_urgency, load_and_merge, build_lag_features
from models.nsga2_optimizer import run_optimization, SECTORS
from models.explainer import explain_full_allocation

router = APIRouter()
_df_cache = None

def get_df():
    global _df_cache
    if _df_cache is None:
        _df_cache = build_lag_features(load_and_merge())
    return _df_cache

class OptimizeRequest(BaseModel):
    region_id: str
    total_budget: float

@router.post("")
def optimize(req: OptimizeRequest):
    df = get_df()
    indicators_df = pd.read_csv(
        os.path.join(os.path.dirname(__file__), "../datasets/sector_indicators.csv")
    )
    budget_df = pd.read_csv(
        os.path.join(os.path.dirname(__file__), "../datasets/budget_history.csv")
    )

    # Get latest district data
    dist_ind = indicators_df[indicators_df["district_id"] == req.region_id].sort_values("year")
    if dist_ind.empty:
        dist_ind = indicators_df.sort_values("year")
    ind_row = dist_ind.iloc[-1].to_dict()
    ind_row["total_budget"] = req.total_budget

    dist_bud = budget_df[budget_df["district_id"] == req.region_id].sort_values("year")
    if dist_bud.empty:
        dist_bud = budget_df.sort_values("year")
    bud_row = dist_bud.iloc[-1]
    prev_alloc = {s: float(bud_row.get(f"alloc_{s.lower()}", 0.20)) for s in SECTORS}

    # Predict urgency with trained model
    urgency_list = predict_urgency(req.region_id, 2024, df)
    urgency_scores = {u["sector"]: u["urgencyScore"] for u in urgency_list}

    # Run NSGA-II optimization
    result = run_optimization(ind_row, prev_alloc, urgency_scores, req.total_budget,
                              n_gen=50, pop_size=80)

    # Generate explanations
    explain = explain_full_allocation(result["best_allocation"], ind_row)

    return {
        "allocations":   result["best_allocation"],
        "paretoFront":   result["pareto_front"],
        "shapValues":    explain["shap_values"],
        "explanations":  explain["sector_explanations"],
        "summary":       explain["summary"],
    }
