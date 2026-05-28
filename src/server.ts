// ============================================================
// SpendSmart AI — Express Server Entry Point
// ============================================================

import express from 'express';
import cors from 'cors';

import uploadRoute from './routes/upload';
import analyzeRoute from './routes/analyze';
import simulateRoute from './routes/simulate';

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Health check ────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'SpendSmart AI',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      upload: 'POST /upload   — parse CSV file',
      analyze: 'POST /analyze  — analytics + insights + score',
      simulate: 'POST /simulate — savings simulation',
    },
  });
});

// ── API Routes ──────────────────────────────────────────────
app.use('/upload', uploadRoute);
app.use('/analyze', analyzeRoute);
app.use('/simulate', simulateRoute);

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 SpendSmart AI server running at http://localhost:${PORT}\n`);
  console.log('Endpoints:');
  console.log('  POST /upload    — Upload & parse CSV');
  console.log('  POST /analyze   — Full analytics pipeline');
  console.log('  POST /simulate  — Savings simulator\n');
});

export default app;
