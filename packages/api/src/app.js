import cors from 'cors';
import express from 'express';
import PDFDocument from 'pdfkit';
import { inventoryRouter } from './routes/inventory.js';
import { branchesRouter } from './routes/branches.js';
import { cashRouter } from './routes/cash.js';
import { customersRouter } from './routes/customers.js';
import { analyticsRouter } from './routes/analytics.js';
import { ownersRouter } from './routes/owners.js';
import { productsRouter } from './routes/products.js';
import { purchasesRouter } from './routes/purchases.js';
import { reportsRouter } from './routes/reports.js';
import { salesRouter } from './routes/sales.js';
import { bankRouter } from './routes/bank.js';
import { getOwnerStatement, listSales } from './services/erpStore.js';

function writeStatementPdf(res, statement) {
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
}

function writeSalePdf(res, sale) {
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

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/owners', ownersRouter);
  app.use('/products', productsRouter);
  app.use('/inventory', inventoryRouter);
  app.use('/purchases', purchasesRouter);
  app.use('/sales', salesRouter);
  app.use('/customers', customersRouter);
  app.use('/cash', cashRouter);
  app.use('/bank', bankRouter);
  app.use('/branches', branchesRouter);
  app.use('/analytics', analyticsRouter);
  app.use('/reports', reportsRouter);

  app.get('/exports/sales/pdf', (req, res) => {
    const sale = listSales().find((entry) => entry.id === req.query.id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    writeSalePdf(res, sale);
  });

  app.get('/exports/statement/pdf', (req, res) => {
    const statement = getOwnerStatement(req.query.ownerId);
    if (!statement) return res.status(404).json({ error: 'Owner not found' });
    writeStatementPdf(res, statement);
  });
  
  return app;
}
