import React, { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, Button, Modal, Spinner } from 'react-bootstrap';
import { FiPlay, FiPause, FiLock, FiLogOut, FiMusic, FiShoppingBag, FiAlertCircle, FiCheck, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext';

// Standard Vinyl Image for missing covers (Consistent Size)
const DEFAULT_COVER = "/image.png"; // Make sure this file exists in public folder

// --- MOCK DATA ---
const ALL_SONGS = [
    { id: 1, title: "Neon Nights", artist: "The Weeknd", price: 0.05, cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop", unlocked: true },
    { id: 2, title: "Cyber Punk", artist: "Daft Punk", price: 0.08, cover: "", unlocked: false },
    { id: 3, title: "Deep Focus", artist: "Hans Zimmer", price: 0.02, cover: "", unlocked: true },
    { id: 4, title: "Midnight Drive", artist: "Kavinsky", price: 0.10, cover: "", unlocked: false },
    { id: 5, title: "Ether Dreams", artist: "Odesza", price: 0.04, cover: "", unlocked: false },
    { id: 6, title: "Crypto Lofi", artist: "Chillhop", price: 0.01, cover: "/image3.png", unlocked: false },
];

const UserMarketplace = () => {
    const navigate = useNavigate();
    const { currentAccount, logout } = useContext(WalletContext);
    
    // State
    const [songs, setSongs] = useState(ALL_SONGS);
    const [playingSong, setPlayingSong] = useState(null);
    const [userBalance, setUserBalance] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedSong, setSelectedSong] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchBalance = async () => {
            if (window.ethereum && currentAccount) {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const balanceWei = await provider.getBalance(currentAccount);
                    const balanceEth = ethers.formatEther(balanceWei);
                    setUserBalance(parseFloat(balanceEth).toFixed(4));
                } catch (err) { console.error(err); }
            }
        };
        fetchBalance();
        
        document.body.style.backgroundImage = "url('/bg-listener.png')";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.backgroundPosition = "center";
        return () => { document.body.style.backgroundImage = ""; };
    }, [currentAccount]);

    const handlePlay = (song) => setPlayingSong(playingSong?.id === song.id ? null : song);

    const initiateBuy = (song) => {
        setSelectedSong(song);
        setShowConfirm(true);
    };

    const confirmPurchase = async () => {
        if(!selectedSong) return;
        setIsProcessing(true);
        setTimeout(() => {
            const updatedSongs = songs.map(s => s.id === selectedSong.id ? { ...s, unlocked: true } : s);
            setSongs(updatedSongs);
            setIsProcessing(false);
            setShowConfirm(false);
            setSelectedSong(null);
            alert(`Success! You unlocked ${selectedSong.title}`);
        }, 2000);
    };

    const formatAddress = (addr) => addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "User";

    return (
        <div className="page-content" style={{ paddingTop: '40px', paddingBottom: '120px' }}>
            <style>
                {`
                    /* TECH CARD */
                    .tech-card {
                        background: rgba(10, 15, 30, 0.6);
                        backdrop-filter: blur(12px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 15px;
                        transition: all 0.3s ease;
                        overflow: hidden;
                    }
                    .tech-card:hover {
                        border-color: rgba(255, 255, 255, 0.3);
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                        transform: translateY(-5px);
                    }

                    /* CUSTOM SLIDE BUTTON - FIXED */
                    .btn-custom {
                        background: transparent !important;
                        /* Use CSS Variable for color source */
                        color: var(--btn-color) !important;
                        border: 1px solid var(--btn-color) !important;
                        position: relative;
                        z-index: 1;
                        overflow: hidden;
                        transition: all 0.3s ease;
                    }
                    
                    /* The Sliding Background */
                    .btn-custom::before {
                        content: "";
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        /* Fix: Background uses variable, so it doesn't turn black when text does */
                        background: var(--btn-color); 
                        z-index: -1;
                        transform: translateX(-100%);
                        transition: transform 0.3s ease;
                    }
                    
                    /* Hover State */
                    .btn-custom:hover::before {
                        transform: translateX(0);
                    }
                    
                    /* Text turns black on hover for contrast */
                    .btn-custom:hover {
                        color: #000 !important; 
                        box-shadow: 0 0 15px var(--btn-color);
                    }

                    /* Bootstrap Override */
                    .btn-custom:focus, .btn-custom:active {
                        background: transparent !important;
                        border-color: var(--btn-color) !important;
                        box-shadow: none !important;
                    }
                    /* Keep black text if active AND hovered */
                    .btn-custom:hover:active {
                        color: #000 !important;
                    }

                    /* Balance Reveal */
                    .balance-container { cursor: pointer; }
                    .balance-hidden { display: inline-block; }
                    .balance-reveal { display: none; color: #00ffff; font-weight: bold; }
                    .balance-container:hover .balance-hidden { display: none; }
                    .balance-container:hover .balance-reveal { display: inline-block; }
                `}
            </style>

            <Container>
                {/* HEADER */}
                <Row className="align-items-center mb-5">
                    <Col>
                        <h4 className="text-white-50 mb-1" style={{ letterSpacing: '2px', fontSize: '0.8rem' }}>MARKETPLACE</h4>
                        <h1 className="fw-bold text-white mb-0">Welcome, {formatAddress(currentAccount)}</h1>
                        <div className="mt-2 balance-container text-white-50 small font-monospace">
                            Balance: 
                            <span className="ms-2 balance-hidden">**** ETH</span>
                            <span className="ms-2 balance-reveal">{userBalance || "Loading..."} ETH</span>
                        </div>
                    </Col>
                    <Col className="text-end">
                        <Button variant="outline-light" size="sm" className="rounded-pill px-4" onClick={logout}>
                            <FiLogOut className="me-2" /> Logout
                        </Button>
                    </Col>
                </Row>

                {/* MY LIBRARY */}
                <div className="mb-5">
                    <h4 className="text-white mb-4 d-flex align-items-center"><FiMusic className="me-2 text-info"/> Your Library</h4>
                    <Row className="g-4">
                        {songs.filter(s => s.unlocked).map((song) => (
                            <Col key={song.id} lg={3} md={4} sm={6}>
                                <div className="tech-card p-3 h-100">
                                    <div className="position-relative mb-3">
                                        <img 
                                            src={song.cover || DEFAULT_COVER} 
                                            alt={song.title} 
                                            className="w-100 rounded-3" 
                                            style={{ aspectRatio: '1/1', objectFit: 'cover' }} 
                                        />
                                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-3" 
                                             style={{ background: 'rgba(0,0,0,0.5)', opacity: playingSong?.id === song.id ? 1 : 0, transition: '0.3s' }}>
                                            <div className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center" style={{width:'50px', height:'50px'}}>
                                                {playingSong?.id === song.id ? <FiPause /> : <FiPlay className="ms-1" />}
                                            </div>
                                        </div>
                                    </div>
                                    <h5 className="fw-bold text-white mb-1 text-truncate">{song.title}</h5>
                                    <p className="text-white-50 small mb-3">{song.artist}</p>
                                    
                                    {/* CSS Variable Used Here */}
                                    <Button 
                                        className="w-100 btn-custom rounded-pill fw-bold"
                                        onClick={() => handlePlay(song)}
                                        style={{ '--btn-color': '#0dcaf0' }} 
                                    >
                                        {playingSong?.id === song.id ? "PAUSE" : "PLAY NOW"}
                                    </Button>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* MARKETPLACE */}
                <div>
                    <h4 className="text-white mb-4 d-flex align-items-center"><FiShoppingBag className="me-2 text-warning"/> Discover</h4>
                    <Row className="g-4">
                        {songs.filter(s => !s.unlocked).map((song) => (
                            <Col key={song.id} lg={3} md={4} sm={6}>
                                <div className="tech-card p-3 h-100 position-relative">
                                    <div className="position-absolute top-0 end-0 p-2 z-2">
                                        <div className="bg-black rounded-circle d-flex align-items-center justify-content-center border border-secondary" style={{width:'30px', height:'30px'}}>
                                            <FiLock size={12} className="text-white-50"/>
                                        </div>
                                    </div>

                                    <img 
                                        src={song.cover || DEFAULT_COVER} 
                                        alt={song.title} 
                                        className="w-100 rounded-3 mb-3" 
                                        style={{ aspectRatio: '1/1', objectFit: 'cover', filter: 'grayscale(80%) brightness(0.7)' }} 
                                    />
                                    
                                    <h5 className="fw-bold text-white mb-1 text-truncate">{song.title}</h5>
                                    <p className="text-white-50 small mb-3">{song.artist}</p>
                                    
                                    <div className="d-flex justify-content-between align-items-center mb-3 px-2 py-1 border border-secondary border-opacity-25 rounded" style={{background:'rgba(0,0,0,0.3)'}}>
                                        <span className="text-white-50 small font-monospace">PRICE</span>
                                        <span className="text-warning fw-bold font-monospace">{song.price} ETH</span>
                                    </div>

                                    {/* CSS Variable Used Here */}
                                    <Button 
                                        className="w-100 btn-custom rounded-pill fw-bold"
                                        style={{ '--btn-color': '#ff00cc' }} 
                                        onClick={() => initiateBuy(song)}
                                    >
                                        UNLOCK TRACK
                                    </Button>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
            </Container>

            {/* CONFIRMATION MODAL */}
            <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered contentClassName="bg-dark border border-secondary text-white">
                <Modal.Body className="p-4 text-center">
                    <FiAlertCircle size={50} className="text-warning mb-3" />
                    <h3 className="fw-bold mb-2">Confirm Purchase</h3>
                    <p className="text-white-50 mb-4">
                        Unlock <span className="text-white fw-bold"> {selectedSong?.title} </span> 
                        for <span className="text-warning fw-bold">{selectedSong?.price} ETH</span>?
                    </p>
                    
                    <div className="d-flex justify-content-center gap-3">
                        <Button 
                            className="btn-custom px-4 py-2 fw-bold rounded-pill"
                            style={{ '--btn-color': '#ff4d4d', minWidth: '100px' }}
                            onClick={() => setShowConfirm(false)}
                            disabled={isProcessing}
                        >
                            <FiX className="me-2"/> NO
                        </Button>

                        <Button 
                            className="btn-custom px-4 py-2 fw-bold rounded-pill"
                            style={{ '--btn-color': '#00ff88', minWidth: '100px' }}
                            onClick={confirmPurchase}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Spinner size="sm"/> : <><FiCheck className="me-2"/> YES</>}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* BOTTOM PLAYER */}
            {playingSong && (
                <div className="fixed-bottom p-3" style={{ background: 'rgba(5, 5, 10, 0.95)', borderTop: '1px solid #00ffff' }}>
                    <Container>
                        <Row className="align-items-center">
                            <Col xs={2} md={1}>
                                <img src={playingSong.cover || DEFAULT_COVER} alt="art" className="rounded" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                            </Col>
                            <Col xs={6} md={3}>
                                <h6 className="text-white mb-0 text-truncate text-uppercase" style={{letterSpacing:'1px'}}>{playingSong.title}</h6>
                                <small className="text-info font-monospace">{playingSong.artist}</small>
                            </Col>
                            <Col xs={4} md={4} className="text-center">
                                <Button variant="link" className="text-white fs-4 p-0 mx-3"><FiPlay/></Button> 
                            </Col>
                            <Col md={4} className="d-none d-md-block text-end text-white-50 small font-monospace">
                                00:04 / 03:45
                            </Col>
                        </Row>
                    </Container>
                </div>
            )}
        </div>
    );
};

export default UserMarketplace;