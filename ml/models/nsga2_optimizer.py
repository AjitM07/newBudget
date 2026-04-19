"""
nsga2_optimizer.py
==================
Multi-objective budget allocation optimizer using NSGA-II.
Uses the TRAINED HDI model (not a formula) as the objective function.
This is what makes the system genuinely ML-powered.
"""

import numpy as np
import joblib
import json
from pymoo.algorithms.moo.nsga2 import NSGA2
from pymoo.core.problem import Problem
from pymoo.optimize import minimize
from pymoo.termination import get_termination

SECTORS = ["Healthcare", "Education", "Infrastructure", "Agriculture", "Welfare"]


class MLPoweredBudgetProblem(Problem):
    """
    The core optimization problem.
    Decision variables: budget allocation fractions per sector (5 values, sum to 1)
    Objectives (all minimized by pymoo convention):
      f1: -HDI (predicted by trained ML model) → maximize HDI
      f2: Gini-like inequality across sector allocations
      f3: Deviation from previous year's allocations (stability shock)
      f4: -Urgency satisfaction score (give more to urgent sectors)
    """

    def __init__(self, district_indicators: dict, prev_allocations: dict,
                 urgency_scores: dict, total_budget: float):
        self.district_indicators = district_indicators
        self.prev_alloc  = np.array([prev_allocations.get(s, 0.20) for s in SECTORS])
        self.urgency     = np.array([urgency_scores.get(s, 50.0)   for s in SECTORS]) / 100.0
        self.total_budget= total_budget

        # Load trained HDI model
        self.hdi_model   = joblib.load("saved_models/hdi_model.pkl")
        self.hdi_scaler  = joblib.load("saved_models/hdi_scaler.pkl")
        self.hdi_features= joblib.load("saved_models/hdi_feature_cols.pkl")

        super().__init__(
            n_var=len(SECTORS),
            n_obj=4,
            n_ieq_constr=1,          # sum-to-1 constraint
            xl=np.full(len(SECTORS), 0.05),   # min 5% per sector
            xu=np.full(len(SECTORS), 0.50),   # max 50% per sector
        )

    def _predict_hdi_batch(self, X_norm: np.ndarray) -> np.ndarray:
        """Vectorized HDI prediction for a batch of allocations."""
        n = X_norm.shape[0]
        rows = []
        base = self.district_indicators

        for i in range(n):
            row = {k: v for k, v in base.items()}
            for j, s in enumerate(SECTORS):
                row[f"alloc_{s.lower()}"] = float(X_norm[i, j])
            row["log_total_budget"] = np.log1p(self.total_budget)
            rows.append([row.get(f, 0) for f in self.hdi_features])

        X_feat = np.array(rows)
        X_s    = self.hdi_scaler.transform(X_feat)
        return self.hdi_model.predict(X_s)

    def _evaluate(self, X, out, *args, **kwargs):
        # Normalize each row to sum to 1
        X_norm = X / X.sum(axis=1, keepdims=True)

        # f1: Maximize HDI (minimize negative)
        hdi_preds = self._predict_hdi_batch(X_norm)
        f1 = -hdi_preds

        # f2: Sector inequality (std dev of allocations)
        f2 = np.std(X_norm, axis=1)

        # f3: Reallocation shock (sum of |new - old|)
        f3 = np.sum(np.abs(X_norm - self.prev_alloc), axis=1)

        # f4: Urgency mismatch (penalize under-funding urgent sectors)
        # Urgency-weighted deviation: sectors with high urgency should get proportional allocation
        urgency_target = self.urgency / self.urgency.sum()
        f4 = np.sum(np.abs(X_norm - urgency_target) * self.urgency, axis=1)

        out["F"] = np.column_stack([f1, f2, f3, f4])
        out["G"] = (np.abs(X_norm.sum(axis=1) - 1.0) - 0.01).reshape(-1, 1)


