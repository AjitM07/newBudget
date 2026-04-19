"""
urgency_forecaster.py
=====================
Trains a Random Forest model to predict sector urgency scores
(what each district NEEDS next year).

This replaces the dummy LSTM in your current code with a real trained model.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os, json

os.makedirs("saved_models", exist_ok=True)

SECTORS = ["Healthcare", "Education", "Infrastructure", "Agriculture", "Welfare"]
URGENCY_COLS = [f"urgency_{s.lower()}" for s in SECTORS]

# ── Feature engineering ──────────────────────────────────────────────────────

FEATURE_COLS = [
    # Population & economy
    "population", "gdp_per_capita",
    # Healthcare features
    "infant_mortality_rate", "hospital_beds_per1000",
    "doctor_ratio_per1000", "health_coverage_gap",
    # Education features
    "enrollment_rate", "dropout_rate", "literacy_rate", "pupil_teacher_ratio",
    # Infrastructure features
    "road_density", "electrification_pct", "water_access_pct",
    # Agriculture features
    "crop_yield_index", "irrigation_coverage", "agri_gdp_share",
    # Welfare features
    "poverty_rate", "gini_coefficient", "unemployment_rate",
    # Previous year's allocations (what policy was in effect)
    "alloc_healthcare", "alloc_education", "alloc_infrastructure",
    "alloc_agriculture", "alloc_welfare",
    # Time feature
    "year",
]


def load_and_merge():
    indicators = pd.read_csv("datasets/sector_indicators.csv")
    budget     = pd.read_csv("datasets/budget_history.csv")
    outcomes   = pd.read_csv("datasets/outcomes.csv")

    df = indicators.merge(
        budget[["district_id", "year"] + [f"alloc_{s.lower()}" for s in SECTORS]],
        on=["district_id", "year"]
    ).merge(outcomes, on=["district_id", "year"])

    return df


def build_lag_features(df):
    """
    For each district, create lag-1 features so the model knows
    last year's urgency + allocations when predicting THIS year.
    This simulates time-series awareness without a full LSTM.
    """
    df = df.sort_values(["district_id", "year"]).copy()

    for col in URGENCY_COLS + [f"alloc_{s.lower()}" for s in SECTORS]:
        df[f"lag1_{col}"] = df.groupby("district_id")[col].shift(1)

    # Drop rows where lag features are NaN (first year per district)
    df = df.dropna(subset=[f"lag1_{URGENCY_COLS[0]}"])
    return df


def train_urgency_model(df):
    # Add lag features
    df = build_lag_features(df)

    # Extended feature set including lags
    lag_cols = [f"lag1_{u}" for u in URGENCY_COLS] + \
               [f"lag1_alloc_{s.lower()}" for s in SECTORS]
    feature_cols = FEATURE_COLS + lag_cols

    X = df[feature_cols].values
    y = df[URGENCY_COLS].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    # Gradient Boosting per target (best accuracy for tabular data)
    model = MultiOutputRegressor(
        GradientBoostingRegressor(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            random_state=42
        ),
        n_jobs=-1
    )

    model.fit(X_train_s, y_train)

    # Evaluation
    y_pred = model.predict(X_test_s)
    mae    = mean_absolute_error(y_test, y_pred)
    r2     = r2_score(y_test, y_pred)
    print(f"  Urgency Forecaster → MAE: {mae:.2f}  |  R²: {r2:.4f}")

    per_sector = {}
    for i, s in enumerate(SECTORS):
        s_mae = mean_absolute_error(y_test[:, i], y_pred[:, i])
        s_r2  = r2_score(y_test[:, i], y_pred[:, i])
        per_sector[s] = {"mae": round(s_mae, 2), "r2": round(s_r2, 4)}
        print(f"    {s:<18} MAE={s_mae:.2f}  R²={s_r2:.4f}")

    # Save
    joblib.dump(model,  "saved_models/urgency_model.pkl")
    joblib.dump(scaler, "saved_models/urgency_scaler.pkl")
    joblib.dump(feature_cols, "saved_models/urgency_feature_cols.pkl")

    metrics = {"overall": {"mae": round(mae, 2), "r2": round(r2, 4)}, "per_sector": per_sector}
    with open("saved_models/urgency_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    return model, scaler, feature_cols, df


def predict_urgency(district_id: str, year: int, df_history=None):
    """
    Predict urgency scores for a given district and year.
    Uses latest available indicator data as input.
    """
    model       = joblib.load("saved_models/urgency_model.pkl")
    scaler      = joblib.load("saved_models/urgency_scaler.pkl")
    feature_cols= joblib.load("saved_models/urgency_feature_cols.pkl")

    if df_history is None:
        df_history = load_and_merge()
        df_history = build_lag_features(df_history)

    # Get latest row for this district
    dist_df = df_history[df_history["district_id"] == district_id].sort_values("year")

    if dist_df.empty:
        # Unknown district: use national averages
        dist_df = df_history.sort_values("year")

    latest = dist_df.iloc[-1].copy()
    latest["year"] = year

    # Build feature vector
    X = latest[feature_cols].values.reshape(1, -1)
    X_s = scaler.transform(X)

    pred = model.predict(X_s)[0]
    pred = np.clip(pred, 0, 100)

    return [
        {
            "sector":       SECTORS[i],
            "urgencyScore": round(float(pred[i]), 1),
            "forecastedNeed": round(float(pred[i]) / 100, 3),
            "trend": round(float(pred[i] - latest.get(URGENCY_COLS[i], pred[i])), 1)
        }
        for i in range(len(SECTORS))
    ]


if __name__ == "__main__":
    print("Loading and merging datasets...")
    df = load_and_merge()
    print(f"  Total rows: {len(df)}")

    print("\nTraining Urgency Forecaster...")
    model, scaler, feature_cols, df_lag = train_urgency_model(df)

    print("\nTest prediction for MH_PUNE, year 2024:")
    result = predict_urgency("MH_PUNE", 2024)
    for r in result:
        print(f"  {r['sector']:<18} urgency={r['urgencyScore']}  trend={r['trend']:+.1f}")
