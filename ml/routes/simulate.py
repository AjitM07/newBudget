from fastapi import APIRouter
from pydantic import BaseModel
import pandas as pd
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from models.causal_dag import simulate_scenario

router = APIRouter()

class SimulateRequest(BaseModel):
    region_id: str
    sector: str
    change_percent: float

@router.post("")
def simulate(req: SimulateRequest):
    outcomes_df = pd.read_csv(
        os.path.join(os.path.dirname(__file__), "../datasets/outcomes.csv")
    )
    dist_out = outcomes_df[outcomes_df["district_id"] == req.region_id].sort_values("year")
    if dist_out.empty:
        dist_out = outcomes_df.sort_values("year")
    base = dist_out.iloc[-1].to_dict()

    return simulate_scenario(req.sector, req.change_percent, base)
