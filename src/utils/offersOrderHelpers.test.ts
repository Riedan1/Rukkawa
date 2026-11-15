import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseOfferFromString,
  extractOfferFromOrder,
  resolveColorHex,
} from './offersOrderHelpers.tsx';
import { Order } from '../types.ts';

test('parseOfferFromString correctly parses user screenshot string with 5 items and free gift', () => {
  const rawString =
    'Trio (#1: Small (S) / Dark Onyx, #2: Small (S) / Off White, #3: Small (S) / Obsidian, #4: Small (S) / Platinum Light Gray, #5: Small (S) / Medium Gray) + Gifts: 1x Baseball Cap (FREE)';

  const parsed = parseOfferFromString(rawString);

  assert.equal(parsed.isOffer, true);
  assert.equal(parsed.tierTitle, 'Trio');
  assert.equal(parsed.totalUnits, 5);
  assert.equal(parsed.purchasedQuantity, 3);
  assert.equal(parsed.freeQuantity, 2);

  // Check all 5 units
  assert.equal(parsed.units.length, 5);
  assert.equal(parsed.units[0].unitIndex, 1);
  assert.equal(parsed.units[0].size, 'Small (S)');
  assert.equal(parsed.units[0].color, 'Dark Onyx');
  assert.equal(parsed.units[0].colorHex, '#1e293b');

  assert.equal(parsed.units[1].unitIndex, 2);
  assert.equal(parsed.units[1].size, 'Small (S)');
  assert.equal(parsed.units[1].color, 'Off White');
  assert.equal(parsed.units[1].colorHex, '#f8fafc');

  assert.equal(parsed.units[2].unitIndex, 3);
  assert.equal(parsed.units[2].size, 'Small (S)');
  assert.equal(parsed.units[2].color, 'Obsidian');
  assert.equal(parsed.units[2].colorHex, '#334155');

  assert.equal(parsed.units[3].unitIndex, 4);
  assert.equal(parsed.units[3].size, 'Small (S)');
  assert.equal(parsed.units[3].color, 'Platinum Light Gray');
  assert.equal(parsed.units[3].colorHex, '#e2e8f0');

  assert.equal(parsed.units[4].unitIndex, 5);
  assert.equal(parsed.units[4].size, 'Small (S)');
  assert.equal(parsed.units[4].color, 'Medium Gray');
  assert.equal(parsed.units[4].colorHex, '#94a3b8');

  // Check Free Gift
  assert.equal(parsed.gifts.length, 1);
  assert.equal(parsed.gifts[0].name, 'Baseball Cap');
  assert.equal(parsed.gifts[0].quantity, 1);
  assert.equal(parsed.gifts[0].isFree, true);
});

test('extractOfferFromOrder extracts from modern structured offerDetails', () => {
  const dummyOrder: Order = {
    id: 'ORD-999888',
    storeId: 'store-1',
    storeName: 'Test Artisan Store',
    date: new Date().toISOString(),
    shopper: {
      name: 'Amine B',
      email: 'amine@test.dz',
      phone: '0555123456',
      wilaya: 'Oran',
      wilayaCode: '31',
      commune: 'Es Senia',
      address: 'Hai Khemisti',
    },
    items: [
      {
        id: 'p-1',
        name: 'Algerian Artisanal Shirt (Trio)',
        price: 10500,
        quantity: 1,
        imageUrl: '/test.jpg',
      },
    ],
    total: 11000,
    shippingCost: 500,
    status: 'pending',
    paymentMethod: 'cod',
    isOfferOrder: true,
    offerDetails: {
      tierId: 'tier-3',
      tierTitle: 'Trio',
      totalUnits: 5,
      purchasedQuantity: 3,
      freeQuantity: 2,
      baseUnitPriceDzd: 3500,
      originalTotalDzd: 17500,
      finalPriceDzd: 10500,
      savingsDzd: 7000,
      savingsPercent: 40,
      unitSelections: [
        { Size: 'Small (S)', Color: 'Dark Onyx' },
        { Size: 'Small (S)', Color: 'Off White' },
      ],
      freeGifts: [
        { id: 'g-1', name: 'Baseball Cap', quantity: 1, originalPrice: 800 } as any,
      ],
    },
  };

  const extracted = extractOfferFromOrder(dummyOrder);
  assert.ok(extracted);
  assert.equal(extracted.isOffer, true);
  assert.equal(extracted.tierTitle, 'Trio');
  assert.equal(extracted.totalUnits, 5);
  assert.equal(extracted.savingsDzd, 7000);
  assert.equal(extracted.units.length, 2);
  assert.equal(extracted.units[0].color, 'Dark Onyx');
  assert.equal(extracted.gifts[0].name, 'Baseball Cap');
});

test('resolveColorHex handles Algerian fashion colors accurately', () => {
  assert.equal(resolveColorHex('Dark Onyx'), '#1e293b');
  assert.equal(resolveColorHex('Off White'), '#f8fafc');
  assert.equal(resolveColorHex('Obsidian'), '#334155');
  assert.equal(resolveColorHex('Forest Green'), '#166534');
  assert.equal(resolveColorHex('#123456'), '#123456');
  assert.equal(resolveColorHex('UnknownNonExistentColor'), undefined);
});
