import { test, expect } from '@playwright/test';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

test.describe('Video Upload and Processing Workflow', () => {
  let testVideoPath: string;

  test.beforeEach(async () => {
    // Create a test video file
    testVideoPath = join(__dirname, 'test-video.mp4');
    writeFileSync(testVideoPath, 'fake video content for testing');
  });

  test.afterEach(async () => {
    // Clean up test video file
    try {
      unlinkSync(testVideoPath);
    } catch (error) {
      // File might already be deleted
    }
  });

  test('should upload video and trigger automatic processing', async ({ page, request }) => {
    // Test health endpoint
    const healthResponse = await request.get('/health');
    expect(healthResponse.ok()).toBeTruthy();
    
    const healthData = await healthResponse.json();
    expect(healthData.status).toBe('ok');

    // Test videos list endpoint
    const videosResponse = await request.get('/api/videos');
    expect(videosResponse.ok()).toBeTruthy();
    
    const videosData = await videosResponse.json();
    expect(Array.isArray(videosData)).toBeTruthy();

    // Test video upload
    const formData = new FormData();
    formData.append('video', new Blob(['fake video content'], { type: 'video/mp4' }), 'test-video.mp4');

    const uploadResponse = await request.post('/api/videos/upload', {
      multipart: {
        video: {
          name: 'test-video.mp4',
          mimeType: 'video/mp4',
          buffer: Buffer.from('fake video content')
        }
      }
    });

    expect(uploadResponse.ok()).toBeTruthy();
    
    const uploadData = await uploadResponse.json();
    expect(uploadData.message).toContain('Video uploaded successfully');
    expect(uploadData.video).toBeDefined();
    expect(uploadData.video.filename).toBe('test-video.mp4');
    expect(uploadData.video.status).toBe('processing');

    // Wait for processing to complete (with timeout)
    let processingComplete = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (!processingComplete && attempts < maxAttempts) {
      await page.waitForTimeout(1000);
      
      const statusResponse = await request.get(`/api/videos/${uploadData.video.id}`);
      if (statusResponse.ok()) {
        const videoData = await statusResponse.json();
        if (videoData.status === 'completed' || videoData.status === 'failed') {
          processingComplete = true;
          expect(videoData.status).toBe('completed');
        }
      }
      
      attempts++;
    }

    expect(processingComplete).toBeTruthy();

    // Check for detections
    const detectionsResponse = await request.get(`/api/detections/video/${uploadData.video.id}`);
    expect(detectionsResponse.ok()).toBeTruthy();
    
    const detectionsData = await detectionsResponse.json();
    expect(Array.isArray(detectionsData)).toBeTruthy();
  });

  test('should handle invalid file uploads gracefully', async ({ request }) => {
    // Test upload without file
    const uploadResponse = await request.post('/api/videos/upload');
    expect(uploadResponse.status()).toBe(400);
    
    const errorData = await uploadResponse.json();
    expect(errorData.error).toContain('No video file uploaded');
  });

  test('should validate video file types', async ({ request }) => {
    // Test upload with non-video file
    const uploadResponse = await request.post('/api/videos/upload', {
      multipart: {
        video: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('not a video')
        }
      }
    });

    expect(uploadResponse.status()).toBe(400);
    
    const errorData = await uploadResponse.json();
    expect(errorData.error).toContain('Only video files are allowed');
  });

  test('should provide video processing status updates', async ({ request }) => {
    // Upload a video
    const uploadResponse = await request.post('/api/videos/upload', {
      multipart: {
        video: {
          name: 'status-test-video.mp4',
          mimeType: 'video/mp4',
          buffer: Buffer.from('fake video content for status test')
        }
      }
    });

    expect(uploadResponse.ok()).toBeTruthy();
    
    const uploadData = await uploadResponse.json();
    const videoId = uploadData.video.id;

    // Check initial status
    expect(uploadData.video.status).toBe('processing');

    // Monitor status changes
    const statuses: string[] = [];
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const statusResponse = await request.get(`/api/videos/${videoId}`);
      if (statusResponse.ok()) {
        const videoData = await statusResponse.json();
        statuses.push(videoData.status);
        
        if (videoData.status === 'completed' || videoData.status === 'failed') {
          break;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    // Verify status progression
    expect(statuses).toContain('processing');
    expect(statuses).toContain('frames_extracted');
    expect(statuses).toContain('completed');
  });
});
