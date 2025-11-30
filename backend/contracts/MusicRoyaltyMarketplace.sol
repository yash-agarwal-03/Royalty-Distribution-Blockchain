// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MusicRoyaltyMarketplace is Ownable, ReentrancyGuard {

    // --- A. Data Structures (The "Schema") ---
    struct Song {
        uint256 id;
        string title;
        string artistName;        // Display name (e.g., "The Weeknd")
        string ipfsMetadataCID;   // Points to JSON containing Audio & Cover URL
        address payable artistWallet;
        address payable producerWallet;
        uint256 artistSplit;      // Percentage (0-100)
        uint256 price;            // In Wei (18 decimals)
        bool isActive;            // Soft delete functionality
    }

    // --- B. State Variables (The "Database") ---
    
    // Stores the catalog by ID
    mapping(uint256 => Song) public songs;
    uint256 public songCount;

    // Marketplace Logic: User -> Song ID -> Owned?
    mapping(address => mapping(uint256 => bool)) public hasUnlocked;

    // Financial: Withdrawable Balance (Resets to 0 after withdrawal)
    mapping(address => uint256) public pendingWithdrawals;

    // Financial: Lifetime Earnings (Only goes up, for graphs)
    mapping(address => uint256) public lifetimeEarnings;

    // --- Events (Frontend Listeners) ---
    event SongRegistered(uint256 indexed songId, string title, string artistName, address indexed artistWallet);
    event SongBought(uint256 indexed songId, address indexed buyer, uint256 amount);
    event Withdrawn(address indexed payee, uint256 amount);

    // Constructor sets the deployer as the "Admin"
    constructor() Ownable(msg.sender) {}

    // --- C. Key Functions (The "API") ---

    // 1. registerSong (Admin Only)
    function registerSong(
        string memory _title,
        string memory _artistName,
        string memory _ipfsMetadataCID,
        address payable _artistWallet,
        address payable _producerWallet,
        uint256 _artistSplit,
        uint256 _price
    ) external onlyOwner {
        require(_artistSplit <= 100, "Split cannot exceed 100%");
        require(_artistWallet != address(0) && _producerWallet != address(0), "Invalid wallet addresses");

        // Mint new ID
        uint256 newSongId = songCount;

        songs[newSongId] = Song({
            id: newSongId,
            title: _title,
            artistName: _artistName,
            ipfsMetadataCID: _ipfsMetadataCID,
            artistWallet: _artistWallet,
            producerWallet: _producerWallet,
            artistSplit: _artistSplit,
            price: _price,
            isActive: true
        });

        emit SongRegistered(newSongId, _title, _artistName, _artistWallet);
        songCount++;
    }

    // 2. buySong (Public / Listener)
    // 2. buySong (Public / Listener) - HYBRID AUTO-PAY
    function buySong(uint256 _songId) external payable nonReentrant {
        require(_songId < songCount, "Song does not exist");
        Song storage song = songs[_songId];
        
        require(song.isActive, "Song is not active");
        require(msg.value >= song.price, "Insufficient ETH sent");
        require(!hasUnlocked[msg.sender][_songId], "You already own this song");

        // --- 1. Calculate Platform Fee (10%) ---
        uint256 platformFee = (msg.value * 5) / 100;
        uint256 remainder = msg.value - platformFee;

        // --- 2. Calculate Splits on the REMAINDER ---
        uint256 artistShare = (remainder * song.artistSplit) / 100;
        uint256 producerShare = remainder - artistShare;

        // --- 3. PAYMENTS ---
        
        // A. ADMIN: AUTOMATIC TRANSFER (Push)
        // We still track lifetime earnings for the graph, but we send the ETH now.
        lifetimeEarnings[owner()] += platformFee;
        
        (bool adminSuccess, ) = payable(owner()).call{value: platformFee}("");
        require(adminSuccess, "Admin transfer failed");

        // B. ARTIST & PRODUCER: ACCUMULATE (Pull)
        // They must withdraw later to save gas for the buyer
        pendingWithdrawals[song.artistWallet] += artistShare;
        lifetimeEarnings[song.artistWallet] += artistShare;

        pendingWithdrawals[song.producerWallet] += producerShare;
        lifetimeEarnings[song.producerWallet] += producerShare;

        // --- 4. Unlock Access ---
        hasUnlocked[msg.sender][_songId] = true;

        emit SongBought(_songId, msg.sender, msg.value);
    }

    // 3. withdrawRoyalties (Creators)
    function withdrawRoyalties() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        // Security: Update state BEFORE transfer (Checks-Effects-Interactions)
        pendingWithdrawals[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    // 4. getAllSongs (Marketplace View)
    // Since 'songs' is a mapping, we must loop to create an array for the Frontend
    function getAllSongs() external view returns (Song[] memory) {
        Song[] memory allSongs = new Song[](songCount);

        for (uint256 i = 0; i < songCount; i++) {
            allSongs[i] = songs[i];
        }

        return allSongs;
    }
    
    // Helper: Get Creator Stats (For Dashboard)
    function getDashboardStats(address _creator) external view returns (uint256 currentBalance, uint256 totalLifetime) {
        return (pendingWithdrawals[_creator], lifetimeEarnings[_creator]);
    }
}