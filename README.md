# FoodBridge — Big Data Food Redistribution & Waste-Prediction Platform

> **Internal Operations & Logistics Platform Connecting Hostel Messes with Partner NGOs**  
> Course Project: Big Data Analytics & Distributed Systems Architecture

FoodBridge is a production-grade internal operations tool built for high-throughput food redistribution, empirical aggregation performance benchmarking, and machine learning waste forecasting.

---

## 1. System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React + Vite, Port 5173)"]
        UI["Restrained Operations UI<br/>(Tailwind Tokens, Tabular Numerals)"]
        Inspector["Pipeline Inspector Drawer<br/>(explain executionStats)"]
        Map["Leaflet Geospatial Map<br/>(2dsphere Proximity & Hotspots)"]
    end

    subgraph Server["Backend API Gateway (Express + TypeScript, Port 5050)"]
        Auth["JWT Auth & RBAC Middleware<br/>(MESS_ADMIN, NGO_REP, PLATFORM_ADMIN)"]
        AtomicEngine["Atomic Claiming Engine<br/>(findOneAndUpdate Precondition)"]
        SpatialEngine["Geospatial Matching Engine<br/>($geoNear + Weighted Scoring)"]
        AggPipelines["Big Data Aggregation Service<br/>($facet, $lookup, $group, $dateTrunc)"]
        DataQuality["Data Quality & Streaming Ingest<br/>(bulkWrite + Per-Row Isolation)"]
        ReportGen["PDFKit Server-side Vector Reports"]
    end

    subgraph ML["ML Forecasting Microservice (FastAPI + Python 3.14, Port 8000)"]
        Features["Feature Engineering<br/>(Lags, Rolling 7-day Means, Time Indicators)"]
        TrainSplit["Strict Time-Based Train/Test Split (80/20)"]
        Models["GBDT, Random Forest & Linear Regression"]
        Drift["Model Monitoring & Drift Detection"]
    end

    subgraph Storage["Database Tier (MongoDB 8.2)"]
        DB[(MongoDB Database 'foodbridge')]
        Indexes["Indexes: 2dsphere on location<br/>Compound: {status: 1, collectBy: 1}<br/>Compound: {messId: 1, date: -1, mealType: 1}<br/>TTL Index: 90 days on audit_logs"]
        SummaryColl["Cold-Tier Archived Summaries<br/>(meal_summaries)"]
    end

    UI -->|HTTP / JSON / Bearer JWT| Auth
    Auth --> AtomicEngine
    Auth --> SpatialEngine
    Auth --> AggPipelines
    Auth --> DataQuality
    Auth --> ReportGen

    SpatialEngine -->|2dsphere Spherical Query| DB
    AtomicEngine -->|Atomic State Transition| DB
    AggPipelines -->|Aggregation & explain('executionStats')| DB
    DataQuality -->|Chunked bulkWrite| DB

    Server -->|HTTP POST /predict, /train, /metrics| ML
    ML --> Features
    Features --> TrainSplit
    TrainSplit --> Models
    Models --> Drift
```

---

## 2. Tech Stack & Engineering Standards

- **Frontend:** React 18, Vite, React Router v6, TanStack Query, Recharts, Leaflet with OpenStreetMap tiles. Custom Tailwind design token system (warm off-white `#F8F7F4`, near-black `#18181B`, deep green `#166534`, warning amber `#D97706`, error brick red `#B91C1C`), tabular numerals, hairline borders, no neon/glow.
- **Backend:** Node.js v25, Express, Mongoose, Zod validation, JWT with role-based access control, express-rate-limit, Helmet security headers, CORS, PDFKit server-side report generator.
- **Database:** MongoDB 8.2 with `2dsphere` geospatial indexes, compound performance indexes, 90-day TTL index on `audit_logs`, and cold-tier partition archival into `meal_summaries`.
- **Machine Learning Microservice:** Python FastAPI, Scikit-learn, Pandas, NumPy, Uvicorn. Exposes `/train`, `/predict`, `/what-if`, `/metrics`, and `/drift`.
- **Quality Bar:** Lean reads (`lean()`), cursor/keyset pagination, no unindexed full collection scans in production queries, document write atomicity for race condition immunity.

