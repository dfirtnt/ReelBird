import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function VideoReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [detections, setDetections] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideoData();
  }, [id]);

  const fetchVideoData = async () => {
    try {
      const [videoResponse, detectionsResponse, summaryResponse] = await Promise.all([
        axios.get(`/api/videos/${id}`),
        axios.get(`/api/detections/video/${id}`),
        axios.get(`/api/detections/video/${id}/summary`)
      ]);

      setVideo(videoResponse.data);
      setDetections(detectionsResponse.data);
      setSummary(summaryResponse.data);
    } catch (error) {
      console.error('Error fetching video data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading video report...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container">
        <div className="card">
          <p>Video not found</p>
          <button onClick={() => navigate('/')} className="btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Video Report: {video.filename}</h1>
          <button onClick={() => navigate('/')} className="btn" style={{ background: '#6c757d' }}>
            Back to Dashboard
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div className="card">
            <h3>Video Information</h3>
            <p><strong>Filename:</strong> {video.filename}</p>
            <p><strong>Duration:</strong> {video.duration ? `${video.duration}s` : 'Unknown'}</p>
            <p><strong>Status:</strong> {video.status}</p>
            <p><strong>Uploaded:</strong> {new Date(video.created_at).toLocaleString()}</p>
          </div>

          <div className="card">
            <h3>Detection Summary</h3>
            {summary.length === 0 ? (
              <p>No birds detected</p>
            ) : (
              <div>
                {summary.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '8px 0',
                    borderBottom: index < summary.length - 1 ? '1px solid #eee' : 'none'
                  }}>
                    <span><strong>{item.species}</strong></span>
                    <span>{item.count} detections</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Detailed Detections</h3>
          {detections.length === 0 ? (
            <p>No detections found</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Timestamp</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Species</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Confidence</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Bounding Box</th>
                  </tr>
                </thead>
                <tbody>
                  {detections.map((detection, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{detection.timestamp}s</td>
                      <td style={{ padding: '10px' }}>{detection.species}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          background: detection.confidence > 0.8 ? '#28a745' : 
                                     detection.confidence > 0.6 ? '#ffc107' : '#dc3545',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {(detection.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        {detection.bounding_box ? 
                          `x:${detection.bounding_box.x}, y:${detection.bounding_box.y}, w:${detection.bounding_box.width}, h:${detection.bounding_box.height}` :
                          'N/A'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoReport;
