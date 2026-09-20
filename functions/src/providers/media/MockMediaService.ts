// ==============================================================================
// MOCK MEDIA SERVICE (Section 40)
// ==============================================================================

import { IMediaService, UploadOptions } from './IMediaService';
import { MediaAssetRecord } from '../../types';

export class MockMediaService implements IMediaService {
  readonly serviceName = 'Cloudinary-Adapter-Mock';

  async uploadMedia(fileBuffer: Buffer, fileName: string, options?: UploadOptions): Promise<MediaAssetRecord> {
    const publicId = options?.publicId || `media_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    return {
      id: `asset_${Date.now()}`,
      url: `https://res.cloudinary.com/demo/image/upload/v1/weathergpt/${publicId}.webp`,
      publicId,
      format: 'webp',
      resourceType: 'image',
      bytes: fileBuffer.length || 45200,
      createdAt: new Date().toISOString(),
      uploadedBy: 'system',
    };
  }

  async deleteMedia(publicId: string): Promise<boolean> {
    // In mock mode, acknowledge deletion
    return !!publicId;
  }

  getSecureUrl(publicId: string): string {
    return `https://res.cloudinary.com/demo/image/upload/v1/weathergpt/${publicId}.webp`;
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}

export const mediaService = new MockMediaService();