def run_optimization(district_indicators: dict,
                     prev_allocations: dict,
                     urgency_scores: dict,
                     total_budget: float,
                     n_gen: int = 80,
                     pop_size: int = 100) -> dict:
    """
    Run NSGA-II and return:
    - best_allocation: single best balanced allocation
    - pareto_front: list of all Pareto-optimal solutions
    """
    problem = MLPoweredBudgetProblem(
        district_indicators, prev_allocations, urgency_scores, total_budget
    )

    algorithm = NSGA2(pop_size=pop_size, eliminate_duplicates=True)
    termination = get_termination("n_gen", n_gen)

    res = minimize(problem, algorithm, termination, seed=42, verbose=False)

    pareto_solutions = []
    for i, x in enumerate(res.X):
        x_norm = x / x.sum()
        alloc  = {SECTORS[j]: round(float(x_norm[j]), 4) for j in range(len(SECTORS))}
        pareto_solutions.append({
            "allocations": alloc,
            "hdi":         round(float(-res.F[i, 0]), 4),
            "gini":        round(float(res.F[i, 1]),  4),
            "shock":       round(float(res.F[i, 2]),  4),
            "urgency_fit": round(float(res.F[i, 3]),  4),
        })

    # Sort by HDI descending for display
    pareto_solutions.sort(key=lambda x: -x["hdi"])

    # Best balanced solution = minimum sum of normalized objectives
    F_norm = (res.F - res.F.min(axis=0)) / (np.ptp(res.F, axis=0) + 1e-9)
    # Weights: HDI most important, then urgency fit, then shock, then gini
    weights = np.array([0.40, 0.20, 0.25, 0.15])
    scores  = (F_norm * weights).sum(axis=1)
    best_idx = np.argmin(scores)

    best_x    = res.X[best_idx] / res.X[best_idx].sum()
    best_alloc = {SECTORS[j]: round(float(best_x[j]), 4) for j in range(len(SECTORS))}

    return {
        "best_allocation": best_alloc,
        "pareto_front":    pareto_solutions[:40],  # top 40 for UI
        "n_solutions":     len(pareto_solutions),
        "best_hdi":        pareto_solutions[0]["hdi"] if pareto_solutions else 0,
    }


if __name__ == "__main__":
    import pandas as pd

    print("Loading sample district data...")
    indicators = pd.read_csv("datasets/sector_indicators.csv")
    budget     = pd.read_csv("datasets/budget_history.csv")

    # Use Pune 2023 as test
    dist_id = "MH_PUNE"
    ind_row = indicators[(indicators["district_id"] == dist_id) & (indicators["year"] == 2023)].iloc[0].to_dict()
    bud_row = budget[(budget["district_id"] == dist_id) & (budget["year"] == 2023)].iloc[0]

    district_indicators = {**ind_row, "total_budget": float(bud_row["total_budget"])}
    prev_alloc   = {s: float(bud_row[f"alloc_{s.lower()}"]) for s in SECTORS}
    urgency_scores = {"Healthcare": 55, "Education": 62, "Infrastructure": 38, "Agriculture": 44, "Welfare": 68}

    print(f"Running NSGA-II for {dist_id} with budget ₹{district_indicators['total_budget']:,.0f}")
    result = run_optimization(district_indicators, prev_alloc, urgency_scores, district_indicators["total_budget"])

    print(f"\nBest Allocation (out of {result['n_solutions']} Pareto solutions):")
    for s, v in result["best_allocation"].items():
        bar = "█" * int(v * 30)
        print(f"  {s:<18} {v*100:5.1f}%  {bar}")
    print(f"\nPredicted HDI: {result['best_hdi']:.4f}")
    print(f"\nPareto frontier has {len(result['pareto_front'])} solutions")
    print("Sample Pareto solutions (HDI vs Gini tradeoff):")
    for sol in result["pareto_front"][:5]:
        print(f"  HDI={sol['hdi']:.4f}  Gini={sol['gini']:.4f}  Shock={sol['shock']:.4f}")
