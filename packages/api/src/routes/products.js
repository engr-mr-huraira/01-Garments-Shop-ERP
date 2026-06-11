import express from 'express';
import { createProduct, getProductHistory, getProducts, updateProduct } from '../services/erpStore.js';

export const productsRouter = express.Router();

productsRouter.get('/', (_req, res) => {
  res.json({ data: getProducts() });
});

productsRouter.post('/', (req, res) => {
  const product = createProduct(req.body);
  res.status(201).json({ data: product });
});

productsRouter.patch('/:id', (req, res) => {
  const product = updateProduct(req.params.id, req.body);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ data: product });
});

productsRouter.get('/:id/history', (req, res) => {
  const history = getProductHistory(req.params.id);
  if (!history) return res.status(404).json({ error: 'Product not found' });
  res.json({ data: history });
});
