import express from 'express';
import PDFDocument from 'pdfkit';
import { createSale, holdSale, listSaleHolds, listSales, resumeSale } from '../services/erpStore.js';

export const salesRouter = express.Router();

salesRouter.get('/', (_req, res) => {
  res.json({ data: listSales() });
});

salesRouter.post('/', (req, res) => {
  try {
    const sale = createSale(req.body);
    res.status(201).json({ data: sale });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

salesRouter.get('/holds', (_req, res) => {
  res.json({ data: listSaleHolds() });
});

salesRouter.post('/hold', (req, res) => {
  try {
    const draft = holdSale(req.body);
    res.status(201).json({ data: draft });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

salesRouter.get('/pdf', (req, res) => {
  const sale = listSales().find((entry) => entry.id === req.query.id);
  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  writeSaleInvoicePdf(res, sale);
});

salesRouter.post('/resume/:id', (req, res) => {
  const draft = resumeSale(req.params.id);
  if (!draft) return res.status(404).json({ error: 'Draft not found' });
  res.json({ data: draft });
});

function writeSaleInvoicePdf(res, sale) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${sale.invoiceNo}.pdf"`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(20).text(`Invoice ${sale.invoiceNo}`);
  doc.moveDown();
  doc.fontSize(12).text(`Customer: ${sale.customerName}`);
  doc.text(`Date: ${sale.date}`);
  doc.text(`Payment Method: ${sale.paymentMethod}`);
  doc.moveDown();
  doc.fontSize(14).text('Items');
  doc.fontSize(11);
  sale.items.forEach((item) => {
    doc.text(`- ${item.productName} x ${item.qty} = Rs ${(item.salePrice * item.qty).toLocaleString()}`);
  });
  doc.moveDown();
  doc.fontSize(12).text(`Total Cost: Rs ${sale.totalCost.toLocaleString()}`);
  doc.text(`Profit: Rs ${sale.totalProfit.toLocaleString()}`);
  doc.text(`Final Bill: Rs ${sale.finalBillAmount.toLocaleString()}`);
  doc.end();
}
