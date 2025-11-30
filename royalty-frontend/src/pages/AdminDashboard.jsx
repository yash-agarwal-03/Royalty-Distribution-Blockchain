import React, { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, Form, Button, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { FiUploadCloud, FiMusic, FiDollarSign, FiUser, FiLogOut, FiTarget, FiImage, FiHeadphones, FiAlertTriangle, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';
import useContract from '../hooks/useContract';
import { ethers } from 'ethers';
import { uploadFileToIPFS, uploadMetadataToIPFS } from '../api/ipfs';
import { platformFeePercentage } from '../utils/constants';
const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const context = useContext(WalletContext);
  const { currentAccount, connectWallet, logout } = context;

  const contract = useContract();

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(""); // Granular loading status
  const [fileNames, setFileNames] = useState({ cover: null, audio: null });
  const [files, setFiles] = useState({ cover: null, audio: null }); // Actual File Objects
  
  // SMART STATE: Holds the CID if Pinata succeeds but Blockchain fails
  const [readyToMintCID, setReadyToMintCID] = useState(null); 
  const [existingSongs, setExistingSongs] = useState([]);

  const [formData, setFormData] = useState({
    title: '', artistName: '', artistWallet: '', producerName: '', producerWallet: '', price: '', royaltySplit: 70,
  });


  useEffect(() => {
    document.body.style.backgroundImage = "url('/bg-admin.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundPosition = "center";
    
    // Fetch existing songs for Duplicate Check
    const fetchExisting = async () => {
        if(contract) {
            try {
                const songs = await contract.getAllSongs();
                setExistingSongs(songs);
            } catch(e) { console.error("Could not fetch catalog", e); }
        }
    };
    fetchExisting();

    return () => { document.body.style.backgroundImage = ""; };
  }, [contract]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
        setFileNames({ ...fileNames, [type]: file.name });
        setFiles({ ...files, [type]: file });
    }
  };

  // --- RESET LOGIC (Clears Ghost State) ---
  const handleReset = () => {
      setReadyToMintCID(null);
      setFormData({
        title: '', artistName: '', artistWallet: '', producerName: '', producerWallet: '', price: '', royaltySplit: 70,
      });
      setFileNames({ cover: null, audio: null });
      setFiles({ cover: null, audio: null });
      setStatusMsg("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("Validating...");

    try {
        // Force connection if missing
        let activeAccount = currentAccount;
        if (!activeAccount) {
            activeAccount = await connectWallet(true); // Force Popup
            if (!activeAccount) {
                setLoading(false);
                return;
            }
        }

        if (!contract) throw new Error("Contract connection failed. Please refresh.");

        // 1. DUPLICATE CHECK
        const isDuplicate = existingSongs.some(s => 
            s.title.toLowerCase() === formData.title.toLowerCase() && 
            s.artistName.toLowerCase() === formData.artistName.toLowerCase()
        );
        if(isDuplicate) {
            throw new Error("This song/artist combo is already registered!");
        }

        if (!ethers.isAddress(formData.artistWallet) || !ethers.isAddress(formData.producerWallet)) {
            throw new Error("Invalid Ethereum Address.");
        }

        // 2. IPFS UPLOAD (Skip if we already have a CID from a failed retry)
        let metadataCID = readyToMintCID;

        if (!metadataCID) {
            setStatusMsg("Uploading Cover Art to IPFS...");
            const coverCID = await uploadFileToIPFS(files.cover);
            if(!coverCID) throw new Error("Cover Upload Failed");

            setStatusMsg("Uploading Audio to IPFS (This may take a while)...");
            const audioCID = await uploadFileToIPFS(files.audio);
            if(!audioCID) throw new Error("Audio Upload Failed");

            // Construct Metadata
            const metadata = {
                name: formData.title,
                description: `Artist: ${formData.artistName}, Producer: ${formData.producerName}`,
                image: `https://gateway.pinata.cloud/ipfs/${coverCID}`,
                animation_url: `https://gateway.pinata.cloud/ipfs/${audioCID}`,
                properties: {
                    artist: formData.artistName,
                    producer: formData.producerName,
                    split: formData.royaltySplit
                }
            };

            setStatusMsg("Finalizing Metadata...");
            metadataCID = await uploadMetadataToIPFS(metadata);
            
            // Save state in case next step fails
            setReadyToMintCID(metadataCID); 
        }

        const priceInWei = ethers.parseEther(formData.price.toString());
        const split = parseInt(formData.royaltySplit);

        console.log("Registering Song...", { title: formData.title, price: priceInWei.toString() });

        // 3. BLOCKCHAIN WRITE
        setStatusMsg("Waiting for Wallet Signature...");
        const tx = await contract.registerSong(
            formData.title,
            formData.artistName,
            metadataCID, // Real IPFS Hash
            formData.artistWallet,
            formData.producerWallet,
            split, 
            priceInWei
        );

        console.log("Transaction Hash:", tx.hash);
        setStatusMsg("Mining Transaction...");
        await tx.wait();

        alert("✅ Song Registered Successfully!");
        handleReset(); // Clear everything

    } catch (error) {
        console.error("Registration Error:", error);
        let msg = error.reason || error.message || "Unknown Error";
        if (msg.includes("estimateGas") || msg.includes("missing revert data")) {
            msg = "Transaction Rejected. Are you the Admin (Account #0)?";
        }
        alert(`Failed: ${msg}`);
        // NOTE: We do NOT clear readyToMintCID here, allowing Retry.
    } finally {
        setLoading(false);
        setStatusMsg("");
    }
  };

  const getPrice = () => parseFloat(formData.price) || 0;
  const getPlatformFee = () => (getPrice() * platformFeePercentage).toFixed(4);
  const calculateShare = (percentage) => {
    const price = getPrice();
    const remainder = price - (price * platformFeePercentage);
    return (remainder * (percentage / 100)).toFixed(4);
  };

  return (
    <div className="page-content" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
      <Container>
        <Row className="justify-content-center mb-5">
          <Col lg={10}>
            <div className="d-flex justify-content-between align-items-end px-2">
              <div>
                <h4 className="text-secondary mb-2" style={{ letterSpacing: '1px', fontWeight: '600' }}>ADMIN PORTAL</h4>
                <h1 className="fw-bold text-white display-5" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Song Registration</h1>
                <p className="text-white-50 font-monospace mb-0" style={{fontSize: '0.9rem'}}>
                    <FiUser className="me-2"/> Connected: {currentAccount ? 
                        <span className="text-success">{currentAccount.substring(0,6)}...{currentAccount.substring(38)}</span> : 
                        <span className="text-danger cursor-pointer" onClick={() => connectWallet(true)} style={{cursor: 'pointer', textDecoration: 'underline'}}>Not Connected (Click to Connect)</span>
                    }
                </p>
              </div>
              <Button variant="outline-light" size="sm" className="rounded-pill px-4" onClick={logout}>
                <FiLogOut className="me-2" /> Logout
              </Button>
            </div>
          </Col>
        </Row>

        {/* Rest of the Form Layout remains exactly the same */}
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="glass-card shadow-lg">
              <div className="glass-header">
                <h4 className="mb-1 fw-bold text-white">Upload New Track</h4>
                <p className="text-secondary mb-0" style={{ opacity: 0.9 }}>Enter metadata, upload media, and distribute shares.</p>
              </div>
              <div className="glass-body px-4 px-md-5 py-5">
                
                {/* RECOVERY MODE ALERT (Only New UI Element, blends in) */}
                {readyToMintCID && (
                    <Alert variant="warning" className="mb-4 d-flex align-items-center justify-content-between" style={{background: 'rgba(255, 193, 7, 0.15)', border: '1px solid #ffc107', color: '#ffc107'}}>
                        <div>
                            <strong><FiRefreshCw className="me-2"/>Upload Paused!</strong> 
                            <span className="ms-2">Files are on IPFS ({readyToMintCID.substring(0,6)}...), but the transaction failed.</span>
                        </div>
                        <Button variant="outline-warning" size="sm" onClick={handleReset}>
                            <FiTrash2 className="me-1"/> Discard & Reset
                        </Button>
                    </Alert>
                )}

                <Form onSubmit={handleRegister}>
                  <Row className="mb-4 g-4">
                    <Col md={7}>
                      <Form.Group>
                        <Form.Label>Song Title</Form.Label>
                        <InputGroup className="input-group-lg shadow-sm">
                          <InputGroup.Text><FiMusic className="mx-2" /></InputGroup.Text>
                          <Form.Control type="text" placeholder="e.g. Enter Sandman" name="title" value={formData.title} onChange={handleChange} required disabled={!!readyToMintCID}/>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={5}>
                      <Form.Group>
                        <Form.Label>Price (ETH)</Form.Label>
                        <InputGroup className="input-group-lg shadow-sm">
                          <InputGroup.Text><FiDollarSign className="mx-2" /></InputGroup.Text>
                          <Form.Control type="number" step="0.001" placeholder="0.05" name="price" value={formData.price} onChange={handleChange} required disabled={!!readyToMintCID}/>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mb-4 g-4">
                    <Col md={5}>
                      <Form.Group>
                        <Form.Label>Artist Name</Form.Label>
                        <InputGroup className="input-group-lg shadow-sm">
                          <InputGroup.Text><FiUser className="mx-2" /></InputGroup.Text>
                          <Form.Control type="text" placeholder="Stage Name" name="artistName" value={formData.artistName} onChange={handleChange} required disabled={!!readyToMintCID}/>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={7}>
                      <Form.Group>
                        <Form.Label>Artist Wallet Address</Form.Label>
                        <Form.Control className="form-control-lg shadow-sm" type="text" placeholder="0x..." name="artistWallet" value={formData.artistWallet} onChange={handleChange} required disabled={!!readyToMintCID}/>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mb-5 g-4">
                    <Col md={5}>
                      <Form.Group>
                        <Form.Label>Producer Name</Form.Label>
                        <InputGroup className="input-group-lg shadow-sm">
                          <InputGroup.Text><FiTarget className="mx-2" /></InputGroup.Text>
                          <Form.Control type="text" placeholder="Producer Name" name="producerName" value={formData.producerName} onChange={handleChange} required disabled={!!readyToMintCID}/>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={7}>
                      <Form.Group>
                        <Form.Label>Producer Wallet Address</Form.Label>
                        <Form.Control className="form-control-lg shadow-sm" type="text" placeholder="0x..." name="producerWallet" value={formData.producerWallet} onChange={handleChange} required disabled={!!readyToMintCID}/>
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="p-4 rounded-4 mb-5 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)' }}>
                     <Row className="align-items-center g-4">
                        <Col md={12} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{background: 'rgba(255,255,255,0.05)'}}>
                                <span className="text-white-50 small text-uppercase fw-bold ls-1">Platform Fee ({(platformFeePercentage * 100)}%)</span>
                                <span className="text-white fw-bold">{getPlatformFee()} ETH</span>
                            </div>
                        </Col>
                        <Col md={7}>
                            <Form.Label className="h5 mb-4 d-block text-white fw-bold">Royalty Distribution (Remaining {(1 - platformFeePercentage) * 100}%)</Form.Label>
                            <Form.Range min={0} max={100} step={5} value={formData.royaltySplit} onChange={(e) => setFormData({...formData, royaltySplit: e.target.value})} style={{ height: '30px', cursor: 'pointer' }} disabled={!!readyToMintCID}/>
                            <div className="d-flex justify-content-between text-white small mt-2 fw-bold" style={{ opacity: 0.8 }}><span>0%</span><span>50%</span><span>100%</span></div>
                        </Col>
                        <Col md={5}>
                            <div className="p-3 rounded-3 mb-2 d-flex justify-content-between align-items-center" style={{ background: 'rgba(255,255,255,0.1)', borderLeft: '4px solid var(--accent-yellow)' }}>
                                <div><small className="text-white-50 d-block" style={{fontSize: '0.85rem'}}>{formData.artistName || "Artist"} ({formData.royaltySplit}%)</small><span className="text-white small font-monospace">{formData.artistWallet ? formData.artistWallet.slice(0,6)+'...'+formData.artistWallet.slice(-4) : 'No Wallet'}</span></div>
                                <div className="text-end"><h5 className="mb-0 text-white fw-bold">{calculateShare(formData.royaltySplit)} ETH</h5></div>
                            </div>
                            <div className="p-3 rounded-3 d-flex justify-content-between align-items-center" style={{ background: 'rgba(255,255,255,0.05)', borderLeft: '4px solid var(--accent-green)' }}>
                                <div><small className="text-white-50 d-block" style={{fontSize: '0.85rem'}}>{formData.producerName || "Producer"} ({100 - formData.royaltySplit}%)</small><span className="text-white small font-monospace">{formData.producerWallet ? formData.producerWallet.slice(0,6)+'...'+formData.producerWallet.slice(-4) : 'No Wallet'}</span></div>
                                <div className="text-end"><h5 className="mb-0 text-white fw-bold">{calculateShare(100 - formData.royaltySplit)} ETH</h5></div>
                            </div>
                        </Col>
                     </Row>
                  </div>
                  
                  {/* Hide File Inputs if in Recovery Mode (To prevent confusion) */}
                  {!readyToMintCID && (
                      <Row className="mb-5 g-4">
                        <Col md={6}><Form.Label className="fw-bold">Cover Art</Form.Label><label className="custom-file-upload w-100 shadow-sm"><FiImage /><span className="fw-bold mt-2 text-white">{fileNames.cover || "Choose Image"}</span><input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'cover')} required hidden /></label></Col>
                        <Col md={6}><Form.Label className="fw-bold">Audio Track</Form.Label><label className="custom-file-upload w-100 shadow-sm"><FiHeadphones /><span className="fw-bold mt-2 text-white">{fileNames.audio || "Choose Audio"}</span><input type="file" accept="audio/*" onChange={(e) => handleFileSelect(e, 'audio')} required hidden /></label></Col>
                      </Row>
                  )}

                  <Button type="submit" className="btn-glass-primary w-100 py-3 d-flex justify-content-center align-items-center gap-3 shadow-lg" disabled={loading} style={{fontSize: '1.2rem'}}>
                    {loading ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/>
                            {statusMsg}
                        </>
                    ) : readyToMintCID ? (
                        <><FiRefreshCw size={28} className="me-2"/> RETRY TRANSACTION</>
                    ) : (
                        <><FiUploadCloud size={28} className="me-2"/> Register Song On-Chain</>
                    )}
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