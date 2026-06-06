import { ethers } from "ethers";

// ─── ABIs ─────────────────────────────────────────────────────────────────────
export const FUNDING_ABI = [
  "function registerProperty(string propertyId, address owner, uint256 fundingTarget, uint256 totalTokens) external",
  "function invest(string propertyId) external payable",
  "function withdrawFunds(string propertyId) external",
  "function distributeDividend(string propertyId) external payable",
  "function claimDividend(string propertyId) external",
  "function getInvestment(string propertyId, address investor) external view returns (uint256 amount, uint256 tokenAmount)",
  "function getClaimable(string propertyId, address investor) external view returns (uint256)",
  "function properties(string) external view returns (string,address,uint256,uint256,uint256,uint256,bool,bool,uint256)",
  "event InvestmentMade(string propertyId, address indexed investor, uint256 amount, uint256 tokensReceived)",
  "event FundsWithdrawn(string propertyId, address indexed owner, uint256 amount, uint256 fee)",
  "event DividendClaimed(string propertyId, address indexed investor, uint256 amount)",
];

export const RENT_ABI = [
  "function payRentWithETH(address payable ownerAddr, string rentalId) external payable",
  "function verifyPayment(string rentalId) external view returns (bool paid, uint256 amount, uint256 timestamp)",
];

// ─── Contract addresses dari .env ─────────────────────────────────────────────
export const FUNDING_ADDRESS = import.meta.env.VITE_FUNDING_CONTRACT_ADDRESS;
export const RENT_ADDRESS    = import.meta.env.VITE_RENT_CONTRACT_ADDRESS;

// ─── Get provider & signer ────────────────────────────────────────────────────
export const getProvider = () => {
  if (!window.ethereum) throw new Error("MetaMask tidak ditemukan");
  return new ethers.BrowserProvider(window.ethereum);
};

export const getSigner = async () => {
  const provider = getProvider();
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
};

// ─── Get contract instances ───────────────────────────────────────────────────
export const getFundingContract = async (withSigner = true) => {
  const signerOrProvider = withSigner ? await getSigner() : getProvider();
  return new ethers.Contract(FUNDING_ADDRESS, FUNDING_ABI, signerOrProvider);
};

export const getRentContract = async () => {
  const signer = await getSigner();
  return new ethers.Contract(RENT_ADDRESS, RENT_ABI, signer);
};

// ─── Switch ke Sepolia otomatis ───────────────────────────────────────────────
export const ensureSepolia = async () => {
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (chainId !== "0xaa36a7") {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }],
    });
  }
};