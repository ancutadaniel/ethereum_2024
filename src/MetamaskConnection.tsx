import React, { useEffect, useState } from "react";
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

  const connectMetamask = async () => {
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
  };

  const disconnectMetamask = () => {
    setAddress(null);
    setBalance(null);
  };

  const handleAccountsChanged = (accounts: unknown) => {
    const accountsArray = accounts as string[];
    if (accountsArray.length > 0) {
      connectMetamask();
    } else {
      disconnectMetamask();
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

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
