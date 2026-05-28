# SpendSmart AI Frontend

A Next.js application that provides the SpendSmart AI dashboard, upload flow, and analytics UI.

## Requirements

- Node.js 20+ (recommended)
- npm

## Install

```bash
cd spendsmart-ai-frontend
npm install
```

## Run Locally

The backend runs on `http://localhost:3000` and the frontend runs on `http://localhost:3001` by default.

```bash
cd spendsmart-ai-frontend
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Build

```bash
cd spendsmart-ai-frontend
npm run build
npm run start
```

## API Integration

The frontend sends requests to the backend at `http://localhost:3000` using `src/lib/api.ts`.

- `POST /upload` uploads a CSV file and returns parsed transactions.
- `POST /analyze` sends transactions for analytics and returns spending summaries, detected patterns, insights, and health score.
- `POST /simulate` sends transactions plus reduction goals and returns projected monthly/yearly savings.

## Recommended Local Setup

Start the backend first:

```bash
cd spendsmart-ai
npm run dev
```

In another terminal, start the frontend:

```bash
cd spendsmart-ai-frontend
npm run dev
```

Then visit `http://localhost:3001`.

## Project Structure

```text
spendsmart-ai-frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── dashboard/page.tsx
├── components/
│   ├── HealthScoreRing.tsx
│   ├── InsightCard.tsx
│   ├── SavingsSlider.tsx
│   ├── Sidebar.tsx
│   ├── StatsCard.tsx
│   └── UploadDropzone.tsx
├── lib/
│   └── api.ts
├── types/
│   └── index.ts
├── utils/
│   └── engine.ts
├── package.json
└── tsconfig.json
```

## Notes

- The frontend expects the backend at `http://localhost:3000`.
- If you deploy the backend separately, update `src/lib/api.ts` accordingly.
- The frontend dev server is configured to run on port `3001` to avoid conflict with the backend.
