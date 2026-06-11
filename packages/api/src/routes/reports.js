import express from 'express';
import PDFDocument from 'pdfkit';
import { getDashboardSummary, getOwnerStatement, getWholesalerStatement, listLowStockProducts } from '../services/erpStore.js';

export const reportsRouter = express.Router();

reportsRouter.get('/dashboard', (_req, res) => {
  res.json({ data: getDashboardSummary() });
});

reportsRouter.get('/low-stock', (_req, res) => {
  res.json({ data: listLowStockProducts() });
});

reportsRouter.get('/pdf', (req, res) => {
  const statement = getOwnerStatement(req.query.ownerId);
  if (!statement) return res.status(404).json({ error: 'Owner not found' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${statement.owner.name}-statement.pdf"`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(20).text(`${statement.owner.name} Statement`);
  doc.moveDown();
  doc.fontSize(12).text(`Type: ${statement.owner.type}`);
  doc.text(`Stock Value: Rs ${statement.stockValue.toLocaleString()}`);
  doc.text(`Sales: Rs ${statement.saleTotal.toLocaleString()}`);
  doc.text(`Cost: Rs ${statement.costTotal.toLocaleString()}`);
  doc.text(`Profit: Rs ${statement.profitTotal.toLocaleString()}`);
  doc.text(`Payable: Rs ${Number(statement.summary?.totalPayable || 0).toLocaleString()}`);
  doc.moveDown();
  doc.fontSize(14).text('Products');
  doc.fontSize(11);
  statement.products.forEach((product) => {
    doc.text(`- ${product.name} | Qty: ${product.quantity} | Cost: Rs ${product.costPrice}`);
  });
  doc.end();
});

reportsRouter.get('/owners/:id/statement', (req, res) => {
  const statement = getOwnerStatement(req.params.id);
  if (!statement) return res.status(404).json({ error: 'Owner not found' });
  res.json({ data: statement });
});

reportsRouter.get('/wholesalers/:id/statement', (req, res) => {
  const statement = getWholesalerStatement(req.params.id);
  if (!statement) return res.status(404).json({ error: 'Wholesaler not found' });
  res.json({ data: statement });
});
