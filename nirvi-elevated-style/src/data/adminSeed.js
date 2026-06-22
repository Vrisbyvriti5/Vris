import { products as baseProducts } from '@/data/products';

const today = new Date('2026-04-12T09:00:00.000Z');

const createDateOffset = (daysAgo) => {
  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() - daysAgo);
  return nextDate.toISOString();
};

const stockLevels = [18, 12, 9, 24, 30, 16, 7, 11, 15, 22, 14, 19, 8, 10, 13, 17, 6, 20, 26, 5];
const customizationPalette = {
  colors: ['Stone Grey', 'Midnight Black', 'Indigo Wash', 'Sand', 'Ivory'],
  styles: ['Minimal', 'Patchwork', 'Hand-painted', 'Street Classic'],
  addOns: ['Monogram Tag', 'Gift Wrap', 'Premium Strap', 'Handwritten Note'],
};

const buildProductCustomizations = (index) => ({
  colors: customizationPalette.colors.slice(0, 2 + (index % 2)),
  styles: customizationPalette.styles.slice(0, 1 + (index % customizationPalette.styles.length)),
  addOns: customizationPalette.addOns.slice(0, 1 + (index % 3)),
});

export const initialCatalogProducts = baseProducts.map((product, index) => ({
  ...product,
  stock: stockLevels[index] ?? 12,
  sku: `VRIS-${String(index + 1).padStart(4, '0')}`,
  collection: product.collection || 'Denim',
  customizationOptions: buildProductCustomizations(index),
  createdAt: createDateOffset(120 - index * 3),
  updatedAt: createDateOffset(12 - (index % 6)),
}));

export const initialCustomizationOptions = {
  colors: [...customizationPalette.colors],
  styles: [...customizationPalette.styles],
  addOns: [...customizationPalette.addOns],
};

export const initialUsers = [
  {
    id: 'user-1',
    name: 'Rhea Kapoor',
    email: 'rhea.kapoor@vris.com',
    role: 'admin',
    status: 'Active',
    joinedAt: createDateOffset(220),
    lastSeen: 'Just now',
  },
  {
    id: 'user-2',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@gmail.com',
    role: 'user',
    status: 'Active',
    joinedAt: createDateOffset(95),
    lastSeen: '10 minutes ago',
  },
  {
    id: 'user-3',
    name: 'Siya Verma',
    email: 'siya.verma@gmail.com',
    role: 'user',
    status: 'Active',
    joinedAt: createDateOffset(81),
    lastSeen: '35 minutes ago',
  },
  {
    id: 'user-4',
    name: 'Kabir Anand',
    email: 'kabir.anand@gmail.com',
    role: 'user',
    status: 'Active',
    joinedAt: createDateOffset(64),
    lastSeen: '2 hours ago',
  },
  {
    id: 'user-5',
    name: 'Tara Singh',
    email: 'tara.singh@gmail.com',
    role: 'user',
    status: 'Invited',
    joinedAt: createDateOffset(18),
    lastSeen: 'Pending invite',
  },
  {
    id: 'user-6',
    name: 'Dev Malhotra',
    email: 'dev.malhotra@gmail.com',
    role: 'user',
    status: 'Active',
    joinedAt: createDateOffset(43),
    lastSeen: 'Yesterday',
  },
];

const createOrderItem = (productId, quantity) => {
  const product = initialCatalogProducts.find((item) => item.id === productId);

  return {
    productId,
    name: product?.name || 'Unknown Product',
    quantity,
    price: product?.price || 0,
  };
};

const createOrder = (id, userId, status, daysAgo, items) => {
  const user = initialUsers.find((entry) => entry.id === userId);
  const orderItems = items.map(([productId, quantity]) => createOrderItem(productId, quantity));

  return {
    id,
    userId,
    userName: user?.name || 'Unknown Customer',
    totalPrice: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    status,
    createdAt: createDateOffset(daysAgo),
    items: orderItems,
  };
};

export const initialOrders = [
  createOrder('VRIS-ORD-1001', 'user-2', 'Pending', 6, [['1', 1], ['4', 2]]),
  createOrder('VRIS-ORD-1002', 'user-3', 'Shipped', 12, [['7', 1], ['10', 1]]),
  createOrder('VRIS-ORD-1003', 'user-4', 'Delivered', 18, [['12', 1]]),
  createOrder('VRIS-ORD-1004', 'user-6', 'Delivered', 24, [['17', 1], ['19', 1]]),
  createOrder('VRIS-ORD-1005', 'user-2', 'Pending', 2, [['15', 1], ['6', 1]]),
  createOrder('VRIS-ORD-1006', 'user-5', 'Shipped', 9, [['8', 1], ['18', 1]]),
  createOrder('VRIS-ORD-1007', 'user-3', 'Delivered', 31, [['3', 1], ['9', 1]]),
];
