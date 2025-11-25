import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Modal, Form } from 'react-bootstrap';
import { FiMusic, FiUsers, FiPlayCircle, FiKey, FiMic, FiHeadphones, FiDollarSign, FiUploadCloud } from 'react-icons/fi';
import { WalletContext } from '../context/WalletContext';

const LandingPage = () => {
  const { connectWallet, currentAccount, login, logout, userRole, isLoading } = useContext(WalletContext);
  const navigate = useNavigate();

  // 1. BACKGROUND SETUP
  useEffect(() => {
    document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundPosition = "center";
    return () => { document.body.style.backgroundImage = ""; };
  }, []);

  // 2. REDIRECT LOGIC
  useEffect(() => {
    if (!isLoading && userRole) {
        if (userRole === 'Admin') navigate('/admin');
        else if (['Artist', 'Producer'].includes(userRole)) navigate('/dashboard');
        else navigate('/browse');
    }
  }, [userRole, isLoading, navigate]);

  // --- STATE ---
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('User');
  const [adminCreds, setAdminCreds] = useState({ id: '', password: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  // 3. SAFEGUARD: VISIBLE LOADING SCREEN (No Black Screen!)
  if (isLoading) {
      return <div className="vh-100 d-flex align-items-center justify-content-center text-white"><h3>Loading Platform...</h3></div>;
  }

  // If user is logged in but redirect hasn't finished yet, show this instead of null
  if (userRole) {
      return (
          <div className="vh-100 d-flex flex-column align-items-center justify-content-center text-white" style={{background: 'rgba(0,0,0,0.9)'}}>
              <h2 className="mb-3">Redirecting to Dashboard...</h2>
              <Button variant="outline-danger" onClick={logout}>
                  Click here if stuck (Force Logout)
              </Button>
          </div>
      );
  }

  // --- LOGIN HANDLER ---
  const handleLogin = async () => {
    setIsProcessing(true);
    
    if (selectedRole === 'Admin') {
        // ... Admin logic remains same ...
        if(adminCreds.id === 'admin' && adminCreds.password === '123') {
            login('Admin');
            navigate('/admin');
        } else {
            alert('Invalid Credentials');
            setIsProcessing(false);
        }
    } else {
        // CHANGED: Pass 'true' to force the MetaMask account selection popup
        const walletAddress = await connectWallet(true); 
        
        if (walletAddress) {
            login(selectedRole, walletAddress);
        }
        setIsProcessing(false);
    }
  };

  // Helper Component
  const RoleItem = ({ role, label, icon }) => (
    <div 
        className={`p-3 mb-2 rounded border d-flex align-items-center ${selectedRole === role ? 'border-danger bg-dark' : 'border-secondary'}`} 
        style={{cursor: 'pointer', transition: '0.2s', background: 'rgba(255,255,255,0.05)'}}
        onClick={() => setSelectedRole(role)}
    >
        <span className="fs-4 me-3 text-white">{icon}</span>
        <div><h6 className="m-0 fw-bold text-white">{label}</h6></div>
    </div>
  );

  return (
    <div className="landing-container" style={{ overflowY: 'auto', paddingBottom: '50px' }}>
      
      {/* HERO */}
      <Container className="d-flex flex-column justify-content-center align-items-center text-center" style={{ minHeight: '85vh' }}>
        <p className="text-uppercase tracking-widest mb-3" style={{ color: 'var(--neon-pink)', letterSpacing: '3px', fontWeight: 'bold' }}>
            Web3 Music Distribution
        </p>
        <h1 className="landing-title" style={{fontSize: '5rem', fontWeight: '800', color: 'white'}}>SONIC LEDGER</h1>
        <p className="landing-subtitle text-white-50">
            Upload your beats. Define your splits. Get paid instantly.<br/>
            The decentralized marketplace for modern creators.
        </p>
        <div className="mt-4">
            <button className="btn-landing-pink" 
                style={{border: '2px solid #ff0055', background: 'transparent', color: 'white', padding: '15px 40px', fontSize: '1.2rem', fontWeight: 'bold'}}
                onClick={() => setShowModal(true)}>
                START PLATFORM
            </button>
        </div>
      </Container>

      {/* HOW IT WORKS */}
      <Container className="mb-5">
        <Row className="justify-content-center mb-5">
            <Col lg={8} className="text-center">
                <h2 className="fw-bold text-white display-6">How The Platform Works</h2>
                <div style={{ width: '60px', height: '4px', background: '#ff0055', margin: '20px auto' }}></div>
            </Col>
        </Row>
        <Row className="g-4">
            <Col md={4}>
                <div className="p-4 h-100 rounded-4 text-center" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <FiUploadCloud size={32} className="mb-3" color="#ff0055" />
                    <h4 className="text-white fw-bold">1. Upload</h4>
                    <p className="text-white-50">Artists register tracks and set splits on-chain.</p>
                </div>
            </Col>
            <Col md={4}>
                <div className="p-4 h-100 rounded-4 text-center" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <FiPlayCircle size={32} className="mb-3" color="#00ffff" />
                    <h4 className="text-white fw-bold">2. Unlock</h4>
                    <p className="text-white-50">Fans pay crypto to unlock and stream high-quality audio.</p>
                </div>
            </Col>
            <Col md={4}>
                <div className="p-4 h-100 rounded-4 text-center" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <FiDollarSign size={32} className="mb-3" color="#667eea" />
                    <h4 className="text-white fw-bold">3. Earn</h4>
                    <p className="text-white-50">Smart contracts distribute royalties instantly.</p>
                </div>
            </Col>
        </Row>
      </Container>

      {/* MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="modal-glass-content" size="lg">
        <Modal.Header closeButton closeVariant="white" className="border-0 p-4">
            <Modal.Title className="fw-bold text-white">Access Portal</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 pt-0">
            <Row>
                <Col md={6} className="border-end border-secondary pe-4">
                    <p className="text-white-50 mb-3">Select your role:</p>
                    <RoleItem role="User" label="Listener" icon={<FiHeadphones />} />
                    <RoleItem role="Artist" label="Artist" icon={<FiMic />} />
                    <RoleItem role="Producer" label="Producer" icon={<FiMusic />} />
                    <RoleItem role="Admin" label="Administrator" icon={<FiKey />} />
                </Col>
                <Col md={6} className="ps-4 d-flex flex-column justify-content-center">
                    <div className="text-center mb-4">
                        <h4 className="fw-bold text-white mb-3">{selectedRole} Login</h4>
                        <p className="text-white-50 small">
                            {selectedRole === 'Admin' ? 'Enter secure credentials.' : 'Connect your wallet to continue.'}
                        </p>
                    </div>
                    {selectedRole === 'Admin' && (
                        <div className="mb-3">
                            <Form.Control type="text" placeholder="Admin ID" className="mb-2 bg-dark text-white border-secondary" value={adminCreds.id} onChange={(e) => setAdminCreds({...adminCreds, id: e.target.value})} />
                            <Form.Control type="password" placeholder="Password" className="bg-dark text-white border-secondary" value={adminCreds.password} onChange={(e) => setAdminCreds({...adminCreds, password: e.target.value})} />
                        </div>
                    )}
                    <Button variant="danger" size="lg" className="w-100 rounded-0 fw-bold py-3" 
                        style={{background: '#ff0055', border: 'none'}} 
                        onClick={handleLogin} 
                        disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : 'ENTER PLATFORM'}
                    </Button>
                </Col>
            </Row>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default LandingPage;