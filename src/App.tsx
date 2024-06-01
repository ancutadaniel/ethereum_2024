import React, { useState, useCallback, useEffect } from "react";
import { useWeb3 } from "./contexts/Web3Provider";
import MetamaskConnection from "./MetamaskConnection";

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
    connect,
    disconnect,
    fetchUsers,
    customNotification,
  } = useWeb3();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleUsers = useCallback(() => {
    console.log("user evt trigger");
    
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!contract) return;

    contract.on("UserAdded", handleUsers);

    return () => {
      contract.off("UserAdded", handleUsers);
    };
  }, [contract, handleUsers]);

  const addUser = useCallback(async () => {
    if (!contract || !address || !signer) return;
    setLoading(true);
    try {
      const transaction = {
        to: contract.getAddress(),
        data: contract.interface.encodeFunctionData("addUser", [
          address,
          userName,
        ]),
        nonce,
        gasPrice,
        value: 0,
      };

      console.log(transaction);

      const tx = await signer.sendTransaction(transaction);

      await tx.wait();

      customNotification({
        eventCode: "success",
        type: "success",
        message: "User added successfully",
        autoDismiss: 5000,
      });
      setLoading(false);
    } catch (error: unknown) {
      handleError(error);
    }
  }, [contract, signer, userName, customNotification, handleError, address, nonce, gasPrice]);

  return (
    <div>
      <h2 style={{ color: "white" }}>{address}</h2>
      <button
        disabled={connecting}
        onClick={() => (wallet ? disconnect(wallet) : connect())}
      >
        {connecting ? "connecting" : wallet ? "disconnect" : "connect"}
      </button>
      {wallet && (
        <div>
          <input
            type="text"
            placeholder="Enter user name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button onClick={addUser}>Add User</button>
          <button onClick={fetchUsers}>Get Users</button>
          <div>
            <h3>Users:</h3>
            <ul style={{ color: "white" }}>
              {users.map((user, index) => (
                <li key={index}>
                  {user.addr} - {user.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {loading && <p style={{ color: "white" }}>Loading.....</p>}
      <MetamaskConnection />
    </div>
  );
};

export default App;
