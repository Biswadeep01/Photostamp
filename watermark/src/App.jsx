import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const BACKEND_URL = 'http://localhost:8000'; // Update with your backend URL
const getTodayDate = () => new Date().toISOString().split('T')[0];

function App() {
  const [formData, setFormData] = useState({ name: '', email: '', address: '', location: '', date: getTodayDate() });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef(null);
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const processFile = (selectedFile) => {
    if (selectedFile && (selectedFile.type === 'image/png' || selectedFile.type === 'image/jpeg')) {
      setFile(selectedFile);
      setDownloadUrl(null);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      alert('Please upload a valid PNG or JPG image.');
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDragOver = (e) => {
    e.preventDefault(); 
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please upload an image first.');

    setLoading(true);
    setDownloadUrl(null);
    const data = new FormData();
    data.append('file', file);
    Object.keys(formData).forEach(key => data.append(key, formData[key]));

    try {
      const response = await fetch(`${BACKEND_URL}/watermark/`, {
        method: 'POST',
        body: data,
      });

      if (!response.ok) throw new Error('Watermarking failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (error) {
      console.error(error);
      alert('Error connecting to the backend. Ensure your Python server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAndReset = () => {
    setTimeout(() => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
      setFile(null);
      setPreviewUrl(null);
      setDownloadUrl(null);
      setFormData({ 
        name: '', 
        email: '', 
        address: '', 
        location: '', 
        date: getTodayDate() 
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1500); 
  };

  return (
    <>
      <div className="header-wrapper">
        <div className="header" style={{ textAlign: 'left', margin: 0 }}>
          <h1>SecureImage</h1>
          <p>Invisibly embed your copyright data into your photos.</p>
        </div>
        
        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Dark Mode">
          {isDarkMode ? (
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>
      </div>

      <div className="app-container">
        <div className="card">
          <form onSubmit={handleSubmit}>
            
            <div className="form-group">
              <label>Author Name</label>
              <input type="text" name="name" className="form-control" placeholder="Jane Doe" required onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" className="form-control" placeholder="jane@example.com" required onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Physical Address</label>
              <input type="text" name="address" className="form-control" placeholder="123 Studio Lane" required onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Photo Location</label>
              <input type="text" name="location" className="form-control" placeholder="Tokyo, Japan" required onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                name="date" 
                className="form-control" 
                value={formData.date}
                required 
                onChange={handleInputChange} 
              />
            </div>

            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Upload Image
            </label>
            
            <div 
              className={`upload-area ${previewUrl ? 'has-image' : ''} ${isDragging ? 'dragging' : ''}`} 
              onClick={() => fileInputRef.current.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/png, image/jpeg" 
                onChange={handleFileChange} 
                className="hidden-input" 
              />
              
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" className="image-preview" />
                  <div className="preview-overlay">{isDragging ? 'Drop to replace' : 'Click or Drop to change'}</div>
                </>
              ) : (
                <>
                  <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <p style={{ fontWeight: 600, color: 'var(--text-main)', pointerEvents: 'none' }}>
                    {isDragging ? 'Drop image here!' : 'Click or Drag image here'}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', pointerEvents: 'none' }}>PNG or JPG</p>
                </>
              )}
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? (
                <><div className="spinner"></div> Processing...</>
              ) : (
                'Generate Secured Image'
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Info & Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="info-box">
            <h3>How Steganography Works</h3>
            <ul>
              <li>Your details are compiled into a hidden JSON payload.</li>
              <li>The API alters the Least Significant Bits (LSB) of the image's pixels.</li>
              <li>The visual appearance remains 100% identical to the human eye.</li>
              <li>Do not convert the resulting PNG to a JPG, or the hidden data will be destroyed.</li>
            </ul>
          </div>

          {downloadUrl && (
            <div className="card result-card">
              <svg className="result-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h2>Success!</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Your invisibly watermarked image is ready.</p>
              
              <a 
                href={downloadUrl} 
                download={`secured_${file?.name || 'image.png'}`} 
                style={{ textDecoration: 'none' }}
                onClick={handleDownloadAndReset}
              >
                <button className="btn btn-success">
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download PNG
                </button>
              </a>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default App;