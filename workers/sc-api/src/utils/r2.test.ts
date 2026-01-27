import { describe, it, expect } from 'vitest';
import {
  getSignedUrl,
  verifySignedUrlToken,
  generateAssetKey,
} from './r2';

/**
 * Tests for R2 Storage Utilities
 *
 * Note: Full integration tests require actual R2 bucket access.
 * These tests focus on the utility functions that can be tested in isolation.
 */

describe('R2 Utilities', () => {
  describe('generateAssetKey', () => {
    it('should generate a key with experiment ID, asset type, and filename', () => {
      const key = generateAssetKey('SC-2026-001', 'hero-image.png', 'creative');

      expect(key).toMatch(/^SC-2026-001\/creative\/\d+-[a-f0-9]{8}-hero-image\.png$/);
    });

    it('should sanitize special characters in filename', () => {
      const key = generateAssetKey('SC-2026-001', 'my file (1).png', 'creative');

      expect(key).toMatch(/^SC-2026-001\/creative\/\d+-[a-f0-9]{8}-my_file__1_\.png$/);
    });

    it('should default to creative asset type', () => {
      const key = generateAssetKey('SC-2026-001', 'image.png');

      expect(key).toContain('/creative/');
    });

    it('should support evidence asset type', () => {
      const key = generateAssetKey('SC-2026-001', 'screenshot.png', 'evidence');

      expect(key).toContain('/evidence/');
    });

    it('should support document asset type', () => {
      const key = generateAssetKey('SC-2026-001', 'report.pdf', 'document');

      expect(key).toContain('/document/');
    });

    it('should generate unique keys for same inputs', () => {
      const key1 = generateAssetKey('SC-2026-001', 'image.png', 'creative');
      const key2 = generateAssetKey('SC-2026-001', 'image.png', 'creative');

      expect(key1).not.toBe(key2);
    });
  });

  describe('getSignedUrl and verifySignedUrlToken', () => {
    // Create a mock R2Bucket for testing
    const mockBucket = {} as R2Bucket;

    it('should generate a signed URL with token', async () => {
      const url = await getSignedUrl(mockBucket, 'test/file.png', { expiresIn: 3600 });

      expect(url).toMatch(/^\/assets\/test%2Ffile\.png\?token=/);
    });

    it('should generate URL-safe tokens', async () => {
      const url = await getSignedUrl(mockBucket, 'path/to/file.png');
      const tokenMatch = url.match(/token=([^&]+)/);

      expect(tokenMatch).toBeTruthy();
      if (tokenMatch) {
        // Token should be URL-encoded base64
        const token = decodeURIComponent(tokenMatch[1]);
        expect(() => atob(token)).not.toThrow();
      }
    });

    it('should verify a valid token', async () => {
      const url = await getSignedUrl(mockBucket, 'test/file.png', { expiresIn: 3600 });
      const tokenMatch = url.match(/token=([^&]+)/);

      expect(tokenMatch).toBeTruthy();
      if (tokenMatch) {
        const token = decodeURIComponent(tokenMatch[1]);
        const key = await verifySignedUrlToken(token);

        expect(key).toBe('test/file.png');
      }
    });

    it('should reject an expired token', async () => {
      // Create a token that's already expired
      const expiredToken = btoa(
        JSON.stringify({
          key: 'test/file.png',
          exp: Date.now() - 1000, // Already expired
          sig: 'invalid', // Signature won't matter since it's expired
        })
      );

      const key = await verifySignedUrlToken(expiredToken);

      expect(key).toBeNull();
    });

    it('should reject a tampered token', async () => {
      // Create a token with invalid signature
      const tamperedToken = btoa(
        JSON.stringify({
          key: 'test/file.png',
          exp: Date.now() + 3600000,
          sig: 'tampered-signature',
        })
      );

      const key = await verifySignedUrlToken(tamperedToken);

      expect(key).toBeNull();
    });

    it('should reject malformed tokens', async () => {
      const malformedTokens = [
        'not-base64!',
        btoa('not-json'),
        btoa('{}'), // Missing required fields
        btoa(JSON.stringify({ key: 'test' })), // Missing exp and sig
      ];

      for (const token of malformedTokens) {
        const key = await verifySignedUrlToken(token);
        expect(key).toBeNull();
      }
    });
  });
});
