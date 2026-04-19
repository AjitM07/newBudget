"""
generate_data.py
================
Generates 12 years (2012–2023) of realistic dummy budget + outcome data
for 15 Indian districts across 5 sectors.

Run: python generate_data.py
Outputs: datasets/budget_history.csv, datasets/sector_indicators.csv,
         datasets/outcomes.csv, datasets/district_meta.csv
"""

import numpy as np
import pandas as pd
import os

os.makedirs("datasets", exist_ok=True)

np.random.seed(42)

# ── 15 representative Indian districts ──────────────────────────────────────
DISTRICTS = [
    {"id": "MH_PUNE",    "name": "Pune",         "state": "Maharashtra",  "pop_2012": 9429408,  "gdp_base": 1250000},
    {"id": "MH_NAGPUR",  "name": "Nagpur",        "state": "Maharashtra",  "pop_2012": 4653570,  "gdp_base": 520000},
    {"id": "UP_LUCKNOW", "name": "Lucknow",       "state": "Uttar Pradesh","pop_2012": 4588455,  "gdp_base": 380000},
    {"id": "UP_VARANASI","name": "Varanasi",      "state": "Uttar Pradesh","pop_2012": 3676841,  "gdp_base": 210000},
    {"id": "RJ_JAIPUR",  "name": "Jaipur",        "state": "Rajasthan",    "pop_2012": 6626178,  "gdp_base": 560000},
    {"id": "RJ_JODHPUR", "name": "Jodhpur",       "state": "Rajasthan",    "pop_2012": 3685681,  "gdp_base": 220000},
    {"id": "KA_BANGALORE","name":"Bangalore Rural","state": "Karnataka",   "pop_2012": 988747,   "gdp_base": 980000},
    {"id": "KA_MYSORE",  "name": "Mysore",        "state": "Karnataka",    "pop_2012": 3001127,  "gdp_base": 310000},
    {"id": "TN_CHENNAI", "name": "Chennai",       "state": "Tamil Nadu",   "pop_2012": 7088000,  "gdp_base": 1450000},
    {"id": "TN_MADURAI", "name": "Madurai",       "state": "Tamil Nadu",   "pop_2012": 3038252,  "gdp_base": 190000},
    {"id": "WB_KOLKATA", "name": "Kolkata",       "state": "West Bengal",  "pop_2012": 4486679,  "gdp_base": 890000},
    {"id": "WB_HOWRAH",  "name": "Howrah",        "state": "West Bengal",  "pop_2012": 4841638,  "gdp_base": 260000},
    {"id": "GJ_AHMEDABAD","name":"Ahmedabad",     "state": "Gujarat",      "pop_2012": 7208200,  "gdp_base": 1100000},
    {"id": "MP_BHOPAL",  "name": "Bhopal",        "state": "Madhya Pradesh","pop_2012": 2371061, "gdp_base": 340000},
    {"id": "OR_BHUBANESWAR","name":"Bhubaneswar", "state": "Odisha",       "pop_2012": 837737,   "gdp_base": 180000},
]

SECTORS = ["Healthcare", "Education", "Infrastructure", "Agriculture", "Welfare"]
YEARS   = list(range(2012, 2024))   # 12 years

# ── Realistic budget allocation ranges per sector (fraction of total budget) ─
SECTOR_BASE_ALLOC = {
    "Healthcare":     0.22,
    "Education":      0.26,
    "Infrastructure": 0.21,
    "Agriculture":    0.17,
    "Welfare":        0.14,
}

# ── Outcome metric columns we will generate ─────────────────────────────────
# These simulate what we want the ML to learn to predict / optimize toward
OUTCOME_CONFIGS = {
    "infant_mortality_rate":   {"base": 45,  "dir": -1, "sector": "Healthcare",     "scale": 0.8},
    "literacy_rate":           {"base": 72,  "dir":  1, "sector": "Education",      "scale": 0.6},
    "road_density_km_per_sqkm":{"base": 1.2, "dir":  1, "sector": "Infrastructure","scale": 0.4},
    "crop_yield_index":        {"base": 100, "dir":  1, "sector": "Agriculture",    "scale": 0.5},
    "poverty_rate":            {"base": 28,  "dir": -1, "sector": "Welfare",        "scale": 0.7},
    "hdi_score":               {"base": 0.60,"dir":  1, "sector": None,             "scale": 0.3},
}


def district_noise(district_id, seed_extra=0):
    """Per-district noise seed so each district has its own trajectory."""
    return hash(district_id + str(seed_extra)) % 1000


