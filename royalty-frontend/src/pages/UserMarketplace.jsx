import React, { useState, useContext, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Modal, Spinner } from 'react-bootstrap';
import { FiPlay, FiPause, FiLock, FiLogOut, FiMusic, FiShoppingBag, FiAlertCircle, FiCheck, FiX, FiDisc, FiSkipBack, FiSkipForward } from 'react-icons/fi';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext.jsx';
import useContract from '../hooks/useContract.js'; 

// Royalty-free sample for demo player functionality
const DEMO_AUDIO = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 

const UserMarketplace = () => {
    const { currentAccount, logout } = useContext(WalletContext);
    const contract = useContract(); 
    
    const [songs, setSongs] = useState([]);
    const [playingSong, setPlayingSong] = useState(null);
    const [userBalance, setUserBalance] = useState(null);
    const [isLoadingSongs, setIsLoadingSongs] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedSong, setSelectedSong] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- PLAYER STATE ---
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Audio Player Ref
    const audioRef = useRef(new Audio(DEMO_AUDIO));

    useEffect(() => {
        const initData = async () => {
            if (window.ethereum && currentAccount) {
                // 1. Fetch Balance
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const balanceWei = await provider.getBalance(currentAccount);
                    const balanceEth = ethers.formatEther(balanceWei);
                    setUserBalance(parseFloat(balanceEth).toFixed(4));
                } catch (err) { console.error("Balance fetch failed", err); }

                // 2. Fetch Real Songs from Contract
                if (contract) {
                    try {
                        const rawSongs = await contract.getAllSongs();
                        
                        // Map Blockchain Data to UI
                        const formattedSongs = await Promise.all(rawSongs.map(async (song) => {
                            const isUnlocked = await contract.hasUnlocked(currentAccount, song.id);
                            
                            // LOGIC: Use IPFS if real, otherwise null (triggers Placeholder Icon)
                            let coverImage = null;
                            if (song.ipfsMetadataCID && song.ipfsMetadataCID.length > 5 && !song.ipfsMetadataCID.startsWith("QmTest")) {
                                coverImage = null; // Defaulting to placeholder as requested
                            }

                            return {
                                id: song.id,
                                title: song.title,
                                artist: song.artistName,
                                price: ethers.formatEther(song.price),
                                cover: coverImage, 
                                unlocked: isUnlocked
                            };
                        }));
                        setSongs(formattedSongs);
                    } catch (error) {
                        console.error("Failed to fetch songs:", error);
                    } finally {
                        setIsLoadingSongs(false);
                    }
                }
            }
        };

        initData();
        
        document.body.style.backgroundImage = "url('/bg-listener.png')";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.backgroundPosition = "center";
        return () => { document.body.style.backgroundImage = ""; };
    }, [currentAccount, contract]);

    // --- AUDIO EVENT LISTENERS ---
    useEffect(() => {
        const audio = audioRef.current;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setPlayingSong(null);

        // Add listeners
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            // Cleanup listeners
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    // --- PLAY/PAUSE LOGIC ---
    useEffect(() => {
        if (playingSong) {
            audioRef.current.play().catch(e => console.error("Audio Play Error:", e));
        } else {
            audioRef.current.pause();
        }
    }, [playingSong]);

    const handlePlay = (song) => {
        if (playingSong?.id === song.id) {
            setPlayingSong(null); // Pause
        } else {
            setPlayingSong(song); // Play
        }
    };

    // --- SEEK LOGIC (Scrubbing) ---
    const handleSeek = (e) => {
        const newTime = parseFloat(e.target.value);
        // Immediate jump
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const initiateBuy = (song) => {
        setSelectedSong(song);
        setShowConfirm(true);
    };

    const confirmPurchase = async () => {
        if(!selectedSong || !contract) return;
        setIsProcessing(true);
        
        try {
            const priceInWei = ethers.parseEther(selectedSong.price);
            const tx = await contract.buySong(selectedSong.id, { value: priceInWei });
            await tx.wait();

            const updatedSongs = songs.map(s => s.id === selectedSong.id ? { ...s, unlocked: true } : s);
            setSongs(updatedSongs);
            
            alert(`Success! You unlocked ${selectedSong.title}`);
            setShowConfirm(false);
            setSelectedSong(null);

        } catch (error) {
            console.error("Purchase failed:", error);
            alert("Transaction Failed: " + (error.reason || error.message));
        } finally {
            setIsProcessing(false);
        }
    };

    const formatAddress = (addr) => addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "User";

    // --- HELPER: Placeholder Component ---
    const AlbumPlaceholder = () => (
        <div className="w-100 rounded-3 mb-3 d-flex align-items-center justify-content-center" 
             style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <FiDisc size={60} className="text-white-50" style={{ opacity: 0.5 }} />
        </div>
    );

    return (
        <div className="page-content" style={{ paddingTop: '40px', paddingBottom: '140px' }}>
             <style>
                {`
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
                    /* BUTTON SLIDE ANIMATION */
                    .btn-custom {
                        background: transparent !important;
                        color: var(--btn-color) !important;
                        border: 1px solid var(--btn-color) !important;
                        position: relative;
                        z-index: 1;
                        overflow: hidden;
                        transition: all 0.3s ease;
                    }
                    .btn-custom::before {
                        content: "";
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: var(--btn-color); 
                        z-index: -1;
                        transform: translateX(-100%);
                        transition: transform 0.3s ease;
                    }
                    .btn-custom:hover::before {
                        transform: translateX(0);
                    }
                    .btn-custom:hover {
                        color: #000 !important; 
                        box-shadow: 0 0 15px var(--btn-color);
                    }

                    /* PLAYER RANGE SLIDER */
                    input[type=range] {
                        -webkit-appearance: none;
                        width: 100%;
                        background: transparent;
                        cursor: pointer;
                        height: 20px; /* Increased height for easier clicking */
                    }
                    input[type=range]:focus {
                        outline: none;
                    }
                    input[type=range]::-webkit-slider-runnable-track {
                        width: 100%;
                        height: 4px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 2px;
                        cursor: pointer;
                    }
                    input[type=range]::-webkit-slider-thumb {
                        height: 14px;
                        width: 14px;
                        border-radius: 50%;
                        background: #00ffff;
                        -webkit-appearance: none;
                        margin-top: -5px; /* Centers thumb on track */
                        transition: transform 0.1s;
                        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
                    }
                    input[type=range]:hover::-webkit-slider-thumb {
                        transform: scale(1.3);
                    }
                    .player-bar {
                        background: rgba(10, 15, 25, 0.95);
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(20px);
                    }
                `}
            </style>

            <Container>
                <Row className="align-items-center mb-5">
                    <Col>
                        <h4 className="text-white-50 mb-1" style={{ letterSpacing: '2px', fontSize: '0.8rem' }}>MARKETPLACE</h4>
                        <h1 className="fw-bold text-white mb-0">Welcome, {formatAddress(currentAccount)}</h1>
                        <div className="mt-2 text-white-50 small font-monospace">
                            Balance: <span className="text-info fw-bold">{userBalance || "Loading..."} ETH</span>
                        </div>
                    </Col>
                    <Col className="text-end">
                        <Button variant="outline-light" size="sm" className="rounded-pill px-4" onClick={logout}>
                            <FiLogOut className="me-2" /> Logout
                        </Button>
                    </Col>
                </Row>

                {isLoadingSongs ? (
                    <div className="text-center text-white-50 py-5">
                        <Spinner animation="border" variant="info" />
                        <p className="mt-3">Loading Songs from Blockchain...</p>
                    </div>
                ) : (
                    <>
                        {/* UNLOCKED LIBRARY */}
                        <div className="mb-5">
                            <h4 className="text-white mb-4 d-flex align-items-center"><FiMusic className="me-2 text-info"/> Your Library</h4>
                            <Row className="g-4">
                                {songs.filter(s => s.unlocked).length > 0 ? (
                                    songs.filter(s => s.unlocked).map((song) => (
                                        <Col key={song.id} lg={3} md={4} sm={6}>
                                            <div className="tech-card p-3 h-100">
                                                <div className="position-relative mb-3">
                                                    {song.cover ? (
                                                        <img 
                                                            src={song.cover} 
                                                            alt={song.title} 
                                                            className="w-100 rounded-3" 
                                                            style={{ aspectRatio: '1/1', objectFit: 'cover' }} 
                                                        />
                                                    ) : (
                                                        <AlbumPlaceholder />
                                                    )}
                                                    
                                                    {/* Play Overlay */}
                                                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-3" 
                                                         style={{ background: 'rgba(0,0,0,0.5)', opacity: playingSong?.id === song.id ? 1 : 0, transition: '0.3s' }}>
                                                        <div className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center" style={{width:'50px', height:'50px'}}>
                                                            {playingSong?.id === song.id ? <FiPause /> : <FiPlay className="ms-1" />}
                                                        </div>
                                                    </div>
                                                </div>
                                                <h5 className="fw-bold text-white mb-1 text-truncate">{song.title}</h5>
                                                <p className="text-white-50 small mb-3">{song.artist}</p>
                                                <Button 
                                                    className="w-100 btn-custom rounded-pill fw-bold"
                                                    style={{ '--btn-color': '#0dcaf0' }} 
                                                    onClick={() => handlePlay(song)}
                                                >
                                                    {playingSong?.id === song.id ? "PAUSE" : "PLAY NOW"}
                                                </Button>
                                            </div>
                                        </Col>
                                    ))
                                ) : (
                                    <Col><p className="text-white-50">You haven't purchased any songs yet.</p></Col>
                                )}
                            </Row>
                        </div>

                        {/* DISCOVER MARKETPLACE */}
                        <div>
                            <h4 className="text-white mb-4 d-flex align-items-center"><FiShoppingBag className="me-2 text-warning"/> Discover</h4>
                            <Row className="g-4">
                                {songs.filter(s => !s.unlocked).length > 0 ? (
                                    songs.filter(s => !s.unlocked).map((song) => (
                                        <Col key={song.id} lg={3} md={4} sm={6}>
                                            <div className="tech-card p-3 h-100 position-relative">
                                                <div className="position-absolute top-0 end-0 p-2 z-2">
                                                    <div className="bg-black rounded-circle d-flex align-items-center justify-content-center border border-secondary" style={{width:'30px', height:'30px'}}>
                                                        <FiLock size={12} className="text-white-50"/>
                                                    </div>
                                                </div>
                                                
                                                {song.cover ? (
                                                    <img 
                                                        src={song.cover} 
                                                        alt={song.title} 
                                                        className="w-100 rounded-3 mb-3" 
                                                        style={{ aspectRatio: '1/1', objectFit: 'cover', filter: 'grayscale(80%) brightness(0.7)' }} 
                                                    />
                                                ) : (
                                                    <AlbumPlaceholder />
                                                )}

                                                <h5 className="fw-bold text-white mb-1 text-truncate">{song.title}</h5>
                                                <p className="text-white-50 small mb-3">{song.artist}</p>
                                                <div className="d-flex justify-content-between align-items-center mb-3 px-2 py-1 border border-secondary border-opacity-25 rounded" style={{background:'rgba(0,0,0,0.3)'}}>
                                                    <span className="text-white-50 small font-monospace">PRICE</span>
                                                    <span className="text-warning fw-bold font-monospace">{song.price} ETH</span>
                                                </div>
                                                <Button 
                                                    className="w-100 btn-custom rounded-pill fw-bold"
                                                    style={{ '--btn-color': '#ff00cc' }} 
                                                    onClick={() => initiateBuy(song)}
                                                >
                                                    UNLOCK TRACK
                                                </Button>
                                            </div>
                                        </Col>
                                    ))
                                ) : (
                                    <Col><p className="text-white-50">No new songs available to buy.</p></Col>
                                )}
                            </Row>
                        </div>
                    </>
                )}
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

            {/* BOTTOM MUSIC PLAYER BAR */}
            {playingSong && (
                <div className="fixed-bottom player-bar py-3 px-4">
                    <Container fluid>
                        <Row className="align-items-center">
                            {/* 1. LEFT: Image & Info */}
                            <Col xs={4} md={3} className="d-flex align-items-center">
                                {playingSong.cover ? (
                                    <img src={playingSong.cover} alt="art" className="rounded shadow-sm" style={{ width: '56px', height: '56px', objectFit: 'cover' }} />
                                ) : (
                                    <div className="rounded d-flex align-items-center justify-content-center bg-dark border border-secondary" style={{ width: '56px', height: '56px' }}>
                                        <FiDisc className="text-white-50" size={24} />
                                    </div>
                                )}
                                <div className="ms-3 overflow-hidden">
                                    <h6 className="text-white mb-0 text-truncate fw-bold">{playingSong.title}</h6>
                                    <small className="text-white-50 font-monospace">{playingSong.artist}</small>
                                </div>
                            </Col>

                            {/* 2. CENTER: Controls */}
                            <Col xs={4} md={6}>
                                <div className="d-flex flex-column align-items-center">
                                    <div className="d-flex align-items-center gap-4 mb-2">
                                        <FiSkipBack size={20} className="text-secondary" style={{ cursor: 'pointer' }} />
                                        <div 
                                            className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-lg" 
                                            style={{ width: '40px', height: '40px', cursor: 'pointer' }}
                                            onClick={() => handlePlay(playingSong)}
                                        >
                                            {playingSong ? <FiPause fill="black" size={16} /> : <FiPlay fill="black" className="ms-1" size={16} />}
                                        </div>
                                        <FiSkipForward size={20} className="text-secondary" style={{ cursor: 'pointer' }} />
                                    </div>
                                    
                                    {/* Seek Bar + Time Display */}
                                    <div className="w-100 d-flex align-items-center gap-3">
                                        <small className="text-white-50 font-monospace" style={{ fontSize: '10px', minWidth: '35px', textAlign: 'right' }}>
                                            {formatTime(currentTime)}
                                        </small>
                                        <div className="flex-grow-1 position-relative d-flex align-items-center">
                                            <input 
                                                type="range" 
                                                min={0} 
                                                max={duration || 0} 
                                                value={currentTime} 
                                                onChange={handleSeek}
                                            />
                                        </div>
                                        <small className="text-white-50 font-monospace" style={{ fontSize: '10px', minWidth: '35px' }}>
                                            {formatTime(duration)}
                                        </small>
                                    </div>
                                </div>
                            </Col>

                            {/* 3. RIGHT: Empty or Extra Actions */}
                            <Col xs={4} md={3} className="text-end d-none d-md-block">
                                <Button variant="link" className="text-white-50 p-0"><FiMusic/></Button>
                            </Col>
                        </Row>
                    </Container>
                </div>
            )}
        </div>
    );
};

export default UserMarketplace;