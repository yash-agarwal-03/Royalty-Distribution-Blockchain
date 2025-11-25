import React, { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, Button, Badge, Spinner } from 'react-bootstrap';
import { FiPlay, FiPause, FiLock, FiLogOut, FiSearch, FiMusic, FiShoppingBag } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';

// --- MOCK DATA (Mixed Locked & Unlocked) ---
const ALL_SONGS = [
    { id: 1, title: "Neon Nights", artist: "The Weeknd", price: 0.05, cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop", unlocked: true },
    { id: 2, title: "Cyber Punk", artist: "Daft Punk", price: 0.08, cover: "https://images.unsplash.com/photo-1621360841013-c768371e93cf?q=80&w=300&auto=format&fit=crop", unlocked: false },
    { id: 3, title: "Deep Focus", artist: "Hans Zimmer", price: 0.02, cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=300&auto=format&fit=crop", unlocked: true },
    { id: 4, title: "Midnight Drive", artist: "Kavinsky", price: 0.10, cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop", unlocked: false },
    { id: 5, title: "Ether Dreams", artist: "Odesza", price: 0.04, cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop", unlocked: false },
    { id: 6, title: "Crypto Lofi", artist: "Chillhop", price: 0.01, cover: "https://images.unsplash.com/photo-1514525253440-b393452e2729?q=80&w=300&auto=format&fit=crop", unlocked: false },
];

const UserMarketplace = () => {
    const navigate = useNavigate();
    
    // 1. Safe Context Access
    const context = useContext(WalletContext);
    const currentAccount = context ? context.currentAccount : "";
    const logout = context ? context.logout : () => navigate('/');

    // 2. Specific Background
    useEffect(() => {
        // A "Concert/Party" vibe image
        document.body.style.backgroundImage = "url('/image3.png')";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.backgroundPosition = "center";
        return () => { document.body.style.backgroundImage = ""; };
    }, []);

    // 3. State
    const [songs, setSongs] = useState(ALL_SONGS); // Local state to update unlocked status
    const [playingSong, setPlayingSong] = useState(null); // For the bottom player
    const [buyingId, setBuyingId] = useState(null); // Loading state for specific button

    // Format Wallet for Display
    const formatAddress = (addr) => addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "User";

    // --- ACTIONS ---

    const handlePlay = (song) => {
        if (playingSong?.id === song.id) {
            setPlayingSong(null); // Pause if already playing
        } else {
            setPlayingSong(song); // Play new song
        }
    };

    const handleBuy = (id, price) => {
        setBuyingId(id);
        // Simulate Blockchain Transaction
        setTimeout(() => {
            // Update local state to show song as unlocked
            const updatedSongs = songs.map(s => s.id === id ? { ...s, unlocked: true } : s);
            setSongs(updatedSongs);
            setBuyingId(null);
            alert(`Successfully bought song for ${price} ETH!`);
        }, 2000);
    };

    return (
        <div className="page-content" style={{ paddingTop: '40px', paddingBottom: '120px' }}>
            <style>
                {`
                    .song-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
                    .song-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
                    .play-btn { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                    .play-btn:hover { transform: scale(1.1); }
                `}
            </style>

            <Container>
                
                {/* --- HEADER --- */}
                <Row className="align-items-center mb-5">
                    <Col>
                        <h4 className="text-white-50 mb-1" style={{ letterSpacing: '1px', fontSize: '0.9rem' }}>MUSIC MARKETPLACE</h4>
                        <h1 className="fw-bold text-white">Welcome, {formatAddress(currentAccount)}</h1>
                    </Col>
                    <Col className="text-end">
                        <Button variant="outline-light" size="sm" className="rounded-pill px-4" onClick={logout}>
                            <FiLogOut className="me-2" /> Logout
                        </Button>
                    </Col>
                </Row>

                {/* --- SECTION 1: UNLOCKED (Your Library) --- */}
                <div className="mb-5">
                    <h4 className="text-white mb-4 d-flex align-items-center"><FiMusic className="me-2 text-info"/> Your Library</h4>
                    <Row className="g-4">
                        {songs.filter(s => s.unlocked).map((song) => (
                            <Col key={song.id} lg={3} md={4} sm={6}>
                                <div className="glass-card p-3 h-100 song-card" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <div className="position-relative mb-3">
                                        <img src={song.cover} alt={song.title} className="w-100 rounded-3" style={{ aspectRatio: '1/1', objectFit: 'cover' }} />
                                        {/* Play Overlay */}
                                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                                             style={{ background: 'rgba(0,0,0,0.3)', opacity: playingSong?.id === song.id ? 1 : 0, transition: '0.3s' }}>
                                            <div className="play-btn bg-info text-white">
                                                {playingSong?.id === song.id ? <FiPause fill="white" /> : <FiPlay fill="white" className="ms-1" />}
                                            </div>
                                        </div>
                                    </div>
                                    <h5 className="fw-bold text-white mb-1 text-truncate">{song.title}</h5>
                                    <p className="text-white-50 small mb-3">{song.artist}</p>
                                    <Button 
                                        variant={playingSong?.id === song.id ? "info" : "outline-light"} 
                                        className="w-100 rounded-pill fw-bold"
                                        onClick={() => handlePlay(song)}
                                    >
                                        {playingSong?.id === song.id ? "PAUSE" : "PLAY NOW"}
                                    </Button>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* --- SECTION 2: LOCKED (Discover) --- */}
                <div>
                    <h4 className="text-white mb-4 d-flex align-items-center"><FiShoppingBag className="me-2 text-warning"/> Discover & Unlock</h4>
                    <Row className="g-4">
                        {songs.filter(s => !s.unlocked).map((song) => (
                            <Col key={song.id} lg={3} md={4} sm={6}>
                                <div className="glass-card p-3 h-100 song-card position-relative overflow-hidden">
                                    {/* Lock Overlay */}
                                    <div className="position-absolute top-0 end-0 p-2">
                                        <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center" style={{width:'30px', height:'30px'}}>
                                            <FiLock size={14} className="text-white-50"/>
                                        </div>
                                    </div>

                                    <img src={song.cover} alt={song.title} className="w-100 rounded-3 mb-3" style={{ aspectRatio: '1/1', objectFit: 'cover', filter: 'grayscale(30%)' }} />
                                    
                                    <h5 className="fw-bold text-white mb-1 text-truncate">{song.title}</h5>
                                    <p className="text-white-50 small mb-3">{song.artist}</p>
                                    
                                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 rounded" style={{background: 'rgba(0,0,0,0.3)'}}>
                                        <span className="text-white-50 small">Price</span>
                                        <span className="text-warning fw-bold">{song.price} ETH</span>
                                    </div>

                                    <Button 
                                        variant="gradient" 
                                        className="w-100 rounded-pill fw-bold border-0"
                                        style={{ background: 'linear-gradient(45deg, #ff0055, #ff00cc)', color: 'white' }}
                                        onClick={() => handleBuy(song.id, song.price)}
                                        disabled={buyingId === song.id}
                                    >
                                        {buyingId === song.id ? <Spinner size="sm" animation="border"/> : "UNLOCK SONG"}
                                    </Button>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>

            </Container>

            {/* --- BOTTOM PLAYER (Sticky) --- */}
            {playingSong && (
                <div className="fixed-bottom p-3" style={{ background: 'rgba(10, 10, 20, 0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Container>
                        <Row className="align-items-center">
                            <Col xs={2} md={1}>
                                <img src={playingSong.cover} alt="art" className="rounded" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                            </Col>
                            <Col xs={6} md={3}>
                                <h6 className="text-white mb-0 text-truncate">{playingSong.title}</h6>
                                <small className="text-white-50">{playingSong.artist}</small>
                            </Col>
                            <Col xs={4} md={4} className="text-center">
                                <Button variant="link" className="text-white fs-4 p-0 mx-3"><FiPlay/></Button> {/* Mock Controls */}
                            </Col>
                            <Col md={4} className="d-none d-md-block text-end text-white-50 small">
                                Playing from local library
                            </Col>
                        </Row>
                    </Container>
                </div>
            )}

        </div>
    );
};

export default UserMarketplace;