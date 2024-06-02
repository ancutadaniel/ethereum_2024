import React, { useEffect, useState, useCallback } from "react";
import { ethers, Eip1193Provider } from "ethers";

declare global {
  interface Window {
    ethereum: Eip1193Provider & {
      on?: (eventName: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (eventName: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

const MetamaskConnection: React.FC = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  /**
   * Connect to MetaMask and fetch the user's address and balance.
   */
  const connectMetamask = useCallback(async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const userBalance = await provider.getBalance(userAddress);

        setAddress(userAddress);
        setBalance(ethers.formatEther(userBalance));
      } catch (error) {
        console.error("User rejected the request");
      }
    } else {
      console.error("MetaMask is not installed");
    }
  }, []);

  /**
   * Disconnect from MetaMask by resetting the address and balance state.
   */
  const disconnectMetamask = useCallback(() => {
    setAddress(null);
    setBalance(null);
  }, []);

  /**
   * Handle changes to the user's MetaMask accounts.
   * @param accounts The new list of accounts.
   */
  const handleAccountsChanged = useCallback((accounts: unknown) => {
    const accountsArray = accounts as string[];
    if (accountsArray.length > 0) {
      connectMetamask();
    } else {
      disconnectMetamask();
    }
  }, [connectMetamask, disconnectMetamask]);

  /**
   * Set up and clean up event listeners for account changes.
   */
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      }
    };
  }, [handleAccountsChanged]);

  return (
    <div>
      <button onClick={connectMetamask}>Connect to MetaMask</button>
      <button onClick={disconnectMetamask}>Disconnect</button>
      {address && (
        <div>
          <p>Address: {address}</p>
          <p>Balance: {balance} ETH</p>
        </div>
      )}
    </div>
  );
};

export default MetamaskConnection;
