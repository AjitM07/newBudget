"""
causal_dag.py
=============
Causal sector interdependency graph.
When you increase one sector's budget, downstream effects propagate.
"""

import numpy as np
import pandas as pd
import joblib
import json

SECTORS = ["Healthcare", "Education", "Infrastructure", "Agriculture", "Welfare"]
SECTOR_IDX = {s: i for i, s in enumerate(SECTORS)}

# Causal adjacency: CAUSAL_STRENGTH[i][j] = effect of sector i ON sector j's outcomes
# Values from domain knowledge + correlation in historical data
CAUSAL_STRENGTH = np.array([
#   Health  Educ   Infra  Agri   Welfare
    [0.00,  0.00,  0.00,  0.00,  0.25],   # Healthcare → Welfare (healthier = less poverty)
    [0.28,  0.00,  0.00,  0.12,  0.18],   # Education  → Health, Agri, Welfare
    [0.22,  0.00,  0.00,  0.25,  0.12],   # Infrastructure → Health access, Agri, Welfare
    [0.00,  0.00,  0.00,  0.00,  0.30],   # Agriculture → Welfare (food security)
    [0.00,  0.00,  0.00,  0.00,  0.00],   # Welfare (terminal node)
])

# Human-readable causal explanations per edge
CAUSAL_EXPLANATIONS = {
    ("Education",      "Healthcare"):     "Higher literacy → better preventive care adoption",
    ("Education",      "Agriculture"):    "Educated farmers adopt modern techniques → higher yield",
    ("Education",      "Welfare"):        "Education reduces poverty through employability",
    ("Infrastructure", "Healthcare"):     "Better roads → faster hospital access → better outcomes",
    ("Infrastructure", "Agriculture"):    "Irrigation infrastructure → higher crop productivity",
    ("Infrastructure", "Welfare"):        "Connectivity expands economic opportunities",
    ("Healthcare",     "Welfare"):        "Reduced medical burden → less poverty",
    ("Agriculture",    "Welfare"):        "Food security directly reduces poverty",
}


def propagate_ripple(sector_name: str, change_pct: float, depth: int = 2) -> dict:
    """
    Given a % change in one sector's budget, compute ripple effects
    on all other sectors' OUTCOME metrics.
    
    Returns: dict of {sector: ripple_effect_pct}
    """
    if sector_name not in SECTOR_IDX:
        return {}

    src_idx = SECTOR_IDX[sector_name]
    effects = {}

    # First-order effects
    for j, target in enumerate(SECTORS):
        strength = CAUSAL_STRENGTH[src_idx][j]
        if strength > 0 and target != sector_name:
            first_order = round(change_pct * strength, 2)
            effects[target] = effects.get(target, 0) + first_order

            # Second-order effects (depth=2)
            if depth >= 2:
                for k, target2 in enumerate(SECTORS):
                    strength2 = CAUSAL_STRENGTH[j][k]
                    if strength2 > 0 and target2 != sector_name and target2 != target:
                        second_order = round(change_pct * strength * strength2, 3)
                        effects[target2] = effects.get(target2, 0) + second_order

    # Round final values
    effects = {k: round(v, 2) for k, v in effects.items()}
    return effects


def explain_ripple(sector_name: str, effects: dict) -> list:
    """
    Returns human-readable explanations for each causal effect.
    """
    explanations = []
    for target, effect_pct in effects.items():
        key = (sector_name, target)
        if key in CAUSAL_EXPLANATIONS:
            explanations.append({
                "from": sector_name,
                "to":   target,
                "effect_pct": effect_pct,
                "reason": CAUSAL_EXPLANATIONS[key],
                "direction": "positive" if effect_pct > 0 else "negative"
            })
    return explanations


def simulate_scenario(sector_name: str, change_pct: float,
                       base_indicators: dict) -> dict:
    """
    Full scenario simulation:
    - Compute causal ripple
    - Project 5-year outcome trajectory
    Returns data ready for frontend LineChart
    """
    ripple = propagate_ripple(sector_name, change_pct)
    explanations = explain_ripple(sector_name, ripple)

    # 5-year projection baseline (compound growth)
    years     = list(range(2024, 2030))
    base_hdi  = base_indicators.get("hdi_score", 0.65)
    base_growth = 0.012  # 1.2% annual HDI growth baseline

    baseline  = []
    simulated = []
    for i, yr in enumerate(years):
        b = round(base_hdi * ((1 + base_growth) ** i), 4)
        # Simulation effect: immediate partial effect that compounds
        sim_boost = (change_pct / 100) * 0.08 * (i + 1)  # 8% of pct change per year
        s = round(b * (1 + sim_boost), 4)
        baseline.append({"year": yr, "value": b})
        simulated.append({"year": yr, "value": min(1.0, s)})

    return {
        "ripple":       ripple,
        "explanations": explanations,
        "projection": [
            {
                "year":     years[i],
                "baseline": round(baseline[i]["value"] * 100, 2),
                "simulated":round(simulated[i]["value"] * 100, 2),
            }
            for i in range(len(years))
        ]
    }


if __name__ == "__main__":
    print("Causal DAG Simulation Tests\n" + "="*40)

    for sector, change in [("Education", 15), ("Infrastructure", 10), ("Healthcare", -5)]:
        effects = propagate_ripple(sector, change)
        expls   = explain_ripple(sector, effects)
        print(f"\n{sector} budget {'+' if change>0 else ''}{change}%:")
        for k, v in effects.items():
            print(f"  → {k:<18} {v:+.2f}%")
        for e in expls:
            print(f"     └ {e['reason']}")

    print("\n\nFull scenario simulation for Infrastructure +10%:")
    base = {"hdi_score": 0.645}
    result = simulate_scenario("Infrastructure", 10, base)
    print("Ripple effects:", result["ripple"])
    print("5-year projection:")
    for p in result["projection"]:
        diff = p["simulated"] - p["baseline"]
        print(f"  {p['year']}: baseline={p['baseline']}  simulated={p['simulated']}  (+{diff:.2f})")
