"""
explainer.py
============
Generates human-readable SHAP-like explanations for WHY
a sector received a certain allocation.
Uses the trained HDI model's feature importances + marginal contributions.
"""

import numpy as np
import pandas as pd
import joblib
import json

SECTORS = ["Healthcare", "Education", "Infrastructure", "Agriculture", "Welfare"]

# Human-readable feature descriptions
FEATURE_LABELS = {
    "alloc_healthcare":       "Healthcare budget share",
    "alloc_education":        "Education budget share",
    "alloc_infrastructure":   "Infrastructure budget share",
    "alloc_agriculture":      "Agriculture budget share",
    "alloc_welfare":          "Welfare budget share",
    "gdp_per_capita":         "GDP per capita",
    "poverty_rate":           "Poverty rate",
    "literacy_rate":          "Literacy rate",
    "infant_mortality_rate":  "Infant mortality rate",
    "road_density":           "Road density",
    "gini_coefficient":       "Income inequality (Gini)",
    "dropout_rate":           "School dropout rate",
    "unemployment_rate":      "Unemployment rate",
    "enrollment_rate":        "School enrollment rate",
    "hospital_beds_per1000":  "Hospital beds per 1000 people",
    "water_access_pct":       "Water access coverage",
    "electrification_pct":    "Electrification rate",
}

# Thresholds for contextual text generation
INDICATOR_THRESHOLDS = {
    "infant_mortality_rate":  {"high": 40, "medium": 25, "label": "infant mortality"},
    "literacy_rate":          {"high": 80, "low":  60,   "label": "literacy rate"},
    "poverty_rate":           {"high": 25, "medium": 15, "label": "poverty rate"},
    "road_density":           {"low":  0.8, "medium": 1.5, "label": "road density"},
    "dropout_rate":           {"high": 15, "medium": 8,   "label": "school dropout rate"},
    "unemployment_rate":      {"high": 8,  "medium": 5,   "label": "unemployment rate"},
}


def compute_shap_values(district_indicators: dict, allocation: dict) -> dict:
    """
    Compute feature attribution scores using marginal perturbation.
    Returns dict of {feature: shap_value} sorted by |impact|.
    """
    model        = joblib.load("saved_models/hdi_model.pkl")
    scaler       = joblib.load("saved_models/hdi_scaler.pkl")
    feature_cols = joblib.load("saved_models/hdi_feature_cols.pkl")

    row = {**district_indicators}
    for s in SECTORS:
        row[f"alloc_{s.lower()}"] = allocation.get(s, 0.20)
    row["log_total_budget"] = np.log1p(district_indicators.get("total_budget", 100000))

    base_X   = np.array([[row.get(f, 0) for f in feature_cols]])
    base_X_s = scaler.transform(base_X)
    base_pred= model.predict(base_X_s)[0]

    shap_vals = {}
    key_features = (
        [f"alloc_{s.lower()}" for s in SECTORS] +
        list(INDICATOR_THRESHOLDS.keys()) +
        ["gdp_per_capita", "hospital_beds_per1000", "water_access_pct", "electrification_pct"]
    )

    for feat in key_features:
        if feat not in feature_cols:
            continue
        original = row.get(feat, 0)
        perturb  = original * 1.10 + 0.001
        row[feat] = perturb
        pert_X   = np.array([[row.get(f, 0) for f in feature_cols]])
        pert_X_s = scaler.transform(pert_X)
        shap_vals[feat] = float(model.predict(pert_X_s)[0] - base_pred)
        row[feat] = original

    return dict(sorted(shap_vals.items(), key=lambda x: -abs(x[1])))


