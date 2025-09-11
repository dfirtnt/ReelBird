import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import axios from 'axios';

function VideoUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      toast.error('File size must be less than 20MB');
      return;
    }
    
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Create video record first
      const videoResponse = await axios.post('/api/videos', {
        filename: file.name,
        duration: null // Will be updated after processing
      });

      const videoId = videoResponse.data.id;

      // Upload file using tusd
      const upload = await uploadFile(file, videoId);
      
      if (upload) {
        toast.success('Video uploaded successfully!');
        navigate('/');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadFile = (file, videoId) => {
    return new Promise((resolve, reject) => {
      // For now, we'll use a simple multipart upload
      // In production, this would use tus-js-client for resumable uploads
      const formData = new FormData();
      formData.append('video', file);
      formData.append('videoId', videoId);

      axios.post('/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        },
      })
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        reject(error);
      });
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="container">
      <div className="card">
        <h1>Upload Video</h1>
        
        <div
          {...getRootProps()}
          style={{
            border: '2px dashed #ccc',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            backgroundColor: isDragActive ? '#f8f9fa' : 'white',
            opacity: uploading ? 0.6 : 1
          }}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div>
              <p>Uploading... {progress}%</p>
              <div style={{ 
                width: '100%', 
                backgroundColor: '#e9ecef', 
                borderRadius: '4px',
                marginTop: '10px'
              }}>
                <div style={{
                  width: `${progress}%`,
                  backgroundColor: '#007bff',
                  height: '20px',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '18px', marginBottom: '10px' }}>
                {isDragActive ? 'Drop the video here' : 'Drag & drop a video file here, or click to select'}
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Supported formats: MP4, AVI, MOV, WMV, FLV, WebM
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Maximum file size: 20MB
              </p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => navigate('/')} 
            className="btn" 
            style={{ background: '#6c757d' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoUpload;
