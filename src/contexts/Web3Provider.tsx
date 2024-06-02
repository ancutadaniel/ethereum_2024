import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { init, useConnectWallet, useNotifications } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import { BigNumberish, JsonRpcSigner, ethers } from "ethers";
import usersAbi from "../contracts/Users.json";
import config from "../contracts/config.json";
import { Notification, WalletState } from "@web3-onboard/core";

type User = {
  addr: string;
  name: string;
};

type Web3ContextType = {
  wallet: WalletState | null;
  connecting: boolean;
  contract: ethers.Contract | null;
  address: string;
  users: User[];
  nonce: number;
  gasPrice: BigNumberish | null;
  signer: JsonRpcSigner | undefined;
  balance: BigInt | undefined;
  connect: () => Promise<WalletState[]>;
  disconnect: (wallet: any) => Promise<WalletState[]>;
  fetchUsers: () => Promise<void>;
  customNotification: (
    notification: Partial<
      Omit<Notification, "id" | "startTime" | "network" | "key">
    >
  ) => void;
};

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

init({
  apiKey,
  appMetadata,
  wallets: [injected],
  theme: "dark",
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

const Web3Context = createContext<Web3ContextType | null>(null);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [notification, customNotification] = useNotifications();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [address, setAddress] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [nonce, setNonce] = useState<number>(0);
  const [gasPrice, setGasPrice] = useState<BigNumberish | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>();
  const [balance, setBalance] = useState<bigint>();

  const fetchUsers = useCallback(async () => {
    if (!contract) return;

    try {
      const usersList = await contract.getUsers();
      setUsers(
        usersList.map((user: { addr: string; name: string }) => ({
          addr: user.addr,
          name: user.name,
        }))
      );
      customNotification({
        eventCode: "success",
        type: "success",
        message: "Fetched users",
        autoDismiss: 5000,
      });
    } catch (error) {
      customNotification({
        eventCode: "error",
        type: "error",
        message: "Error fetching users",
        autoDismiss: 5000,
      });
    }
  }, [contract, customNotification]);

  useEffect(() => {
    if (!wallet) return;

    const initContract = async () => {
      try {
        const ethersProvider = new ethers.BrowserProvider(
          wallet.provider,
          "any"
        );
        const signerInstance = await ethersProvider.getSigner();
        const gasPrice = (await ethersProvider.getFeeData()).gasPrice;
        const network = await ethersProvider.getNetwork();
        const contractAddress =
          config[network.chainId.toString() as keyof typeof config].address;
        const nonce = await signerInstance.getNonce();
        const balance = await ethersProvider.getBalance(signerInstance.address)

        const contractInstance = new ethers.Contract(
          contractAddress,
          usersAbi.abi,
          signerInstance
        );

        setNonce(nonce);
        setAddress(signerInstance.address);
        setContract(contractInstance);
        setGasPrice(gasPrice);
        setSigner(signerInstance);
        setBalance(balance);
        
      } catch (error) {
        customNotification({
          eventCode: "error",
          type: "error",
          message: "Error initializing contract",
          autoDismiss: 5000,
        });
      }
    };

    initContract();
  }, [wallet, customNotification]);

  useEffect(() => {
    if (!contract) return;
    fetchUsers();
  }, [contract, fetchUsers]);

  const value = useMemo(
    () => ({
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
      customNotification,
      fetchUsers,
    }),
    [
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
      customNotification,
      fetchUsers,
    ]
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};
