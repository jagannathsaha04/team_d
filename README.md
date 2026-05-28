# SpendSmart AI Backend

This backend service powers SpendSmart AI. It accepts transaction CSV uploads, validates and normalizes data, performs spending analytics, detects patterns, generates actionable insights, calculates a financial health score, and simulates savings.

## Requirements

- Node.js 20+ (recommended)
- npm

## Install

```bash
cd spendsmart-ai
npm install
```

## Run Locally

```bash
cd spendsmart-ai
npm run dev
```

The backend listens on `http://localhost:3000` by default.

## Build

```bash
cd spendsmart-ai
npm run build
npm start
```

## API Endpoints

### `GET /`
Health check endpoint. Returns service metadata and available routes.

### `POST /upload`
Upload and parse a transaction CSV file.

- **Request:** `multipart/form-data` with field `file`
- **Expected CSV columns:** `Date`, `Merchant`, `Amount`, `Category`
- **Response:**

```json
{
  "success": true,
  "transactions": [
    { "date": "2024-01-02T00:00:00.000Z", "merchant": "swiggy", "amount": 450, "category": "food" }
  ],
  "errors": [],
  "rowCount": 30
}
```

### `POST /analyze`
Analyze parsed transactions through the SpendSmart pipeline.

- **Request:** `application/json`

```json
{ "transactions": [...] }
```

- **Response:**

```json
{
  "totalSpend": 22566,
  "categoryBreakdown": { "food": 6200, "transport": 2950 },
  "weeklySpending": { "2024-W01": 4200, "2024-W02": 5120 },
  "patterns": [...],
  "insights": [...],
  "healthScore": { "score": 66, "label": "Moderate" }
}
```

### `POST /simulate`
Run savings projections based on user reduction goals.

- **Request:** `application/json`

```json
{
  "transactions": [...],
  "foodReduction": 0.2,
  "travelReduction": 0.15,
  "entertainmentReduction": 0.25
}
```

- **Response:**

```json
{
  "success": true,
  "monthlySavings": 15.57,
  "yearlySavings": 186.84,
  "simulation": { "monthlySavings": 15.57, "yearlySavings": 186.84 },
  "appliedReductions": { "foodReduction": 0.2, "travelReduction": 0.15, "entertainmentReduction": 0.25 }
}
```

## How the Backend Works

1. **CSV Parsing & Validation** (`src/services/parser.ts`)
   - Uses `PapaParse` to parse uploads in memory.
   - Normalizes merchant and category text.
   - Converts amounts to positive numbers and rounds to 2 decimals.
   - Infers missing categories using a merchant-to-category fallback map.

2. **Analytics** (`src/services/analytics.ts`)
   - Computes total spend, transaction count, average transaction amount, and date range.
   - Builds category spend totals.
   - Aggregates weekly spend by ISO week.
   - Ranks top merchants by spend.

3. **Pattern Detection** (`src/services/analytics.ts`)
   - Detects overspending categories.
   - Flags weekend spending spikes.
   - Identifies frequent small spends and recurring/subscription-style merchant activity.

4. **Insights** (`src/services/insights.ts`)
   - Generates human-readable advice and savings estimates.
   - Produces titles and descriptions for each detected pattern.

5. **Health Score** (`src/services/scoring.ts`)
   - Calculates a score from 0–100 based on essential spending, overspending signals, weekly consistency, and potential savings.

6. **Savings Simulator** (`src/services/simulator.ts`)
   - Applies percentage reductions to food, travel, and entertainment spend.
   - Returns projected monthly and yearly savings.

## Project Structure

```text
spendsmart-ai/
├── sample.csv
├── src/
│   ├── routes/
│   │   ├── upload.ts
│   │   ├── analyze.ts
│   │   └── simulate.ts
│   ├── services/
│   │   ├── parser.ts
│   │   ├── analytics.ts
│   │   ├── insights.ts
│   │   ├── scoring.ts
│   │   └── simulator.ts
│   ├── types/index.ts
│   ├── server.ts
│   └── test.ts
├── package.json
└── tsconfig.json
```

## Testing

Run the integration test script to validate the full backend pipeline with the included sample CSV:

```bash
cd spendsmart-ai
npx ts-node src/test.ts
```

## Sample Data

The repository includes `spendsmart-ai/sample.csv` with 30 sample transactions across categories such as `food`, `transport`, `entertainment`, `shopping`, `groceries`, `utilities`, and `health`.
