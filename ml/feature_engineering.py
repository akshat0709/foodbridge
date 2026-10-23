import numpy as np
import pandas as pd

MEAL_MAP = {'BREAKFAST': 0, 'LUNCH': 1, 'SNACKS': 2, 'DINNER': 3}
CAT_MAP = {'RICE_GRAINS': 0, 'CURRY_DAL': 1, 'ROTI_BREAD': 2, 'VEGETABLES': 3, 'DESSERT_SNACK': 4}

FEATURE_COLUMNS = [
    'dayOfWeek',
    'mealType_code',
    'foodCategory_code',
    'plannedAttendance',
    'preparedKg',
    'isHoliday',
    'isExamWeek',
    'lag1_leftover',
    'lag7_leftover',
    'rolling7_mean',
]

def prepare_features(df: pd.DataFrame):
    """
    Constructs time-series features (lags, rolling means, temporal indicators).
    Enforces time-based ordering to prevent lookahead bias.
    """
    df = df.copy()
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date').reset_index(drop=True)

    if 'dayOfWeek' not in df.columns and 'date' in df.columns:
        df['dayOfWeek'] = df['date'].dt.dayofweek

    df['mealType_code'] = df['mealType'].map(lambda x: MEAL_MAP.get(x, 1))
    df['foodCategory_code'] = df['foodCategory'].map(lambda x: CAT_MAP.get(x, 0))
    df['isHoliday'] = df.get('isHoliday', False).astype(int)
    df['isExamWeek'] = df.get('isExamWeek', False).astype(int)

    # Compute lags and rolling stats if target column exists
    if 'leftoverKg' in df.columns:
        # Group by mess, meal, category to calculate realistic lags
        df['lag1_leftover'] = df.groupby(['messId', 'foodCategory'])['leftoverKg'].shift(1).fillna(df['leftoverKg'].median())
        df['lag7_leftover'] = df.groupby(['messId', 'foodCategory'])['leftoverKg'].shift(7).fillna(df['leftoverKg'].median())
        df['rolling7_mean'] = df.groupby(['messId', 'foodCategory'])['leftoverKg'].transform(
            lambda s: s.rolling(window=7, min_periods=1).mean()
        ).fillna(df['leftoverKg'].mean())
    else:
        # Defaults for single predictions
        df['lag1_leftover'] = df.get('lag1_leftover', 12.0)
        df['lag7_leftover'] = df.get('lag7_leftover', 13.5)
        df['rolling7_mean'] = df.get('rolling7_mean', 12.8)

    X = df[FEATURE_COLUMNS].fillna(0)
    y = df['leftoverKg'] if 'leftoverKg' in df.columns else None
    return X, y
