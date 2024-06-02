import React, { useEffect, useState } from "react";
import { init, useConnectWallet, useNotifications } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import transactionPreviewModule from "@web3-onboard/transaction-preview";
import { ethers } from "ethers";
import usersAbi from "./contracts/Users.json";
import config from "./contracts/config.json";

const infuraKey = process.env.VITE_INFURA_ID as string;
const apiKey = process.env.VITE_ONBOARD_API_KEY as string;

const injected = injectedModule();

const rpcUrl = `https://mainnet.infura.io/v3/${infuraKey}`;

const appMetadata = {
  name: "Web3 Wallet Connected",
  description: "You are now connected to Blockchain App",
  recommendedInjectedWallets: [
    { name: "MetaMask", url: "https://metamask.io" },
  ],
};

const transactionPreview = transactionPreviewModule({});

init({
  apiKey,
  appMetadata,
  wallets: [injected],
  theme: "dark",
  // transactionPreview,
  chains: [
    {
      id: "0x1",
      token: "ETH",
      label: "Ethereum Mainnet",
      rpcUrl,
    },
    {
      id: "0x7A69",
      token: "ETH",
      label: "Hardhat",
      rpcUrl: "http://127.0.0.1:8545/",
    },
  ],
  accountCenter: {
    desktop: {
      enabled: true,
      position: "bottomRight",
    },
    mobile: {
      enabled: true,
      position: "bottomRight",
    },
  },
});

const TestApp
: React.FC = () => {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [notification, customNotification] = useNotifications();
  const [userName, setUserName] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [contract, setContract] = useState<ethers.Contract>();

  const [loading, setLoading] = useState(false);

  const addUser = async () => {
    if (!wallet) return;
    setLoading(true);

    try {
      const ethersProvider = new ethers.BrowserProvider(wallet.provider, "any");
      const signer = await ethersProvider.getSigner();
      const network = await ethersProvider.getNetwork();
      const nonce = await signer.getNonce();
      const gasPrice = (await ethersProvider.getFeeData()).gasPrice;

      const contractAddress =
        config[network.chainId.toString() as keyof typeof config].address;

      const contract = new ethers.Contract(
        contractAddress,
        usersAbi.abi,
        signer
      );
      setContract(contract);

      const transaction = {
        to: contractAddress,
        data: contract.interface.encodeFunctionData("addUser", [
          "0x5D52cA7590424e3506BF2312Eb025275Df8",
          "xxxx",
        ]),
        nonce,
        gasPrice,
        // maxPriorityFeePerGas,
        value: ethers.parseEther("0"),
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
    } catch (error) {
      console.log(error);

      customNotification({
        eventCode: "error",
        type: "error",
        message: "Error adding user",
        autoDismiss: 5000,
      });
    }
  };

  const getUsers = async () => {
    if (!wallet) return;

    setLoading(true);
    try {
        const ethersProvider = new ethers.BrowserProvider(wallet.provider, "any");
        const signer = await ethersProvider.getSigner();
        const network = await ethersProvider.getNetwork();
        const contractAddress = config[network.chainId.toString() as keyof typeof config].address;

        const contract = new ethers.Contract(contractAddress, usersAbi.abi, signer);

        // Use callStatic to read the data from the contract
        const users = await contract.getUsers();

        console.log(users);

        // Update the state with the fetched users
        setUsers(users.map((user: any) => ({ addr: user[0], name: user[1] })));

        customNotification({
            eventCode: "success",
            type: "success",
            message: "Fetched users",
            autoDismiss: 5000,
        });

        setLoading(false);
    } catch (error) {
        console.log(error);

        customNotification({
            eventCode: "error",
            type: "error",
            message: "Error fetching users",
            autoDismiss: 5000,
        });
        
    }
    setLoading(false)
};



  // const handleUsers = (addr: Address, name: string) => {
  //   console.log(`User Added: ${addr} with name ${name}`);
  // };

  // useEffect(() => {
  //   if (!contract) return;

  //   contract.on("UserAdded", handleUsers);

  //   return () => {
  //     contract.off("UserAdded", handleUsers);
  //   };
  // }, [contract]);

  console.log(users);
  

  return (
    <div>
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
          <button onClick={getUsers}>Get Users</button>
          <div >
            <h3>Users:</h3>
            <ul style={{color:'white'}}>
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
    </div>
  );
};

export default TestApp
;
