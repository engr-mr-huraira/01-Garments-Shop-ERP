export const seedOwners = [
  { id: 'own_partner_1', name: 'Partner 1', type: 'Partner', cnic: '35202-1234567-1', mobile: '0300-1111111', address: 'Head Office', status: 'active' },
  { id: 'own_partner_2', name: 'Partner 2', type: 'Partner', cnic: '35202-1234567-2', mobile: '0300-2222222', address: 'Warehouse A', status: 'active' },
  { id: 'own_partner_3', name: 'Partner 3', type: 'Partner', cnic: '35202-1234567-3', mobile: '0300-3333333', address: 'Warehouse B', status: 'active' },
  { id: 'own_wholesaler_a', name: 'Wholesaler A', type: 'Wholesaler', cnic: '35202-2234567-1', mobile: '0300-4444444', address: 'Market Road', status: 'active' }
];

export const seedProducts = [
  {
    id: 'prod_jeans_blue_32',
    barcode: '8901234567890',
    name: 'Jeans',
    category: 'Men Wear',
    brand: 'Levis',
    color: 'Blue',
    size: '32',
    ownerId: 'own_partner_1',
    costPrice: 1200,
    salePrice: 1500,
    quantity: 18,
    lowStockThreshold: 5
  },
  {
    id: 'prod_shirt_white_l',
    barcode: '8901234567891',
    name: 'Casual Shirt',
    category: 'Men Wear',
    brand: 'Denim Co',
    color: 'White',
    size: 'L',
    ownerId: 'own_wholesaler_a',
    costPrice: 800,
    salePrice: 1100,
    quantity: 26,
    lowStockThreshold: 6
  }
];

export const seedSales = [
  {
    id: 'sale_001',
    invoiceNo: 'INV-1001',
    customerName: 'Walk-in Customer',
    date: '2026-06-11T09:00:00.000Z',
    items: [
      { productId: 'prod_jeans_blue_32', qty: 2, salePrice: 1500, costPrice: 1200 },
      { productId: 'prod_shirt_white_l', qty: 1, salePrice: 1100, costPrice: 800 }
    ],
    finalBillAmount: 4100,
    paymentMethod: 'cash'
  }
];

