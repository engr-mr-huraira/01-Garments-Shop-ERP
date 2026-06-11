import express from 'express';
import { createPurchase, listPurchases, recordPurchasePayment, returnPurchase } from '../services/erpStore.js';

export const purchasesRouter = express.Router();

purchasesRouter.get('/', (_req, res) => {
  res.json({ data: listPurchases() });
});

purchasesRouter.post('/', (req, res) => {
  try {
    const purchase = createPurchase(req.body);
    res.status(201).json({ data: purchase });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

purchasesRouter.post('/:id/payment', (req, res) => {
  const purchase = recordPurchasePayment({
    purchaseId: req.params.id,
    amount: req.body.amount,
    method: req.body.method,
    note: req.body.note
  });
  if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
  res.json({ data: purchase });
});

purchasesRouter.post('/:id/return', (req, res) => {
  try {
    const record = returnPurchase({
      purchaseId: req.params.id,
      items: req.body.items,
      reason: req.body.reason
    });
    res.status(201).json({ data: record });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

