import React, { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { FiUploadCloud, FiMusic, FiDollarSign, FiUser, FiLogOut, FiImage, FiHeadphones, FiTarget } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // 1. SAFE CONTEXT ACCESS
  // We handle the case where context might be undefined to prevent white/black screen crashes
  const context = useContext(WalletContext);
  const logout = context ? context.logout : () => navigate('/'); 

  // 2. BACKGROUND IMAGE FIX
  useEffect(() => {
    // In React/Vite, files in 'public' are accessed from root '/'.
    // Ensure 'image2.png' is actually inside the 'public' folder of your project.
    document.body.style.backgroundImage = "url('/image2.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundPosition = "center";
    
    return () => { document.body.style.backgroundImage = ""; };
  }, []);

  const [loading, setLoading] = useState(false);
  const [fileNames, setFileNames] = useState({ cover: null, audio: null });
  const [formData, setFormData] = useState({
    title: '', artistName: '', artistWallet: '', producerName: '', producerWallet: '', price: '', royaltySplit: 70,
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) setFileNames({ ...fileNames, [type]: file.name });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Submitting Data:", formData);
    setTimeout(() => { alert(`Simulation Success!`); setLoading(false); }, 1500);
  };

  const calculateShare = (percentage) => {
    if (!formData.price) return "0.00";
    return (parseFloat(formData.price) * (percentage / 100)).toFixed(4);
  };

  return (
    <div className="page-content" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
      <Container>
        {/* Header */}
        <Row className="justify-content-center mb-5">
          <Col lg={10}>
            <div className="d-flex justify-content-between align-items-end px-2">
              <div>
                <h4 className="text-secondary mb-2" style={{ letterSpacing: '1px', fontWeight: '600' }}>ADMIN PORTAL</h4>
                <h1 className="fw-bold text-white display-5" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Song Registration</h1>
              </div>
              <Button variant="outline-light" size="sm" className="rounded-pill px-4" onClick={logout}>
                <FiLogOut className="me-2" /> Logout
              </Button>
            </div>
          </Col>
        </Row>

        {/* Form Card */}
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="glass-card shadow-lg">
              <div className="glass-header">
                <h4 className="mb-1 fw-bold text-white">Upload New Track</h4>
                <p className="text-secondary mb-0" style={{ opacity: 0.9 }}>Enter metadata, upload media, and distribute shares.</p>
              </div>
              
              <div className="glass-body px-4 px-md-5 py-5">
                <Form onSubmit={handleRegister}>
                  {/* Row 1: Title & Price */}
                  <Row className="mb-4 g-4">
                    <Col md={7}>
                      <Form.Group>
                        <Form.Label>Song Title</Form.Label>
                        <InputGroup className="input-group-lg shadow-sm">
                          <InputGroup.Text><FiMusic className="mx-2" /></InputGroup.Text>
                          <Form.Control type="text" placeholder="e.g. Enter Sandman" name="title" value={formData.title} onChange={handleChange} required />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={5}>
                      <Form.Group>
                        <Form.Label>Price (ETH)</Form.Label>
                        <InputGroup className="input-group-lg shadow-sm">
                          <InputGroup.Text><FiDollarSign className="mx-2" /></InputGroup.Text>
                          <Form.Control type="number" step="0.001" placeholder="0.05" name="price" value={formData.price} onChange={handleChange} required />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Row 2: Artist Info */}
                  <Row className="mb-4 g-4">
                    <Col md={5}>
                      <Form.Group>
                        <Form.Label>Artist Name</Form.Label>
                        <InputGroup className="input-group-lg shadow-sm">
                          <InputGroup.Text><FiUser className="mx-2" /></InputGroup.Text>
                          <Form.Control type="text" placeholder="Stage Name" name="artistName" value={formData.artistName} onChange={handleChange} required />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={7}>
                      <Form.Group>
                        <Form.Label>Artist Wallet Address</Form.Label>
                        <Form.Control className="form-control-lg shadow-sm" type="text" placeholder="0x..." name="artistWallet" value={formData.artistWallet} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Row 3: Producer Info */}
                  <Row className="mb-5 g-4">
                    <Col md={5}>
                      <Form.Group>
                        <Form.Label>Producer Name</Form.Label>
                        <InputGroup className="input-group-lg shadow-sm">
                          <InputGroup.Text><FiTarget className="mx-2" /></InputGroup.Text>
                          <Form.Control type="text" placeholder="Producer Name" name="producerName" value={formData.producerName} onChange={handleChange} required />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={7}>
                      <Form.Group>
                        <Form.Label>Producer Wallet Address</Form.Label>
                        <Form.Control className="form-control-lg shadow-sm" type="text" placeholder="0x..." name="producerWallet" value={formData.producerWallet} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Royalty Slider Section */}
                  <div className="p-4 rounded-4 mb-5 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)' }}>
                     <Row className="align-items-center g-4">
                        <Col md={7}>
                            <Form.Label className="h5 mb-4 d-block text-white fw-bold">Royalty Distribution</Form.Label>
                            <Form.Range min={0} max={100} step={5} value={formData.royaltySplit} onChange={(e) => setFormData({...formData, royaltySplit: e.target.value})} style={{ height: '30px', cursor: 'pointer' }} />
                            <div className="d-flex justify-content-between text-white small mt-2 fw-bold" style={{ opacity: 0.8 }}><span>0%</span><span>50%</span><span>100%</span></div>
                        </Col>
                        <Col md={5}>
                            <div className="p-3 rounded-3 mb-2 d-flex justify-content-between align-items-center" style={{ background: 'rgba(255,255,255,0.1)', borderLeft: '4px solid var(--accent-yellow)' }}>
                                <div>
                                  <small className="text-white-50 d-block" style={{fontSize: '0.85rem'}}>{formData.artistName || "Artist"} ({formData.royaltySplit}%)</small>
                                  <span className="text-white small font-monospace">{formData.artistWallet ? formData.artistWallet.slice(0,6)+'...'+formData.artistWallet.slice(-4) : 'No Wallet'}</span>
                                </div>
                                <div className="text-end"><h5 className="mb-0 text-white fw-bold">{calculateShare(formData.royaltySplit)} ETH</h5></div>
                            </div>
                            <div className="p-3 rounded-3 d-flex justify-content-between align-items-center" style={{ background: 'rgba(255,255,255,0.05)', borderLeft: '4px solid var(--accent-green)' }}>
                                <div>
                                  <small className="text-white-50 d-block" style={{fontSize: '0.85rem'}}>{formData.producerName || "Producer"} ({100 - formData.royaltySplit}%)</small>
                                  <span className="text-white small font-monospace">{formData.producerWallet ? formData.producerWallet.slice(0,6)+'...'+formData.producerWallet.slice(-4) : 'No Wallet'}</span>
                                </div>
                                <div className="text-end"><h5 className="mb-0 text-white fw-bold">{calculateShare(100 - formData.royaltySplit)} ETH</h5></div>
                            </div>
                        </Col>
                     </Row>
                  </div>

                  {/* File Uploads */}
                  <Row className="mb-5 g-4">
                    <Col md={6}>
                      <Form.Label className="fw-bold">Cover Art</Form.Label>
                      <label className="custom-file-upload w-100 shadow-sm">
                        <FiImage /><span className="fw-bold mt-2 text-white">{fileNames.cover || "Choose Image"}</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'cover')} required hidden />
                      </label>
                    </Col>
                    <Col md={6}>
                      <Form.Label className="fw-bold">Audio Track</Form.Label>
                      <label className="custom-file-upload w-100 shadow-sm">
                        <FiHeadphones /><span className="fw-bold mt-2 text-white">{fileNames.audio || "Choose Audio"}</span>
                        <input type="file" accept="audio/*" onChange={(e) => handleFileSelect(e, 'audio')} required hidden />
                      </label>
                    </Col>
                  </Row>

                  <Button type="submit" className="btn-glass-primary w-100 py-3 d-flex justify-content-center align-items-center gap-3 shadow-lg" disabled={loading} style={{fontSize: '1.2rem'}}>
                    {loading ? 'Processing...' : <><FiUploadCloud size={28} /> Register Song On-Chain</>}
                  </Button>

                </Form>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminDashboard;