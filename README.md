# SpendSmart AI 🧠💰

Intelligent personal finance analytics backend — parses transaction CSVs, detects spending patterns, generates actionable insights, and simulates savings.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **CSV Parsing:** PapaParse
- **File Upload:** Multer (in-memory)
- **Storage:** None — fully in-memory processing

## Quick Start

```bash
npm install
npm run dev      # starts on http://localhost:3000
```

## API Endpoints

### `GET /`
Health check — returns server info and available endpoints.

### `POST /upload`
Upload and parse a CSV file.

**Request:** `multipart/form-data` with field `file` (CSV)

**CSV columns:** `Date`, `Merchant`, `Amount`, `Category`

**Response:**
```json
{
  "success": true,
  "transactions": [...],
  "errors": [],
  "rowCount": 30
}
```

### `POST /analyze`
Run full analytics pipeline on parsed transactions.

**Request:** `application/json`
```json
{ "transactions": [...] }
```

**Response:**
```json
{
  "analytics": { "totalSpend", "categoryBreakdown", "weeklySpending", "topMerchants" },
  "patterns": [...],
  "insights": [...],
  "healthScore": { "score": 62, "label": "Moderate" }
}
```

### `POST /simulate`
Simulate savings with percentage reductions.

**Request:** `application/json`
```json
{
  "transactions": [...],
  "reductions": {
    "foodReduction": 20,
    "travelReduction": 15,
    "entertainmentReduction": 25
  }
}
```

**Response:**
```json
{
  "simulation": { "monthlySavings": 3086.5, "yearlySavings": 37038 }
}
```

## Project Structure

```
src/
├── types/index.ts          # Shared TypeScript interfaces
├── services/
│   ├── parser.ts           # Step 1: CSV parsing & validation
│   ├── analytics.ts        # Step 2+3: Analytics engine & pattern detection
│   ├── insights.ts         # Step 4+5: Recommendation engine & savings estimation
│   ├── scoring.ts          # Step 6: Financial health score (0-100)
│   └── simulator.ts        # Step 7: Savings simulator
├── routes/
│   ├── upload.ts           # POST /upload
│   ├── analyze.ts          # POST /analyze
│   └── simulate.ts         # POST /simulate
├── server.ts               # Express entry point
└── test.ts                 # Integration test script
```

## Testing

```bash
npx ts-node src/test.ts
```

## Sample CSV

A `sample.csv` is included with 30 transactions across 7 categories for testing.
