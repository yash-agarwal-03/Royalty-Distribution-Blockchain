import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  // 1. CHECK SESSION ON LOAD
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedRole = localStorage.getItem('userRole');
        const storedWallet = localStorage.getItem('walletAddress');

        // Only restore session if MetaMask is ACTUALLY still connected/unlocked
        if (storedRole && storedRole !== 'Admin') {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    // If the stored wallet matches the active MetaMask wallet
                    if (accounts[0].toLowerCase() === storedWallet?.toLowerCase()) {
                        setUserRole(storedRole);
                        setCurrentAccount(accounts[0]);
                    } else {
                        // User switched accounts in MetaMask extension -> Logout to be safe
                        localStorage.clear();
                    }
                } else {
                    localStorage.clear(); // Locked or disconnected
                }
            }
        } else if (storedRole === 'Admin') {
            setUserRole('Admin');
        }
      } catch (error) {
        console.error(error);
        localStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    if(window.ethereum) {
        window.ethereum.on('accountsChanged', () => {
            // Security: If account changes in extension, force logout to prevent role mismatch
            window.location.href = "/";
            localStorage.clear();
        });
    }

    checkSession();
  }, []);

  // 2. CONNECT WALLET (Updated with Force Logic)
  const connectWallet = async (force = false) => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return null;
    }
    try {
      // THIS BLOCK FORCES THE POPUP
      if (force) {
        await window.ethereum.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }]
        });
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      
      setCurrentAccount(address);
      return address;
    } catch (error) {
      console.error("Connection rejected:", error);
      return null;
    }
  };

  const login = (role, address = null) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
    if(address) {
        setCurrentAccount(address);
        localStorage.setItem('walletAddress', address);
    }
  };

  const logout = () => {
    setUserRole(null);
    setCurrentAccount(null);
    localStorage.clear();
    window.location.href = "/"; 
  };

  return (
    <WalletContext.Provider value={{ currentAccount, userRole, connectWallet, login, logout, isLoading }}>
      {children}
    </WalletContext.Provider>
  );
};