def generate_sector_explanation(sector: str, allocation_pct: float,
                                  district_indicators: dict,
                                  shap_vals: dict) -> str:
    """
    Generate a human-readable sentence explaining why a sector got its allocation.
    """
    reasons = []

    if sector == "Healthcare":
        imr = district_indicators.get("infant_mortality_rate", 30)
        beds = district_indicators.get("hospital_beds_per1000", 1.5)
        if imr > INDICATOR_THRESHOLDS["infant_mortality_rate"]["high"]:
            reasons.append(f"infant mortality rate is critically high at {imr:.1f}/1000")
        elif imr > INDICATOR_THRESHOLDS["infant_mortality_rate"]["medium"]:
            reasons.append(f"infant mortality rate ({imr:.1f}/1000) is above target")
        if beds < 1.5:
            reasons.append(f"only {beds:.1f} hospital beds per 1000 (WHO target: 3)")

    elif sector == "Education":
        dropout = district_indicators.get("dropout_rate", 10)
        lit = district_indicators.get("literacy_rate", 75)
        if dropout > INDICATOR_THRESHOLDS["dropout_rate"]["high"]:
            reasons.append(f"school dropout rate is high at {dropout:.1f}%")
        if lit < INDICATOR_THRESHOLDS["literacy_rate"]["low"]:
            reasons.append(f"literacy rate ({lit:.1f}%) is below national average")

    elif sector == "Infrastructure":
        road = district_indicators.get("road_density", 1.2)
        elec = district_indicators.get("electrification_pct", 80)
        water = district_indicators.get("water_access_pct", 70)
        if road < INDICATOR_THRESHOLDS["road_density"]["low"]:
            reasons.append(f"road density ({road:.2f} km/km²) is critically low")
        if elec < 85:
            reasons.append(f"electrification is incomplete at {elec:.1f}%")
        if water < 75:
            reasons.append(f"water access gap at {water:.1f}% coverage")

    elif sector == "Agriculture":
        irr = district_indicators.get("irrigation_coverage", 50)
        crop = district_indicators.get("crop_yield_index", 100)
        if irr < 50:
            reasons.append(f"only {irr:.1f}% irrigation coverage")
        if crop < 110:
            reasons.append(f"crop yield index ({crop:.1f}) below productive threshold")

    elif sector == "Welfare":
        poverty = district_indicators.get("poverty_rate", 20)
        gini    = district_indicators.get("gini_coefficient", 0.35)
        unemp   = district_indicators.get("unemployment_rate", 6)
        if poverty > INDICATOR_THRESHOLDS["poverty_rate"]["high"]:
            reasons.append(f"poverty rate is high at {poverty:.1f}%")
        if gini > 0.38:
            reasons.append(f"income inequality (Gini: {gini:.3f}) requires intervention")
        if unemp > INDICATOR_THRESHOLDS["unemployment_rate"]["high"]:
            reasons.append(f"unemployment at {unemp:.1f}%")

    if not reasons:
        return f"{sector} received {allocation_pct:.1f}% based on standard need assessment."

    reason_text = "; ".join(reasons)
    return f"{sector} received {allocation_pct:.1f}% because: {reason_text}."


def explain_full_allocation(allocation: dict, district_indicators: dict) -> dict:
    """
    Full explanation package for the UI ShapExplainer component.
    Returns:
    - shap_values: for the waterfall/bar chart
    - sector_explanations: text per sector
    - summary: one-line overall rationale
    """
    shap_vals    = compute_shap_values(district_indicators, allocation)
    explanations = {}
    for s, v in allocation.items():
        explanations[s] = generate_sector_explanation(s, v * 100, district_indicators, shap_vals)

    # Top-2 urgency drivers
    urgent_sectors = sorted(allocation.items(), key=lambda x: -x[1])[:2]
    summary = f"Priority sectors are {urgent_sectors[0][0]} ({urgent_sectors[0][1]*100:.1f}%) and {urgent_sectors[1][0]} ({urgent_sectors[1][1]*100:.1f}%), driven by district-level socio-economic indicators."

    return {
        "shap_values":         {FEATURE_LABELS.get(k, k): round(v * 1000, 3) for k, v in list(shap_vals.items())[:10]},
        "sector_explanations": explanations,
        "summary":             summary,
    }


if __name__ == "__main__":
    import pandas as pd

    indicators_df = pd.read_csv("datasets/sector_indicators.csv")
    budget_df     = pd.read_csv("datasets/budget_history.csv")

    dist = "UP_VARANASI"
    ind  = indicators_df[(indicators_df["district_id"] == dist) & (indicators_df["year"] == 2023)].iloc[0].to_dict()
    bud  = budget_df[(budget_df["district_id"] == dist) & (budget_df["year"] == 2023)].iloc[0]
    alloc= {"Healthcare": 0.26, "Education": 0.28, "Infrastructure": 0.20, "Agriculture": 0.14, "Welfare": 0.12}
    ind["total_budget"] = float(bud["total_budget"])

    print(f"Explanations for {dist}:\n")
    result = explain_full_allocation(alloc, ind)

    print("Summary:", result["summary"])
    print("\nSector explanations:")
    for s, txt in result["sector_explanations"].items():
        print(f"  [{s}] {txt}")

    print("\nTop SHAP features:")
    for feat, val in list(result["shap_values"].items())[:6]:
        print(f"  {feat:<35} {val:+.3f}")