def generate_budget_history():
    rows = []
    for d in DISTRICTS:
        did  = d["id"]
        seed = district_noise(did)
        np.random.seed(seed)

        # Total budget grows ~7-9% per year (with some variance)
        total = d["gdp_base"] * 0.12   # ~12% of GDP goes to district budget
        for year in YEARS:
            growth = np.random.uniform(1.06, 1.10)
            total  = total * growth

            # Sector allocations: base + drift + shock
            allocs = {}
            raw    = []
            for s in SECTORS:
                base  = SECTOR_BASE_ALLOC[s]
                drift = np.random.normal(0, 0.015)      # slow policy drift
                # Every few years simulate a "policy shock" (election year, crisis)
                shock = 0.03 * np.random.choice([-1, 0, 0, 0, 1])
                raw.append(max(0.05, base + drift + shock))

            # Normalize to sum to 1
            total_raw = sum(raw)
            allocs    = {s: r / total_raw for s, r in zip(SECTORS, raw)}

            row = {
                "district_id":   did,
                "district_name": d["name"],
                "state":         d["state"],
                "year":          year,
                "total_budget":  round(total, 0),
            }
            for s in SECTORS:
                row[f"alloc_{s.lower()}"]  = round(allocs[s], 4)
                row[f"amount_{s.lower()}"] = round(allocs[s] * total, 0)
            rows.append(row)
    return pd.DataFrame(rows)


def generate_sector_indicators(budget_df):
    """
    Socio-economic need indicators per district per year.
    These are the INPUT features to the ML model.
    """
    rows = []
    for d in DISTRICTS:
        did  = d["id"]
        seed = district_noise(did, 1)
        np.random.seed(seed)

        pop = d["pop_2012"]
        for year in YEARS:
            pop = pop * np.random.uniform(1.01, 1.025)   # 1-2.5% growth

            # Healthcare need indicators
            imr          = max(5, 50 - (year - 2012) * 1.2 + np.random.normal(0, 2))
            hospital_beds= max(0.3, 1.8 + (year - 2012) * 0.05 + np.random.normal(0, 0.1))
            doctor_ratio = max(0.1, 0.9 + (year - 2012) * 0.03 + np.random.normal(0, 0.05))
            coverage_gap_health = max(0, 0.35 - (year - 2012) * 0.015 + np.random.normal(0, 0.02))

            # Education indicators
            enroll_rate  = min(99, 82 + (year - 2012) * 0.8 + np.random.normal(0, 1))
            dropout_rate = max(1,  18 - (year - 2012) * 0.7 + np.random.normal(0, 1.2))
            literacy     = min(99, 74 + (year - 2012) * 0.6 + np.random.normal(0, 0.8))
            teacher_ratio= max(20, 42 - (year - 2012) * 0.5 + np.random.normal(0, 2))

            # Infrastructure indicators
            road_density  = max(0.5, 1.1 + (year - 2012) * 0.06 + np.random.normal(0, 0.05))
            electrification = min(100, 78 + (year - 2012) * 1.5 + np.random.normal(0, 1))
            water_access    = min(100, 65 + (year - 2012) * 1.8 + np.random.normal(0, 1.5))

            # Agriculture indicators
            crop_yield    = max(50, 100 + (year - 2012) * 2.5 + np.random.normal(0, 5))
            irrigation_pct= min(100, 48 + (year - 2012) * 1.0 + np.random.normal(0, 2))
            agri_gdp_share= max(5,  25  - (year - 2012) * 0.4 + np.random.normal(0, 1))

            # Welfare indicators
            poverty_rate  = max(5,  30  - (year - 2012) * 1.0 + np.random.normal(0, 2))
            gini_coeff    = max(0.25, 0.38 - (year - 2012) * 0.003 + np.random.normal(0, 0.005))
            unemployment  = max(2,   9   - (year - 2012) * 0.3 + np.random.normal(0, 0.5))

            # GDP per capita
            gdp_pc = d["gdp_base"] / d["pop_2012"] * (1.07 ** (year - 2012)) + np.random.normal(0, 500)

            rows.append({
                "district_id": did, "year": year,
                "population":        round(pop),
                "gdp_per_capita":    round(max(5000, gdp_pc)),
                # Healthcare
                "infant_mortality_rate":  round(imr, 1),
                "hospital_beds_per1000":  round(hospital_beds, 2),
                "doctor_ratio_per1000":   round(doctor_ratio, 2),
                "health_coverage_gap":    round(coverage_gap_health, 3),
                # Education
                "enrollment_rate":        round(enroll_rate, 1),
                "dropout_rate":           round(dropout_rate, 1),
                "literacy_rate":          round(literacy, 1),
                "pupil_teacher_ratio":    round(teacher_ratio, 1),
                # Infrastructure
                "road_density":           round(road_density, 3),
                "electrification_pct":    round(electrification, 1),
                "water_access_pct":       round(water_access, 1),
                # Agriculture
                "crop_yield_index":       round(crop_yield, 1),
                "irrigation_coverage":    round(irrigation_pct, 1),
                "agri_gdp_share":         round(agri_gdp_share, 1),
                # Welfare
                "poverty_rate":           round(poverty_rate, 1),
                "gini_coefficient":       round(gini_coeff, 4),
                "unemployment_rate":      round(unemployment, 1),
            })
    return pd.DataFrame(rows)


