import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHexToRgb,
  rgbaFromHex,
  isWarmColor,
  checkPasswordRules,
  validateRegistrationForm,
  validateSignInForm,
  resolveUserFromForm,
  COUNTRY_CODES,
} from './accountFlowLogic.ts';

describe('accountFlowLogic', () => {
  describe('parseHexToRgb & rgbaFromHex & isWarmColor', () => {
    it('parses 6-digit hex correctly', () => {
      const rgb = parseHexToRgb('#0b2447');
      assert.deepEqual(rgb, { r: 11, g: 36, b: 71 });
    });

    it('parses 3-digit hex correctly', () => {
      const rgb = parseHexToRgb('#fff');
      assert.deepEqual(rgb, { r: 255, g: 255, b: 255 });
    });

    it('formats rgbaFromHex accurately with alpha', () => {
      const rgba = rgbaFromHex('#0b2447', 0.5);
      assert.equal(rgba, 'rgba(11, 36, 71, 0.5)');
    });

    it('detects warm colors properly', () => {
      // Warm amber/burgundy: high R, low B
      assert.equal(isWarmColor('#8b4513'), true); // saddle brown
      // Cool navy: low R, high B
      assert.equal(isWarmColor('#0b2447'), false);
    });

    it('provides country codes including Algeria (+213)', () => {
      assert.ok(COUNTRY_CODES.some((c) => c.code === '+213'));
    });
  });

  describe('checkPasswordRules', () => {
    it('validates a secure password meeting all criteria', () => {
      const res = checkPasswordRules('Secret123');
      assert.equal(res.hasMinLength, true);
      assert.equal(res.hasLowercase, true);
      assert.equal(res.hasUppercase, true);
      assert.equal(res.hasNumber, true);
      assert.equal(res.isValid, true);
    });

    it('fails when too short or missing numbers/uppercase', () => {
      const res = checkPasswordRules('short');
      assert.equal(res.hasMinLength, false);
      assert.equal(res.hasUppercase, false);
      assert.equal(res.hasNumber, false);
      assert.equal(res.isValid, false);
    });
  });

  describe('validateRegistrationForm', () => {
    it('requires store name for merchant accounts', () => {
      const res = validateRegistrationForm({
        accountType: 'merchant',
        storeName: '  ',
        fullName: 'Artisan Owner',
        email: 'artisan@yume.dz',
        password: 'Password1',
        agreedToTerms: true,
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errorMessage?.includes('Store'));
    });

    it('requires terms agreement', () => {
      const res = validateRegistrationForm({
        accountType: 'buyer',
        storeName: '',
        fullName: 'Buyer Name',
        email: 'buyer@yume.dz',
        password: 'Password1',
        agreedToTerms: false,
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errorMessage?.includes('Terms'));
    });

    it('passes for a valid buyer registration', () => {
      const res = validateRegistrationForm({
        accountType: 'buyer',
        storeName: '',
        fullName: 'Amine Benali',
        email: 'amine@yume.dz',
        password: 'Password1',
        agreedToTerms: true,
      });
      assert.equal(res.isValid, true);
      assert.equal(res.errorMessage, null);
    });
  });

  describe('validateSignInForm', () => {
    it('rejects invalid email or empty password', () => {
      assert.equal(validateSignInForm({ email: 'bademail', password: '123' }).isValid, false);
      assert.equal(validateSignInForm({ email: 'test@yume.dz', password: '' }).isValid, false);
    });

    it('accepts valid credentials', () => {
      const res = validateSignInForm({ email: 'test@yume.dz', password: 'SecretPassword' });
      assert.equal(res.isValid, true);
    });
  });

  describe('resolveUserFromForm', () => {
    it('resolves merchant user with custom store name and phone', () => {
      const user = resolveUserFromForm({
        mode: 'register',
        accountType: 'merchant',
        fullName: 'Karim Ziani',
        email: 'karim@yume.dz',
        storeName: 'Tapis Ath Yenni',
        countryCode: '+213',
        phone: '555123456',
      });
      assert.equal(user.name, 'Karim Ziani');
      assert.equal(user.role, 'Merchant');
      assert.equal(user.isMerchant, true);
      assert.equal(user.storeName, 'Tapis Ath Yenni');
      assert.equal(user.phone, '+213 555123456');
    });

    it('resolves buyer user with fallback name from email', () => {
      const user = resolveUserFromForm({
        mode: 'signin',
        accountType: 'buyer',
        fullName: '',
        email: 'sophie@yume.dz',
      });
      assert.equal(user.name, 'sophie');
      assert.equal(user.role, 'Buyer');
      assert.equal(user.isMerchant, false);
    });
  });
});
