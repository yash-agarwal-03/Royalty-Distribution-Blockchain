import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { FiMusic, FiKey, FiMic, FiHeadphones, FiDollarSign, FiUploadCloud, FiPlayCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { WalletContext } from '../context/WalletContext.jsx';

const LandingPage = () => {
  const { connectWallet, login, userRole, isLoading } = useContext(WalletContext);
  const navigate = useNavigate();

  // 1. SET BACKGROUND
  useEffect(() => {
    document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundPosition = "center";
    return () => { document.body.style.backgroundImage = ""; };
  }, []);

  // 2. REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    if (!isLoading && userRole) {
        if (userRole === 'Admin') navigate('/admin');
        else if (userRole === 'Contributor') navigate('/dashboard'); // Merged Role
        else navigate('/browse');
    }
  }, [userRole, isLoading, navigate]);

  // --- STATE ---
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState('User');
  const [adminCreds, setAdminCreds] = useState({ id: '', password: '' });
  
  const [pendingWallet, setPendingWallet] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false);

  // --- LOADING GUARD ---
  if (isLoading) {
      return (
          <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-black text-white">
              <Spinner animation="border" variant="danger" />
              <p className="mt-3 text-white-50">Initializing Session...</p>
          </div>
      );
  }

  // Helper to shorten address
  const formatAddress = (addr) => {
      if (!addr) return "...";
      return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // --- LOGIC: CANCEL LOGIN ---
  const handleCancelLogin = () => {
      setShowConfirmModal(false);
      setPendingWallet(null);
      setIsProcessing(false); 
  };

  // --- STEP 1: INITIATE LOGIN ---
  const handleInitiateLogin = async () => {
    setIsProcessing(true);
    
    // A. Password Check for Admin
    if (selectedRole === 'Admin') {
        if(adminCreds.id !== 'admin' || adminCreds.password !== 'password') {
            alert('Invalid Credentials');
            setIsProcessing(false);
            return;
        }
    }

    // B. Fetch Current Wallet
    try {
        let walletAddress = await connectWallet(false); 
        
        if (!walletAddress) {
            walletAddress = await connectWallet(true);
        }
        
        if (walletAddress) {
            setPendingWallet(walletAddress);
            setShowRoleModal(false); 
            setShowConfirmModal(true); 
        } else {
             setIsProcessing(false);
        }
    } catch (error) {
        console.error("Wallet check failed:", error);
        setIsProcessing(false);
    }
  };

  // --- STEP 2: FINAL LOCK-IN ---
  const handleConfirmLogin = () => {
      if (pendingWallet) {
          login(selectedRole, pendingWallet);
      }
  };

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
      <Container className="d-flex flex-column justify-content-center align-items-center text-center" style={{ minHeight: '85vh' }}>
        <p className="text-uppercase tracking-widest mb-3" style={{ color: 'var(--neon-pink)', letterSpacing: '3px', fontWeight: 'bold' }}>Web3 Music Distribution</p>
        <h1 className="landing-title">SONIC LEDGER</h1>
        <p className="landing-subtitle">Upload your beats. Define your splits. Get paid instantly.<br/>The decentralized marketplace for modern creators.</p>
        <div className="mt-4"><button className="btn-landing-pink" onClick={() => setShowRoleModal(true)}>START PLATFORM</button></div>
      </Container>

      {/* Info Section */}
      <Container className="mb-5">
        <Row className="justify-content-center mb-5">
            <Col lg={8} className="text-center">
                <h2 className="fw-bold text-white display-6">How The Platform Works</h2>
                <div style={{ width: '60px', height: '4px', background: 'var(--neon-pink)', margin: '20px auto' }}></div>
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

      {/* MODAL 1: Role Selection */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} centered contentClassName="modal-glass-content" size="lg">
        <Modal.Header closeButton closeVariant="white" className="border-0 p-4">
            <Modal.Title className="fw-bold text-white">Access Portal</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 pt-0">
            <Row>
                <Col md={6} className="border-end border-secondary pe-4">
                    <p className="text-white-50 mb-3">Select your role:</p>
                    <RoleItem role="User" label="Listener" icon={<FiHeadphones />} />
                    {/* MERGED CONTRIBUTOR ROLE */}
                    <RoleItem role="Contributor" label="Creator (Artist/Producer)" icon={<FiMic />} />
                    <RoleItem role="Admin" label="Administrator" icon={<FiKey />} />
                </Col>
                <Col md={6} className="ps-4 d-flex flex-column justify-content-center">
                    <div className="text-center mb-4">
                        <h4 className="fw-bold text-white mb-3">{selectedRole === 'Contributor' ? 'Creator' : selectedRole} Login</h4>
                        <p className="text-white-50 small">{selectedRole === 'Admin' ? 'Enter secure credentials.' : 'Connect your wallet to continue.'}</p>
                    </div>
                    {selectedRole === 'Admin' && (
                        <div className="mb-3">
                            <Form.Control type="text" placeholder="Admin ID" className="mb-2 bg-dark text-white border-secondary" value={adminCreds.id} onChange={(e) => setAdminCreds({...adminCreds, id: e.target.value})} />
                            <Form.Control type="password" placeholder="Password" className="bg-dark text-white border-secondary" value={adminCreds.password} onChange={(e) => setAdminCreds({...adminCreds, password: e.target.value})} />
                        </div>
                    )}
                    <Button variant="danger" size="lg" className="w-100 rounded-0 fw-bold py-3" style={{background: 'var(--neon-pink)', border: 'none'}} onClick={handleInitiateLogin} disabled={isProcessing}>
                        {isProcessing ? 'Checking Wallet...' : 'CONTINUE'}
                    </Button>
                </Col>
            </Row>
        </Modal.Body>
      </Modal>

      {/* MODAL 2: Wallet Confirmation */}
      <Modal 
        show={showConfirmModal} 
        onHide={handleCancelLogin} 
        centered 
        contentClassName="modal-glass-content"
      >
        <Modal.Header closeButton closeVariant="white" className="border-0 pb-0" />
        <Modal.Body className="p-4 pt-0 text-center">
            <FiAlertTriangle size={50} className="text-warning mb-3" />
            <h3 className="fw-bold text-white mb-2">Confirm Identity</h3>
            <p className="text-white-50 mb-4 px-3">
                You are about to login to the <strong className="text-white">{selectedRole} Portal</strong>.
            </p>
            
            <div className="d-flex justify-content-center mb-4">
                <div className="py-2 px-4 rounded-pill" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <small className="text-white-50 me-2">Wallet:</small>
                    <span className="font-monospace text-info fw-bold">
                        {formatAddress(pendingWallet)}
                    </span>
                </div>
            </div>

            <div className="d-grid gap-3">
                <Button variant="success" size="lg" className="fw-bold py-3" onClick={handleConfirmLogin}>
                    <FiCheckCircle className="me-2"/> CONFIRM & LOGIN
                </Button>
                
                <p className="text-white-50 small mt-2">
                    To use a different account, switch it in your <strong>crypto wallet</strong> extension, then try again.
                </p>

                <Button variant="link" className="text-white-50 text-decoration-none" onClick={handleCancelLogin}>
                    Cancel
                </Button>
            </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default LandingPage;