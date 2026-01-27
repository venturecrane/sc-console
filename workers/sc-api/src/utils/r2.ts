/**
 * R2 Storage Utilities
 *
 * Helper functions for working with the sc-assets R2 bucket.
 * Provides signed URL generation and asset upload/download functions.
 *
 * Reference: SC_TECHNICAL_SPEC_v1.2.md Section 2.2, 6.4
 */

/**
 * Options for signed URL generation
 */
interface SignedUrlOptions {
  /** Expiration time in seconds (default: 3600 = 1 hour) */
  expiresIn?: number;
  /** Content type for the URL (optional) */
  contentType?: string;
}

/**
 * Options for asset upload
 */
interface UploadOptions {
  /** Content type of the asset */
  contentType: string;
  /** Custom metadata to attach to the object */
  customMetadata?: Record<string, string>;
  /** Cache control header */
  cacheControl?: string;
}

/**
 * Result of an upload operation
 */
interface UploadResult {
  key: string;
  size: number;
  etag: string;
  uploaded: number; // Unix timestamp ms
}

/**
 * Result of a download operation
 */
interface DownloadResult {
  data: ArrayBuffer;
  contentType: string;
  size: number;
  etag: string;
  customMetadata: Record<string, string>;
}

/**
 * Generate a signed URL for an R2 object
 *
 * Note: Cloudflare R2 doesn't have native signed URL support like S3.
 * This function creates a time-limited access pattern using Workers.
 * For public access, consider using R2 public buckets or custom domains.
 *
 * @param bucket - The R2 bucket binding
 * @param key - The object key in the bucket
 * @param options - Configuration options
 * @returns A URL that can be used to access the object
 */
export async function getSignedUrl(
  bucket: R2Bucket,
  key: string,
  options: SignedUrlOptions = {}
): Promise<string> {
  const { expiresIn = 3600 } = options;

  // Generate a signed token with expiration
  const expiresAt = Date.now() + expiresIn * 1000;
  const payload = {
    key,
    exp: expiresAt,
  };

  // Create a signature using the key and expiration
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Encode the token as base64
  const token = btoa(JSON.stringify({ ...payload, sig: signature }));

  // Return URL with token - this would be validated by a route handler
  // The actual URL pattern depends on your Worker's domain
  return `/assets/${encodeURIComponent(key)}?token=${encodeURIComponent(token)}`;
}

/**
 * Verify a signed URL token
 *
 * @param token - The token from the URL query parameter
 * @returns The key if valid, null if invalid or expired
 */
export async function verifySignedUrlToken(token: string): Promise<string | null> {
  try {
    const decoded = JSON.parse(atob(token));
    const { key, exp, sig } = decoded;

    // Check expiration
    if (Date.now() > exp) {
      return null;
    }

    // Verify signature
    const payload = { key, exp };
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSig = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    if (sig !== expectedSig) {
      return null;
    }

    return key;
  } catch {
    return null;
  }
}

/**
 * Upload an asset to R2
 *
 * @param bucket - The R2 bucket binding
 * @param key - The object key (path) in the bucket
 * @param data - The data to upload (ArrayBuffer, string, or ReadableStream)
 * @param options - Upload configuration options
 * @returns Upload result with metadata
 */
export async function uploadAsset(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer | string | ReadableStream<Uint8Array>,
  options: UploadOptions
): Promise<UploadResult> {
  const { contentType, customMetadata, cacheControl } = options;

  const httpMetadata: R2HTTPMetadata = {
    contentType,
  };

  if (cacheControl) {
    httpMetadata.cacheControl = cacheControl;
  }

  const putOptions: R2PutOptions = {
    httpMetadata,
  };

  if (customMetadata) {
    putOptions.customMetadata = customMetadata;
  }

  const result = await bucket.put(key, data, putOptions);

  if (!result) {
    throw new Error(`Failed to upload asset: ${key}`);
  }

  return {
    key: result.key,
    size: result.size,
    etag: result.etag,
    uploaded: Date.now(),
  };
}

/**
 * Download an asset from R2
 *
 * @param bucket - The R2 bucket binding
 * @param key - The object key (path) in the bucket
 * @returns Download result with data and metadata, or null if not found
 */
export async function downloadAsset(
  bucket: R2Bucket,
  key: string
): Promise<DownloadResult | null> {
  const object = await bucket.get(key);

  if (!object) {
    return null;
  }

  const data = await object.arrayBuffer();

  return {
    data,
    contentType: object.httpMetadata?.contentType || 'application/octet-stream',
    size: object.size,
    etag: object.etag,
    customMetadata: object.customMetadata || {},
  };
}

/**
 * Delete an asset from R2
 *
 * @param bucket - The R2 bucket binding
 * @param key - The object key (path) in the bucket
 */
export async function deleteAsset(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}

/**
 * Check if an asset exists in R2
 *
 * @param bucket - The R2 bucket binding
 * @param key - The object key (path) in the bucket
 * @returns true if the object exists, false otherwise
 */
export async function assetExists(bucket: R2Bucket, key: string): Promise<boolean> {
  const head = await bucket.head(key);
  return head !== null;
}

/**
 * List assets in a bucket with optional prefix
 *
 * @param bucket - The R2 bucket binding
 * @param options - List options (prefix, limit, cursor)
 * @returns List of objects and pagination info
 */
export async function listAssets(
  bucket: R2Bucket,
  options: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  } = {}
): Promise<{
  objects: Array<{
    key: string;
    size: number;
    etag: string;
    uploaded: Date;
  }>;
  truncated: boolean;
  cursor?: string;
}> {
  const { prefix, limit = 100, cursor } = options;

  const listOptions: R2ListOptions = {
    limit,
  };

  if (prefix) {
    listOptions.prefix = prefix;
  }

  if (cursor) {
    listOptions.cursor = cursor;
  }

  const result = await bucket.list(listOptions);

  return {
    objects: result.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      etag: obj.etag,
      uploaded: obj.uploaded,
    })),
    truncated: result.truncated,
    cursor: result.truncated ? result.cursor : undefined,
  };
}

/**
 * Generate a unique key for an asset based on experiment ID and filename
 *
 * @param experimentId - The experiment ID (e.g., SC-2026-001)
 * @param filename - The original filename
 * @param assetType - Type of asset (e.g., 'creative', 'evidence', 'document')
 * @returns A unique, organized key for the asset
 */
export function generateAssetKey(
  experimentId: string,
  filename: string,
  assetType: 'creative' | 'evidence' | 'document' = 'creative'
): string {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomUUID().slice(0, 8);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  return `${experimentId}/${assetType}/${timestamp}-${randomSuffix}-${sanitizedFilename}`;
}
