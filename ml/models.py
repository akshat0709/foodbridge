import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from feature_engineering import prepare_features, FEATURE_COLUMNS

class ModelManager:
    def __init__(self):
        self.active_model_name = "GradientBoostingRegressor"
        self.models = {}
        self.metrics = {}
        self.feature_importance = {}
        self.residual_std = 2.4
        self.baseline_mae = 1.95
        self.version = "v1.2.0"
        self.test_predictions = []
        self.residuals = []
        self._initialize_default_models()

    def _initialize_default_models(self):
        # Generate synthetic realistic training data if cold-starting
        np.random.seed(42)
        n = 5000
        dates = pd.date_range(start="2025-01-01", periods=n, freq="4h")
        df_sim = pd.DataFrame({
            "messId": np.random.choice(["mess_1", "mess_2", "mess_3"], size=n),
            "date": dates,
            "mealType": np.random.choice(["BREAKFAST", "LUNCH", "SNACKS", "DINNER"], size=n),
            "foodCategory": np.random.choice(["RICE_GRAINS", "CURRY_DAL", "ROTI_BREAD", "VEGETABLES", "DESSERT_SNACK"], size=n),
            "plannedAttendance": np.random.randint(400, 950, size=n),
            "preparedKg": np.random.uniform(35.0, 160.0, size=n),
            "isHoliday": np.random.choice([0, 1], p=[0.85, 0.15], size=n),
            "isExamWeek": np.random.choice([0, 1], p=[0.80, 0.20], size=n),
        })
        # Synthetic leftover with realistic physics
        df_sim["leftoverKg"] = (
            df_sim["preparedKg"] * 0.08
            + (df_sim["isHoliday"] * 4.5)
            + np.where(df_sim["mealType"] == "DINNER", 3.2, 0.0)
            + np.where(df_sim["foodCategory"] == "RICE_GRAINS", 4.0, 0.0)
            + np.random.normal(0, 1.8, size=n)
        ).clip(lower=0.5)

        self.train_all(df_sim)

    def train_all(self, df: pd.DataFrame):
        X, y = prepare_features(df)
        if len(X) < 100:
            raise ValueError("Insufficient rows for model training (requires >= 100).")

        # STRICT TIME-BASED TRAIN/TEST SPLIT (never random)
        split_idx = int(len(X) * 0.80)
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

        candidates = {
            "LinearRegression": LinearRegression(),
            "RandomForestRegressor": RandomForestRegressor(n_estimators=80, max_depth=10, random_state=42),
            "GradientBoostingRegressor": GradientBoostingRegressor(n_estimators=90, learning_rate=0.08, max_depth=4, random_state=42),
        }

        self.metrics = {}
        for name, model in candidates.items():
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            mae = float(mean_absolute_error(y_test, preds))
            rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
            r2 = float(r2_score(y_test, preds))

            self.models[name] = model
            self.metrics[name] = {
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "r2": round(r2, 3),
            }

        # Store active model details
        active_model = self.models[self.active_model_name]
        test_preds = active_model.predict(X_test)
        residuals = y_test - test_preds
        self.residual_std = float(residuals.std())

        # Feature importances
        if hasattr(active_model, "feature_importances_"):
            fi = dict(zip(FEATURE_COLUMNS, [round(float(v), 3) for v in active_model.feature_importances_]))
            self.feature_importance = dict(sorted(fi.items(), key=lambda item: item[1], reverse=True))
        else:
            self.feature_importance = {col: round(1.0 / len(FEATURE_COLUMNS), 3) for col in FEATURE_COLUMNS}

        # Sample 50 points for Predicted vs Actual chart
        indices = np.linspace(0, len(y_test) - 1, min(50, len(y_test)), dtype=int)
        self.test_predictions = [
            {
                "index": int(i),
                "actual": round(float(y_test.iloc[idx]), 1),
                "predicted": round(float(test_preds[idx]), 1),
                "residual": round(float(residuals.iloc[idx]), 1),
            }
            for i, idx in enumerate(indices)
        ]

        # Sample residuals distribution
        self.residuals = [round(float(r), 2) for r in residuals.iloc[::max(1, len(residuals) // 80)]]
        self.baseline_mae = self.metrics[self.active_model_name]["mae"]

    def predict_single(self, input_dict: dict):
        df_single = pd.DataFrame([input_dict])
        X, _ = prepare_features(df_single)
        model = self.models.get(self.active_model_name, list(self.models.values())[0])
        pred_val = float(model.predict(X)[0])
        pred_val = max(0.5, round(pred_val, 1))

        # 90% Prediction Interval: pred +/- 1.645 * residual_std
        lower_bound = max(0.0, round(pred_val - 1.645 * self.residual_std, 1))
        upper_bound = round(pred_val + 1.645 * self.residual_std, 1)

        # Plain language operator recommendation
        meal = input_dict.get("mealType", "DINNER")
        cat = input_dict.get("foodCategory", "RICE_GRAINS").replace("_", " ").lower()
        excess = max(0.0, round(pred_val - 2.5, 1))
        rec_text = (
            f"Reduce {cat} preparation for {meal.capitalize()} by ~{excess} kg. "
            f"Predicted leftover is {pred_val} kg (90% prediction interval: {lower_bound} to {upper_bound} kg). "
            f"Expected savings: ₹{int(excess * 60)}."
        )

        return {
            "predictedLeftoverKg": pred_val,
            "predictionInterval": {
                "lower": lower_bound,
                "upper": upper_bound,
                "confidencePct": 90,
            },
            "recommendationText": rec_text,
            "modelUsed": self.active_model_name,
        }

    def simulate_what_if(self, planned_attendance: int, prepared_kg: float, meal_type: str, food_category: str):
        input_data = {
            "plannedAttendance": planned_attendance,
            "preparedKg": prepared_kg,
            "mealType": meal_type,
            "foodCategory": food_category,
            "dayOfWeek": 3,
            "isHoliday": 0,
            "isExamWeek": 0,
            "lag1_leftover": 12.0,
            "lag7_leftover": 13.0,
            "rolling7_mean": 12.5,
        }
        res = self.predict_single(input_data)
        predicted_leftover = res["predictedLeftoverKg"]
        cost_saved_rs = round((prepared_kg - predicted_leftover) * 60)
        return {
            "attendance": planned_attendance,
            "preparedKg": prepared_kg,
            "predictedLeftoverKg": predicted_leftover,
            "wastePercentage": round((predicted_leftover / max(prepared_kg, 1.0)) * 100, 1),
            "estimatedCostSavedRs": max(0, cost_saved_rs),
            "recommendation": res["recommendationText"],
        }

    def evaluate_drift(self):
        current_mae = self.metrics.get(self.active_model_name, {}).get("mae", 1.95)
        drift_delta = round(current_mae - self.baseline_mae, 2)
        has_drift = drift_delta > 1.2
        return {
            "currentMae": current_mae,
            "baselineMae": self.baseline_mae,
            "driftDelta": drift_delta,
            "driftFlag": has_drift,
            "status": "DRIFT_DETECTED" if has_drift else "STABLE",
            "activeModel": self.active_model_name,
            "version": self.version,
        }
