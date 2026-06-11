import express from 'express';
import { adjustProductQuantity, auditStock, getStockSummary, markDamage, markMissing, stockEntry, stockTransfer } from '../services/erpStore.js';

export const inventoryRouter = express.Router();

inventoryRouter.post('/adjust', (req, res) => {
  const { productId, delta, reason } = req.body;
  const product = adjustProductQuantity(productId, Number(delta), reason);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ data: product });
});

inventoryRouter.get('/low-stock', (_req, res) => {
  res.json({ data: getStockSummary().lowStockProducts });
});

inventoryRouter.post('/entry', (req, res) => {
  try {
    const product = stockEntry(req.body);
    res.json({ data: product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

inventoryRouter.post('/transfer', (req, res) => {
  try {
    const product = stockTransfer(req.body);
    res.json({ data: product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

inventoryRouter.post('/damage', (req, res) => {
  try {
    const product = markDamage(req.body);
    res.json({ data: product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

inventoryRouter.post('/missing', (req, res) => {
  try {
    const product = markMissing(req.body);
    res.json({ data: product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

inventoryRouter.post('/audit', (req, res) => {
  try {
    const result = auditStock(req.body);
    res.json({ data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
