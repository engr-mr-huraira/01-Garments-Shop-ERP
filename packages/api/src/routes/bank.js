import express from 'express';
import { listBankMovements, recordBankMovement } from '../services/erpStore.js';

export const bankRouter = express.Router();

bankRouter.get('/', (_req, res) => {
  res.json({ data: listBankMovements() });
});

bankRouter.post('/', (req, res) => {
  try {
    const entry = recordBankMovement(req.body);
    res.status(201).json({ data: entry });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

