import React, { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Badge } from 'react-bootstrap';
import { FiDollarSign, FiMusic, FiTrendingUp, FiLogOut, FiDownload, FiClock, FiEye, FiEyeOff } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext';
import useContract from '../hooks/useContract';

// Mock Graph Data (Since we don't have an indexer yet)
const CHART_DATA = [
    { name: 'Mon', eth: 0.01 }, { name: 'Tue', eth: 0.04 }, { name: 'Wed', eth: 0.02 },
    { name: 'Thu', eth: 0.08 }, { name: 'Fri', eth: 0.05 }, { name: 'Sat', eth: 0.12 }, { name: 'Sun', eth: 0.15 },
];

const ContributorDashboard = () => {
    const navigate = useNavigate();
    const { currentAccount, logout } = useContext(WalletContext);
    const contract = useContract();

    useEffect(() => {
        document.body.style.backgroundImage = "url('/bg-contributor.png')";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.backgroundPosition = "center";
        return () => { document.body.style.backgroundImage = ""; };
    }, []);

    const [loadingWithdraw, setLoadingWithdraw] = useState(false);
    const [balance, setBalance] = useState("0.0"); 
    const [lifetime, setLifetime] = useState("0.0"); 
    const [mySongs, setMySongs] = useState([]); 
    const [showWallet, setShowWallet] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (contract && currentAccount) {
                try {
                    // 1. Get Financials (REAL BLOCKCHAIN DATA)
                    const stats = await contract.getDashboardStats(currentAccount);
                    setBalance(ethers.formatEther(stats[0]));
                    setLifetime(ethers.formatEther(stats[1]));

                    // 2. Get Discography
                    const allSongs = await contract.getAllSongs();
                    const filtered = allSongs
                        .filter(s => 
                            s.artistWallet.toLowerCase() === currentAccount.toLowerCase() || 
                            s.producerWallet.toLowerCase() === currentAccount.toLowerCase()
                        )
                        .map(s => ({
                            id: s.id.toString(),
                            title: s.title,
                            role: s.artistWallet.toLowerCase() === currentAccount.toLowerCase() ? "Artist" : "Producer",
                            split: s.artistWallet.toLowerCase() === currentAccount.toLowerCase() ? s.artistSplit : (100 - Number(s.artistSplit)),
                            status: s.isActive ? "Active" : "Archived",
                            // NOTE: Plays are simulated because we don't have The Graph yet
                            plays: "Simulated", 
                            earnings: "See Lifetime Total" 
                        }));
                    
                    setMySongs(filtered);

                } catch (error) {
                    console.error("Error fetching dashboard data:", error);
                }
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [contract, currentAccount]);

    const handleWithdraw = async () => {
        if (!contract) return;
        setLoadingWithdraw(true);
        try {
            const tx = await contract.withdrawRoyalties();
            await tx.wait();
            alert(`Success! Funds transferred to your wallet.`);
            setBalance("0.0"); 
        } catch (error) {
            console.error("Withdraw failed:", error);
            alert("Withdraw failed: " + (error.reason || error.message || "Unknown error"));
        } finally {
            setLoadingWithdraw(false);
        }
    };

    const handleRevealWallet = () => {
        setShowWallet(true);
        setTimeout(() => setShowWallet(false), 5000);
    };

    const formatWallet = (addr) => {
        if (!addr) return "Not Connected";
        if (showWallet) return addr;
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <div className="page-content" style={{ paddingTop: '50px', paddingBottom: '80px' }}>
            <style>
                {`
                    .btn-glow-hover { transition: all 0.3s ease; }
                    .btn-glow-hover:hover { box-shadow: 0 0 20px rgba(78, 205, 196, 0.6); transform: translateY(-2px); }
                    .custom-scroll::-webkit-scrollbar { width: 6px; }
                    .custom-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
                    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
                `}
            </style>

            <Container>
                {/* Header */}
                <Row className="justify-content-between align-items-end mb-4">
                    <Col md={8}>
                        <h4 className="text-secondary mb-1" style={{ letterSpacing: '2px', fontSize: '0.8rem' }}>CREATOR PORTAL</h4>
                        <h1 className="fw-bold text-white display-5">Analytics & Revenue</h1>
                        
                        <div className="d-flex align-items-center mt-2">
                            <p className="text-white-50 mb-0 font-monospace small me-3">
                                Wallet: <span className="text-white">{formatWallet(currentAccount)}</span>
                            </p>
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                style={{padding: '2px 8px', fontSize: '0.7rem', borderColor: 'rgba(255,255,255,0.2)'}}
                                onClick={handleRevealWallet}
                                disabled={showWallet}
                            >
                                {showWallet ? <FiEye /> : <FiEyeOff />}
                            </Button>
                        </div>
                    </Col>
                    <Col md={4} className="text-md-end mt-3 mt-md-0">
                        <Button variant="outline-light" size="sm" className="rounded-pill px-4" onClick={logout}>
                            <FiLogOut className="me-2" /> Logout
                        </Button>
                    </Col>
                </Row>

                <Row className="g-4 mb-5">
                    {/* Left Col: Graph */}
                    <Col lg={8}>
                        <div className="glass-card p-4 h-100">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold text-white mb-0">Revenue Analytics</h5>
                                <Badge bg="dark" className="border border-secondary text-white-50 fw-normal">Simulated View</Badge>
                            </div>
                            <div style={{ width: '100%', height: '280px' }}>
                                <ResponsiveContainer>
                                    <AreaChart data={CHART_DATA}>
                                        <defs>
                                            <linearGradient id="colorEth" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ background: '#0a0a2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }} itemStyle={{ color: '#fff' }} />
                                        <Area type="monotone" dataKey="eth" stroke="#4ecdc4" strokeWidth={3} fillOpacity={1} fill="url(#colorEth)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Col>

                    {/* Right Col: Money Cards */}
                    <Col lg={4} className="d-flex flex-column gap-3">
                        {/* Lifetime */}
                        <div className="glass-card p-3 d-flex flex-column justify-content-center flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 className="text-white-50 mb-1">Lifetime Earnings</h6>
                                    <h2 className="fw-bold text-white mb-0">{parseFloat(lifetime).toFixed(4)} ETH</h2>
                                </div>
                                <div className="p-2 rounded-circle" style={{ background: 'rgba(255, 230, 109, 0.1)' }}>
                                    <FiTrendingUp size={20} color="#ffe66d" />
                                </div>
                            </div>
                            <div className="mt-2 text-success small"><FiTrendingUp /> Real-time Blockchain Data</div>
                        </div>

                        {/* Unpaid Balance */}
                        <div className="glass-card p-3 position-relative overflow-hidden flex-grow-1">
                            {parseFloat(balance) > 0 && <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: '#4ecdc4', filter: 'blur(50px)', opacity: 0.15 }}></div>}
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h6 className="text-white-50 mb-1">Unpaid Royalties</h6>
                                    <h2 className="fw-bold text-white mb-0">{parseFloat(balance).toFixed(4)} ETH</h2>
                                </div>
                                <div className="p-2 rounded-circle" style={{ background: parseFloat(balance) > 0 ? 'rgba(78, 205, 196, 0.1)' : 'rgba(255, 0, 85, 0.1)' }}>
                                    <FiDollarSign size={20} color={parseFloat(balance) > 0 ? "#4ecdc4" : "#ff0055"} />
                                </div>
                            </div>
                            <Button
                                className="w-100 py-2 fw-bold btn-glow-hover"
                                style={{ background: parseFloat(balance) > 0 ? '#4ecdc4' : '#333', border: 'none', color: parseFloat(balance) > 0 ? '#0b1437' : '#666', fontSize: '0.9rem' }}
                                onClick={handleWithdraw}
                                disabled={loadingWithdraw || parseFloat(balance) <= 0}
                            >
                                {loadingWithdraw ? 'Processing...' : parseFloat(balance) > 0 ? <><FiDownload className="me-2" /> WITHDRAW NOW</> : 'NO FUNDS AVAILABLE'}
                            </Button>
                        </div>
                    </Col>
                </Row>

                {/* Discography Table */}
                <Row>
                    <Col>
                        <h4 className="text-white mb-3 d-flex align-items-center">
                            <FiMusic className="me-2 text-secondary"/> 
                            My Discography: <span className="text-muted ms-2 fs-5">({mySongs.length} songs)</span>
                        </h4>
                        <div className="glass-card p-0 overflow-hidden">
                            <div className="custom-scroll" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                <Table hover variant="dark" className="mb-0 bg-transparent align-middle" style={{ '--bs-table-bg': 'transparent' }}>
                                    <thead className="text-white-50" style={{ position: 'sticky', top: 0, background: '#0a0a1a', zIndex: 10 }}>
                                        <tr>
                                            <th className="py-3 ps-4 border-0 font-monospace small">TRACK DETAILS</th>
                                            <th className="py-3 border-0 font-monospace small">ROLE / SPLIT</th>
                                            <th className="py-3 border-0 font-monospace small">PLAYS (EST)</th>
                                            <th className="py-3 pe-4 text-end border-0 font-monospace small">EARNINGS (EST)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mySongs.length > 0 ? (
                                            mySongs.map((song, index) => (
                                                <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td className="ps-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="rounded d-flex align-items-center justify-content-center me-3" style={{ width: '45px', height: '45px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                <FiMusic className="text-white-50" />
                                                            </div>
                                                            <div>
                                                                <div className="text-white fw-bold">{song.title}</div>
                                                                <div className="text-white-50 small d-flex align-items-center"><FiClock size={10} className="me-1"/> {song.status}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <Badge bg={song.role === 'Artist' ? 'primary' : 'warning'} className="text-dark fw-bold px-3">{song.role}</Badge>
                                                        <span className="text-white-50 ms-2 small">{song.split}% Share</span>
                                                    </td>
                                                    <td className="py-3 text-white-50"><span className="text-white-50 small">{song.plays}</span></td>
                                                    <td className="text-end pe-4 py-3"><span className="text-white-50 small">{song.earnings}</span></td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-5 text-white-50">
                                                    No songs found registered to this wallet address.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default ContributorDashboard;