---

## 3. Demo Credentials (RBAC Roles)

All accounts are pre-seeded with password: `Pass1234!`

| Role | Email | Password | Primary Interfaces |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `platform.admin@foodbridge.org` | `Pass1234!` | Overview KPIs, Analytics Explorer, Matching Lab, Forecast Lab, Data Quality, Benchmarks, Settings, Reports |
| **Mess Admin** | `mess.admin@foodbridge.org` | `Pass1234!` | Report Surplus, My Listings, Meal Preparation Log, Waste Forecast & What-If, Mess Analytics |
| **NGO Representative** | `ngo.rep@foodbridge.org` | `Pass1234!` | Nearby Surplus (List + Leaflet Map), My Pickups (Collect/Complete), Service Area Settings, Performance Leaderboard |

*Note: The UI includes a 1-click Role Switcher in the top bar and login screen for instantaneous testing without manually re-typing credentials.*

---

## 4. Key Big Data Analytics Features

### 1. Synthetic Data Generator (`scripts/generate_dataset.js`)
- Generates 60 campus hostel messes, 25 partner NGOs, 24 months of daily logs (100k+ to 1M records).
- Realistic calendar dynamics: weekend drops (-30%), exam month erratic attendance, Indian festivals (Diwali, Pongal, Holi, Eid, Christmas), over-preparing chronic messes, unreliable NGO profiles.
- Injects 1-2% dirty rows (negative quantities, future timestamps in year 2099, missing categories, schema violations) to test the Data Quality pipeline.
- CLI Scale flag: `--scale 10k | 100k | 300k | 1M | 5M`.

### 2. Multi-Stage Aggregation Explorer & Pipeline Inspector
- Dynamic filters (Date, Mess, NGO, Meal Session, Staple Category) drive pipelines using `$match`, `$group`, `$lookup`, `$facet`, `$sort`, and `$dateTrunc`.
- **Pipeline Inspector Drawer:** Next to every chart, operators can click **"Show query"** to inspect:
  - Exact MongoDB aggregation JSON stages.
  - Query latency in milliseconds.
  - Documents examined vs returned.
  - Scan type: `IXSCAN` (Index scan) vs `COLLSCAN` (Table scan) from `explain("executionStats")`.

### 3. Big Data Benchmarks Harness (`scripts/run_benchmarks.js` & UI)
- Runs 8 representative analytical queries at multiple scales:
  1. `Q1_AGG_WASTE_BY_MESS`: High-cardinality aggregation with `$lookup` join.
  2. `Q2_DONATED_VS_REDISTRIBUTED`: Time-series bucket grouping.
  3. `Q3_HEATMAP_WEEKDAY_MEAL`: 2D multi-field grouping.
  4. `Q4_CATEGORY_PARETO`: Staple category Pareto distribution.
  5. `Q5_GEOSPATIAL_RADIUS_SEARCH`: `$geoNear` 2dsphere proximity search.
  6. `Q6_ANOMALY_FILTER_SCAN`: Compound index query on `{ isAnomaly: 1, date: -1 }`.
  7. `Q7_COMPOUND_LISTING_LOOKUP`: Urgent available surplus lookup on `{ status: 1, collectBy: 1 }`.
  8. `Q8_MONTHLY_SUMMARY_FACET`: Parallel multi-facet execution.
- Measures latency, memory, throughput (records/sec), and speedup factor (typically 3x to 15x faster with composite indexes).

### 4. Atomic Claiming Concurrency Protection
- NGO reservation uses atomic `findOneAndUpdate` with precondition:
  ```typescript
  Listing.findOneAndUpdate(
    { _id: listingId, status: 'AVAILABLE' },
    { $set: { status: 'RESERVED', claimedByNgoId: ngoId, claimedAt: new Date() } }
  );
  ```
