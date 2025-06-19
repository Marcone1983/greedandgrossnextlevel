import {
  generateStrainId,
  generateUserId,
  calculateUserLevel,
  xpToNextLevel,
  formatNumber,
  validateStrainName,
} from '@/utils/helpers';
import { validateUsername as validateUsernameFn } from '@/utils/validation';
import { generateAnonymousUser, checkAdminEligibility } from '@/utils/userUtils';

describe('Helper Functions', () => {
  describe('ID Generation', () => {
    test('generateStrainId should create unique IDs', () => {
      const id1 = generateStrainId();
      const id2 = generateStrainId();
      
      expect(id1).toMatch(/^strain_\d+_[a-z0-9]{9}$/);
      expect(id2).toMatch(/^strain_\d+_[a-z0-9]{9}$/);
      expect(id1).not.toBe(id2);
    });

    test('generateUserId should create unique IDs', () => {
      const id1 = generateUserId();
      const id2 = generateUserId();
      
      expect(id1).toMatch(/^user_\d+_[a-z0-9]{9}$/);
      expect(id2).toMatch(/^user_\d+_[a-z0-9]{9}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('User Level System', () => {
    test('calculateUserLevel should return correct levels', () => {
      expect(calculateUserLevel(0)).toBe(1);
      expect(calculateUserLevel(100)).toBe(2);
      expect(calculateUserLevel(400)).toBe(3);
      expect(calculateUserLevel(900)).toBe(4);
    });

    test('xpToNextLevel should calculate remaining XP', () => {
      expect(xpToNextLevel(50)).toBe(50); // Need 100 for level 2
      expect(xpToNextLevel(300)).toBe(100); // Need 400 for level 3
    });
  });

  describe('Number Formatting', () => {
    test('formatNumber should format large numbers', () => {
      expect(formatNumber(500)).toBe('500');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(1000)).toBe('1.0K');
    });
  });
});

describe('Validation Functions', () => {
  describe('Username Validation', () => {
    test('should accept valid usernames', () => {
      expect(validateUsernameFn('user123')).toBe(true);
      expect(validateUsernameFn('breeder_pro')).toBe(true);
      expect(validateUsernameFn('GrowMaster')).toBe(true);
    });

    test('should reject invalid usernames', () => {
      expect(validateUsernameFn('ab')).toBe(false); // Too short
      expect(validateUsernameFn('a'.repeat(21))).toBe(false); // Too long
      expect(validateUsernameFn('user@domain')).toBe(false); // Invalid chars
      expect(validateUsernameFn('')).toBe(false); // Empty
    });
  });

  describe('Strain Name Validation', () => {
    test('should accept valid strain names', () => {
      expect(validateStrainName('OG Kush')).toBe(true);
      expect(validateStrainName('Purple Haze #1')).toBe(true);
      expect(validateStrainName('Blue-Dream')).toBe(true);
    });

    test('should reject invalid strain names', () => {
      expect(validateStrainName('x')).toBe(false); // Too short
      expect(validateStrainName('a'.repeat(51))).toBe(false); // Too long
      expect(validateStrainName('')).toBe(false); // Empty
    });
  });
});

describe('User Utils', () => {
  describe('Anonymous User Generation', () => {
    test('should generate valid anonymous user', () => {
      const user = generateAnonymousUser('testuser');
      
      expect(user.username).toBe('testuser');
      expect(user.tier).toBe('free');
      expect(user.stats.totalCrosses).toBe(0);
      expect(user.stats.level).toBe(1);
      expect(user.preferences.theme).toBe('dark');
      expect(user.id).toMatch(/^user_\d+_[a-z0-9]{9}$/);
    });
  });

  describe('Admin Eligibility', () => {
    test('should identify admin usernames', () => {
      expect(checkAdminEligibility('greedgross')).toBe(true);
      expect(checkAdminEligibility('admin')).toBe(true);
      expect(checkAdminEligibility('developer')).toBe(true);
      expect(checkAdminEligibility('breeder420')).toBe(true);
    });

    test('should reject non-admin usernames', () => {
      expect(checkAdminEligibility('normaluser')).toBe(false);
      expect(checkAdminEligibility('testuser')).toBe(false);
      expect(checkAdminEligibility('grower123')).toBe(false);
    });
  });
});