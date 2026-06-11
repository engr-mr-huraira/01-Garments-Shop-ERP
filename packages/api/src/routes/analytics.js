import express from 'express';
import { getAllData, getDashboardSummary, getLedgerSnapshot, getReports, getStockSummary } from '../services/erpStore.js';

export const analyticsRouter = express.Router();

analyticsRouter.get('/dashboard', (_req, res) => {
  res.json({ data: getDashboardSummary() });
});

analyticsRouter.get('/stock', (_req, res) => {
  res.json({ data: getStockSummary() });
});

analyticsRouter.get('/ledger', (_req, res) => {
  res.json({ data: getLedgerSnapshot() });
});

analyticsRouter.get('/reports', (_req, res) => {
  res.json({ data: getReports() });
});

analyticsRouter.get('/raw', (_req, res) => {
  res.json({ data: getAllData() });
});

