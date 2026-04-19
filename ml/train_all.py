"""
train_all.py
============
One-command trainer. Runs in this order:
  1. Generate data (if not already done)
  2. Train Urgency Forecaster
  3. Train HDI Predictor
  4. Run smoke tests on all models

Usage: python train_all.py
"""

import subprocess, sys, os

def run(script, cwd=None):
    result = subprocess.run([sys.executable, script], cwd=cwd, capture_output=False)
    if result.returncode != 0:
        print(f"ERROR running {script}")
        sys.exit(1)

# ── Step 1: Generate data ────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODELS_DIR = os.path.dirname(__file__) + "/models"

print("=" * 60)
print("STEP 1: Generating 12-year synthetic dataset")
print("=" * 60)
os.chdir(DATA_DIR)
run("generate_data.py")

# ── Step 2: Train Urgency Forecaster ────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 2: Training Urgency Forecaster")
print("=" * 60)
os.chdir(MODELS_DIR)
# Copy datasets path
import shutil
os.makedirs("datasets", exist_ok=True)
for f in ["budget_history.csv", "sector_indicators.csv", "outcomes.csv", "district_meta.csv"]:
    src = os.path.join(DATA_DIR, "datasets", f)
    dst = os.path.join(MODELS_DIR, "datasets", f)
    shutil.copy2(src, dst)

run("urgency_forecaster.py")

# ── Step 3: Train HDI Predictor ─────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 3: Training HDI Predictor")
print("=" * 60)
run("hdi_predictor.py")

# ── Step 4: Smoke tests ──────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 4: Running causal DAG smoke test")
print("=" * 60)
run("causal_dag.py")

print("\n" + "=" * 60)
print("STEP 5: Running NSGA-II optimizer smoke test")
print("=" * 60)
run("nsga2_optimizer.py")

print("\n" + "=" * 60)
print("STEP 6: Running explainer smoke test")
print("=" * 60)
run("explainer.py")

print("\n" + "✅ " * 20)
print("ALL MODELS TRAINED SUCCESSFULLY")
print("Saved models in: ml/models/saved_models/")
print("  - urgency_model.pkl + urgency_scaler.pkl")
print("  - hdi_model.pkl + hdi_scaler.pkl")
print("\nNow run: uvicorn main:app --reload --port 8000")
