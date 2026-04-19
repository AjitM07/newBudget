"""
hdi_predictor.py
================
Trains a model to predict HDI score given:
- Current socio-economic indicators
- Proposed budget allocation fractions

This is the core model NSGA-II uses as its objective function.
Instead of a formula, it's a learned mapping from real data.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import json
import os

os.makedirs("saved_models", exist_ok=True)

SECTORS = ["Healthcare", "Education", "Infrastructure", "Agriculture", "Welfare"]


def load_training_data():
    indicators = pd.read_csv("datasets/sector_indicators.csv")
    budget     = pd.read_csv("datasets/budget_history.csv")
    outcomes   = pd.read_csv("datasets/outcomes.csv")

    df = indicators.merge(
        budget[["district_id", "year"] + [f"alloc_{s.lower()}" for s in SECTORS] + ["total_budget"]],
        on=["district_id", "year"]
    ).merge(outcomes[["district_id", "year", "hdi_score"]], on=["district_id", "year"])

    return df


HDI_FEATURE_COLS = [
    # Socio-economic context (fixed inputs)
    "gdp_per_capita", "population",
    "infant_mortality_rate", "literacy_rate", "dropout_rate",
    "hospital_beds_per1000", "road_density", "electrification_pct",
    "poverty_rate", "gini_coefficient", "enrollment_rate",
    "crop_yield_index", "unemployment_rate", "water_access_pct",
    "irrigation_coverage",
    # Budget allocation fractions (the DECISION variables)
    "alloc_healthcare", "alloc_education", "alloc_infrastructure",
    "alloc_agriculture", "alloc_welfare",
    # Budget size (log-scaled for stability)
    "log_total_budget",
    # Time
    "year",
]


def train_hdi_model(df):
    df = df.copy()
    df["log_total_budget"] = np.log1p(df["total_budget"])

    X = df[HDI_FEATURE_COLS].values
    y = df["hdi_score"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    model = GradientBoostingRegressor(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        min_samples_leaf=3,
        random_state=42
    )
    model.fit(X_train_s, y_train)

    y_pred = model.predict(X_test_s)
    mae = mean_absolute_error(y_test, y_pred)
    r2  = r2_score(y_test, y_pred)
    print(f"  HDI Predictor → MAE: {mae:.5f}  |  R²: {r2:.4f}")

    # Feature importances for SHAP-like explanation
    importances = dict(zip(HDI_FEATURE_COLS, model.feature_importances_))
    top_features = sorted(importances.items(), key=lambda x: -x[1])[:10]
    print("  Top 5 features:")
    for feat, imp in top_features[:5]:
        print(f"    {feat:<35} {imp:.4f}")

    joblib.dump(model,  "saved_models/hdi_model.pkl")
    joblib.dump(scaler, "saved_models/hdi_scaler.pkl")
    joblib.dump(HDI_FEATURE_COLS, "saved_models/hdi_feature_cols.pkl")

    metrics = {
        "mae": round(mae, 6),
        "r2":  round(r2, 4),
        "feature_importances": {k: round(v, 5) for k, v in importances.items()}
    }
    with open("saved_models/hdi_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    return model, scaler


def predict_hdi(district_indicators: dict, allocation: dict) -> float:
    """
    Predict HDI for a district given proposed allocation.
    
    Args:
        district_indicators: dict with indicator values
        allocation: dict like {"Healthcare": 0.25, "Education": 0.28, ...}
    Returns:
        Predicted HDI score (0 to 1)
    """
    model       = joblib.load("saved_models/hdi_model.pkl")
    scaler      = joblib.load("saved_models/hdi_scaler.pkl")
    feature_cols= joblib.load("saved_models/hdi_feature_cols.pkl")

    row = {**district_indicators}
    for s in SECTORS:
        row[f"alloc_{s.lower()}"] = allocation.get(s, 0.2)
    row["log_total_budget"] = np.log1p(district_indicators.get("total_budget", 100000))

    X = np.array([[row.get(f, 0) for f in feature_cols]])
    X_s = scaler.transform(X)
    pred = model.predict(X_s)[0]
    return float(np.clip(pred, 0, 1))


def get_shap_values(district_indicators: dict, allocation: dict) -> dict:
    """
    Manual feature attribution using marginal contributions.
    Approximates SHAP without the shap library dependency.
    """
    model       = joblib.load("saved_models/hdi_model.pkl")
    scaler      = joblib.load("saved_models/hdi_scaler.pkl")
    feature_cols= joblib.load("saved_models/hdi_feature_cols.pkl")

    row = {**district_indicators}
    for s in SECTORS:
        row[f"alloc_{s.lower()}"] = allocation.get(s, 0.2)
    row["log_total_budget"] = np.log1p(district_indicators.get("total_budget", 100000))

    base_X = np.array([[row.get(f, 0) for f in feature_cols]])
    base_X_s = scaler.transform(base_X)
    base_pred = model.predict(base_X_s)[0]

    # Focus SHAP on the allocation features + top context features
    explain_feats = (
        [f"alloc_{s.lower()}" for s in SECTORS] +
        ["gdp_per_capita", "poverty_rate", "literacy_rate",
         "infant_mortality_rate", "road_density", "gini_coefficient",
         "dropout_rate", "unemployment_rate"]
    )

    attributions = {}
    for feat in explain_feats:
        original = row.get(feat, 0)
        # Perturb feature slightly
        row[feat] = original * 1.1 + 0.001
        pert_X    = np.array([[row.get(f, 0) for f in feature_cols]])
        pert_X_s  = scaler.transform(pert_X)
        pert_pred = model.predict(pert_X_s)[0]
        attributions[feat] = round(float(pert_pred - base_pred), 6)
        row[feat] = original   # restore

    return attributions


if __name__ == "__main__":
    print("Loading training data...")
    df = load_training_data()
    print(f"  Total rows: {len(df)}")

    print("\nTraining HDI Predictor...")
    model, scaler = train_hdi_model(df)

    # Quick test
    sample = df.iloc[-1].to_dict()
    alloc  = {s: sample[f"alloc_{s.lower()}"] for s in SECTORS}
    pred   = predict_hdi(sample, alloc)
    actual = sample["hdi_score"]
    print(f"\nTest: actual HDI={actual:.4f}  predicted={pred:.4f}  diff={abs(pred-actual):.4f}")

    print("\nSHAP-like attributions (top features):")
    shap_vals = get_shap_values(sample, alloc)
    for k, v in sorted(shap_vals.items(), key=lambda x: -abs(x[1]))[:6]:
        bar = "+" if v > 0 else "-"
        print(f"  {k:<35} {v:+.6f} {'▲' if v>0 else '▼'}")
