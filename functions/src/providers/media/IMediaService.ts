// ==============================================================================
// MEDIA SERVICE ABSTRACTION (Section 40 & 58)
// ==============================================================================

import { MediaAssetRecord } from '../../types';

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  publicId?: string;
}

export interface IMediaService {
  readonly serviceName: string;
  uploadMedia(fileBuffer: Buffer, fileName: string, options?: UploadOptions): Promise<MediaAssetRecord>;
  deleteMedia(publicId: string): Promise<boolean>;
  getSecureUrl(publicId: string, transformations?: Record<string, unknown>): string;
  isHealthy(): Promise<boolean>;
}
