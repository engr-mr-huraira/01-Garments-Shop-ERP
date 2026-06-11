import express from 'express';
import { listCashMovements, recordCashMovement } from '../services/erpStore.js';

export const cashRouter = express.Router();

cashRouter.get('/', (_req, res) => {
  res.json({ data: listCashMovements() });
});

cashRouter.post('/', (req, res) => {
  try {
    const entry = recordCashMovement(req.body);
    res.status(201).json({ data: entry });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