- If two NGOs attempt simultaneous claims, exactly **one** wins; the loser receives `409 Conflict`.
- Verified by automated concurrent integration test (`server/test/atomicClaim.test.ts`).

### 5. Multi-Factor Geospatial Matching Engine
- Calculates candidates via `$geoNear` within certified service radius.
- Computes weighted score across 4 normalized factors:
  - **Distance Score (35%):** Proximity decay relative to service radius.
  - **Capacity Fit Score (25%):** Vehicle payload vs batch surplus weight.
  - **Deadline Margin (20%):** Remaining time window vs estimated transit time (dispatch + loading + travel).
  - **Bayesian Reliability (20%):** Smoothed success rate $(C \times \text{prior} + \text{completed}) / (C + \text{assigned})$ adjusted by time-of-day profile.
- All weights are tunable in real time by Platform Admins in the **Matching Lab**.

### 6. Machine Learning Forecast Lab & What-If Simulator
- Microservice in Python FastAPI using Scikit-Learn.
- Models: Linear Regression, Random Forest, and Gradient Boosting Regressor.
- Evaluates: MAE, RMSE, $R^2$, feature importances, and residuals distribution.
- **Strict time-based train/test split (80/20 by date)** to prevent data leakage.
- Generates 90% prediction intervals: $\hat{y} \pm 1.645 \times \sigma_{\text{residuals}}$.
- Plain-language operator recommendation: *"Reduce rice for Thursday dinner by about 8 kg; prediction 11.2 kg, plausible range 8.5-14 kg; expected saving ₹480"*.
- Continuous drift monitoring flags degradation when MAE exceeds baseline threshold.

### 7. Data Quality & Streaming Ingestion
- Real-time audit of completeness %, duplicate rate %, out-of-range counts, late-logged records, and physical feasibility (served $\le$ prepared).
- Streaming CSV/JSON bulk importer with chunked `bulkWrite()` and row-level rejection isolation report.

### 8. Data Lifecycle & Partition Archival
- Automatic 90-day expiration on raw `audit_logs` using native MongoDB TTL index.
- Cold-tier archival rolls up daily meal records older than $N$ months into monthly summary vectors in `meal_summaries`, freeing heap and index memory.

### 9. PySpark Distributed Comparison (`scripts/pyspark_waste_benchmark.py`)
- Benchmark comparing in-memory PySpark Catalyst optimizer vs MongoDB indexed aggregation at 1M+ rows.

---

## 5. Local Setup & Execution Guide

### Prerequisites
- Node.js $\ge$ 20.0 (Tested on Node 25)
- MongoDB $\ge$ 6.0 (Running locally on default port 27017)
- Python $\ge$ 3.10 (Tested on Python 3.14)

### Quick Start (All Services)

1. **Install Dependencies:**
   ```bash
   # Root & Server
   cd server && npm install
   # Client
   cd ../client && npm install
   # ML Service
   cd ../ml && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
   ```

2. **Generate Seed Dataset (100k Records):**
   ```bash
   cd ../server
   npx tsx ../scripts/generate_dataset.js --scale 100k
   ```

3. **Start the ML Microservice (Port 8000):**
   ```bash
   cd ../ml
   source venv/bin/activate
   uvicorn main:app --port 8000 --host 127.0.0.1
   ```

4. **Start the Backend API Server (Port 5050):**
   ```bash
   cd ../server
   npm run dev
   ```

5. **Start the Frontend Client (Port 5173):**
   ```bash
   cd ../client
   npm run dev
   ```

Open `http://localhost:5173` in your browser.

---

## 6. Running Tests

```bash
cd server
npm test
```

Executes:
- `server/test/scoring.test.ts`: Verifies matching engine penalty functions, capacity limits, and deadline margins.
- `server/test/atomicClaim.test.ts`: Fires 5 concurrent race-condition claims on the same listing and proves document-level write atomicity.

---

## 7. Postman API Collection

Import `scripts/postman_collection.json` into Postman or Insomnia to access pre-configured requests with variables and authorization headers.
