from fastapi import APIRouter
import pandas as pd
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from models.explainer import explain_full_allocation

router = APIRouter()

@router.get("/{sector}/{region_id}")
def explain(sector: str, region_id: str, allocation: float = 0.2):
    indicators_df = pd.read_csv(
        os.path.join(os.path.dirname(__file__), "../datasets/sector_indicators.csv")
    )
    dist = indicators_df[indicators_df["district_id"] == region_id].sort_values("year")
    if dist.empty:
        dist = indicators_df.sort_values("year")
    ind_row = dist.iloc[-1].to_dict()

    from models.nsga2_optimizer import SECTORS
    alloc = {s: 0.2 for s in SECTORS}
    alloc[sector] = allocation
    result = explain_full_allocation(alloc, ind_row)
    return result
