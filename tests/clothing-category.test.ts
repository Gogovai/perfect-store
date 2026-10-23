import assert from 'node:assert/strict';
import test from 'node:test';
import { isClothingCategory } from '../lib/utils/clothing';

test('accepts common menswear and womenswear categories', () => {
  assert.equal(isClothingCategory("Men's Clothing", 'mens-clothing'), true);
  assert.equal(isClothingCategory("Women's Dresses", 'womens-dresses'), true);
});

test('accepts footwear, traditional wear, and fashion accessories', () => {
  assert.equal(isClothingCategory('Footwear', 'footwear'), true);
  assert.equal(isClothingCategory('Traditional Wear', 'traditional-wear'), true);
  assert.equal(isClothingCategory('Bags', 'bags'), true);
});

test('rejects unrelated non-fashion categories', () => {
  assert.equal(isClothingCategory('Electronics', 'electronics'), false);
  assert.equal(isClothingCategory('Home Appliances', 'home-appliances'), false);
  assert.equal(isClothingCategory('Groceries', 'groceries'), false);
});

test('handles missing and empty category labels safely', () => {
  assert.equal(isClothingCategory(null, undefined), false);
  assert.equal(isClothingCategory('', ''), false);
});
