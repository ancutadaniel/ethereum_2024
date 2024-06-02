import React, { useEffect, useState, useCallback, useRef } from "react";
import { useWeb3 } from "./contexts/Web3Provider";
import { BigNumberish, ethers } from "ethers";
import blockies from "ethereum-blockies";

const App: React.FC = () => {
  const {
    wallet,
    connecting,
    contract,
    address,
    users,
    nonce,
    gasPrice,
    signer,
    balance,
    connect,
    disconnect,
    fetchUsers,
    customNotification,
  } = useWeb3();

  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);

  const tooltipRef = useRef<HTMLSpanElement>(null);

  const isError = (error: unknown): error is Error => {
    return (error as Error).message !== undefined;
  };

  const handleError = useCallback(
    (error: unknown) => {
      if (isError(error)) {
        console.log(error);
        customNotification({
          eventCode: "error",
          type: "error",
          message: error.message,
          autoDismiss: 5000,
        });
      } else {
        console.error("Unknown error:", error);
      }
      setLoading(false);
    },
    [customNotification]
  );

  const handleUsersEvent = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!contract) return;
    contract.on("UserAdded", handleUsersEvent);
    return () => {
      contract.off("UserAdded", handleUsersEvent);
    };
  }, [contract, handleUsersEvent]);

  const addUser = useCallback(async () => {
    if (!contract || !address || !signer) return;
    setLoading(true);
    try {
      const transaction = {
        to: contract.target,
        data: contract.interface.encodeFunctionData("addUser", [
          address,
          userName,
        ]),
        nonce,
        gasPrice,
        value: ethers.parseEther("0"),
      };

      const tx = await signer.sendTransaction(transaction);
      await tx.wait();

      customNotification({
        eventCode: "success",
        type: "success",
        message: "User added successfully",
        autoDismiss: 5000,
      });
      setUserName("");
    } catch (error: unknown) {
      console.error("Error during addUser transaction:", error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [
    contract,
    signer,
    userName,
    address,
    nonce,
    gasPrice,
    handleError,
    customNotification,
    fetchUsers,
  ]);

  const handleUserNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUserName(e.target.value);
    },
    []
  );

  const handleConnectButtonClick = useCallback(() => {
    if (wallet) {
      disconnect(wallet);
    } else {
      connect();
    }
  }, [wallet, connect, disconnect]);

  const handleCopyAddress = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      if (tooltipRef.current) {
        tooltipRef.current.innerText = "Copied!";
        setTimeout(() => {
          if (tooltipRef.current) {
            tooltipRef.current.innerText = "Copy";
          }
        }, 2000);
      }
    }
  }, [address]);

  return (
    <div>
      {address && (
        <>
          <h2>
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src={blockies.create({ seed: address }).toDataURL()}
                alt="blockie"
                className="blockie"
              />
              <div className="tooltip" onClick={handleCopyAddress}>
                {address}
                <span className="tooltip-text" ref={tooltipRef}>
                  Copy
                </span>
              </div>
            </div>
          </h2>
          {balance && (
            <p>
              Balance:{" "}
              {ethers.formatUnits(balance as BigNumberish, "ether").slice(0, 6)}{" "}
              ETH
            </p>
          )}
        </>
      )}
      <button disabled={connecting} onClick={handleConnectButtonClick}>
        {connecting ? "Connecting..." : wallet ? "Disconnect" : "Connect"}
      </button>
      {wallet && (
        <div>
          <input
            type="text"
            placeholder="Enter user name"
            value={userName}
            onChange={handleUserNameChange}
          />
          <button onClick={addUser} disabled={loading}>
            {loading ? "Adding..." : "Add User"}
          </button>
          <button onClick={fetchUsers}>Get Users</button>
          <div>
            <h3>Users:</h3>
            <ul>
              {users.map((user, index) => (
                <li key={index}>
                  {user.addr} - {user.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {loading && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default App;