def generate_outcomes(budget_df, indicator_df):
    """
    HDI and composite scores as outcome labels —
    these are what the model learns to maximize.
    """
    merged = pd.merge(
        indicator_df,
        budget_df[["district_id", "year"] + [f"alloc_{s.lower()}" for s in SECTORS]],
        on=["district_id", "year"]
    )

    # HDI = weighted composite of education, health, income components
    merged["education_index"] = (merged["literacy_rate"] - 0) / 100 * 0.7 + \
                                 (1 - merged["dropout_rate"] / 100) * 0.3
    merged["health_index"]    = 1 - (merged["infant_mortality_rate"] / 80)
    merged["income_index"]    = np.log(merged["gdp_per_capita"]) / np.log(100000)

    merged["hdi_score"]       = (
        merged["education_index"] * 0.33 +
        merged["health_index"]    * 0.33 +
        merged["income_index"]    * 0.34
    ).clip(0, 1).round(4)

    # Urgency scores (0-100): how badly each sector NEEDS funding
    # Higher = more urgent = ML should recommend more allocation
    merged["urgency_healthcare"]    = (
        (merged["infant_mortality_rate"] / 50) * 40 +
        (merged["health_coverage_gap"]   / 0.4) * 35 +
        (1 - merged["doctor_ratio_per1000"] / 2.0) * 25
    ).clip(0, 100).round(1)

    merged["urgency_education"]     = (
        (merged["dropout_rate"] / 20)             * 40 +
        (1 - merged["enrollment_rate"] / 100)     * 35 +
        (merged["pupil_teacher_ratio"] / 50)      * 25
    ).clip(0, 100).round(1)

    merged["urgency_infrastructure"] = (
        (1 - merged["road_density"] / 3)          * 35 +
        (1 - merged["electrification_pct"] / 100) * 35 +
        (1 - merged["water_access_pct"] / 100)    * 30
    ).clip(0, 100).round(1)

    merged["urgency_agriculture"]   = (
        (1 - merged["irrigation_coverage"] / 80)  * 45 +
        (merged["agri_gdp_share"] / 30)            * 30 +
        (1 - merged["crop_yield_index"] / 160)     * 25
    ).clip(0, 100).round(1)

    merged["urgency_welfare"]       = (
        (merged["poverty_rate"] / 35)              * 45 +
        (merged["gini_coefficient"] / 0.45)        * 30 +
        (merged["unemployment_rate"] / 12)         * 25
    ).clip(0, 100).round(1)

    keep_cols = (
        ["district_id", "year", "hdi_score"] +
        [f"urgency_{s.lower()}" for s in SECTORS]
    )
    return merged[keep_cols]


def generate_district_meta():
    rows = []
    for d in DISTRICTS:
        rows.append({
            "district_id":    d["id"],
            "district_name":  d["name"],
            "state":          d["state"],
            "population_2012":d["pop_2012"],
            "gdp_base_lakh":  d["gdp_base"],
        })
    return pd.DataFrame(rows)


# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Generating budget history...")
    budget_df    = generate_budget_history()
    budget_df.to_csv("datasets/budget_history.csv", index=False)
    print(f"  → {len(budget_df)} rows saved to datasets/budget_history.csv")

    print("Generating sector indicators...")
    indicator_df = generate_sector_indicators(budget_df)
    indicator_df.to_csv("datasets/sector_indicators.csv", index=False)
    print(f"  → {len(indicator_df)} rows saved to datasets/sector_indicators.csv")

    print("Generating outcome labels...")
    outcome_df   = generate_outcomes(budget_df, indicator_df)
    outcome_df.to_csv("datasets/outcomes.csv", index=False)
    print(f"  → {len(outcome_df)} rows saved to datasets/outcomes.csv")

    print("Generating district metadata...")
    meta_df      = generate_district_meta()
    meta_df.to_csv("datasets/district_meta.csv", index=False)
    print(f"  → {len(meta_df)} rows saved to datasets/district_meta.csv")

    print("\nSample budget_history:")
    print(budget_df[budget_df["year"] == 2023][["district_name", "total_budget",
          "alloc_healthcare", "alloc_education", "alloc_infrastructure"]].to_string(index=False))

    print("\nSample outcome scores:")
    print(outcome_df[outcome_df["year"] == 2023].head(5).to_string(index=False))
