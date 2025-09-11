import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import axios from 'axios';

function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get('/api/videos');
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'uploaded': return '#ffc107';
      case 'processing': return '#17a2b8';
      case 'completed': return '#28a745';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>ReelBird Dashboard</h1>
          <div>
            <span style={{ marginRight: '20px' }}>Welcome, {user?.email}</span>
            <button onClick={logout} className="btn" style={{ background: '#dc3545' }}>
              Logout
            </button>
          </div>
        </div>
        
        <Link to="/upload" className="btn" style={{ marginBottom: '20px' }}>
          Upload New Video
        </Link>

        <h2>Your Videos</h2>
        {videos.length === 0 ? (
          <p>No videos uploaded yet. <Link to="/upload">Upload your first video</Link> to get started!</p>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {videos.map(video => (
              <div key={video.id} className="card" style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>{video.filename}</h3>
                    <p>Uploaded: {new Date(video.created_at).toLocaleDateString()}</p>
                    {video.duration && <p>Duration: {video.duration}s</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span 
                      style={{ 
                        background: getStatusColor(video.status), 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        textTransform: 'uppercase'
                      }}
                    >
                      {video.status}
                    </span>
                    {video.status === 'completed' && (
                      <div style={{ marginTop: '10px' }}>
                        <Link to={`/video/${video.id}`} className="btn">
                          View Report
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
