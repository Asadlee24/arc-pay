"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import { ethers } from "ethers";
import { 
  Shield, 
  Code, 
  Layers, 
  ExternalLink, 
  Check, 
  Copy, 
  Lock, 
  Zap, 
  Globe, 
  Terminal,
  CreditCard,
  Cpu,
  ChevronRight
} from "lucide-react";
// Dynamic import for WalletConnect

// USDC is the native gas token on Arc Network
const USDC_DECIMALS = 18;

const ARC_CONFIG = {
  chainId: "0x4cef52", // Correct hex for 5042002
  chainIdDecimal: 5042002,
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  blockExplorer: "https://testnet.arcscan.app/",
  usdcAddress: "0x3600000000000000000000000000000000000000"
};

const projectId = '86650422204c35e39669528f4477c77c'; 

const arcChain = {
  chainId: 5042002,
  name: 'Arc Testnet',
  currency: 'USDC',
  explorerUrl: 'https://testnet.arcscan.app',
  rpcUrl: 'https://rpc.testnet.arc.network'
};

const metadata = {
  name: 'Arc Pay',
  description: 'Arc Pay Merchant Dashboard',
  url: 'https://arcpay-gamma.vercel.app',
  icons: ['https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg']
};

const modalRef = { current: null };

function Card({ title, children, icon: Icon, className = "" }) {
  return (
    <div className={`arcade-card ${className}`} style={{ padding: "28px" }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          {Icon && <Icon size={18} color="var(--neon-cyan)" />}
          <h3 style={{ fontSize: 11, fontWeight: 800, color: "rgba(0, 242, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

function SocialBtn({ href, icon }) {
  return (
    <a 
      href={href} 
      className="social-link" 
      target="_blank"
      rel="noopener noreferrer"
    >
      {icon}
    </a>
  );
}

function PrimaryBtn({ children, onClick, disabled, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="neon-border-glow"
      style={{
        padding: "14px 28px",
        borderRadius: "14px",
        background: "var(--neon-cyan)",
        color: "black",
        border: "none",
        fontSize: "14px",
        fontWeight: "900",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.2s ease",
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}

function SecondaryBtn({ onClick, children }) {
  return (
    <button 
      onClick={onClick} 
      style={{ 
        padding: "14px 24px", borderRadius: 14, 
        background: "rgba(255,255,255,0.04)", 
        border: "1px solid rgba(255,255,255,0.08)", 
        color: "rgba(232,244,253,0.6)", 
        fontSize: "13px", fontWeight: "700", 
        cursor: "pointer", fontFamily: "inherit", 
        transition: "all 0.2s ease" 
      }}
    >
      {children}
    </button>
  );
}

// ── Icons & Branding ────────────────────────────────────────────────────────
function ArcLogo({ size = 22, className = "" }) {
  return (
    <svg 
      width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}
    >
      <path d="M20 5L35 32H5L20 5Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M12 25H28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="20" cy="18" r="4" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("about"); // about | dashboard | preview | snippet
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [modalPhase, setModalPhase] = useState("idle"); // idle | loading | success | error
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [activeProvider, setActiveProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  // Helper to get provider by type
  const getInjectedProvider = (type) => {
    if (type === "metamask") return window.ethereum;
    if (type === "okx") return window.okxwallet;
    if (type === "coinbase") return window.coinbaseWalletExtension;
    return window.ethereum;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const init = async () => {
      // Find a provider with accounts
      const providers = [
        { p: window.ethereum, name: "ethereum" },
        { p: window.okxwallet, name: "okx" },
        { p: window.coinbaseWalletExtension, name: "coinbase" }
      ].filter(x => x.p);

      for (const { p } of providers) {
        try {
          const accs = await p.request({ method: "eth_accounts" });
          if (accs.length > 0) {
            setAccount(accs[0]);
            setActiveProvider(p);
            const cid = await p.request({ method: "eth_chainId" });
            const id = typeof cid === 'string' && cid.startsWith('0x') ? parseInt(cid, 16) : parseInt(cid);
            setChainId(id);
            break;
          }
        } catch (e) {}
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!activeProvider) return;

    const handleChainChanged = (cid) => {
      const id = typeof cid === 'string' && cid.startsWith('0x') ? parseInt(cid, 16) : parseInt(cid);
      setChainId(id);
    };
    
    const handleAccountsChanged = (accounts) => {
      setAccount(accounts[0] || null);
    };

    activeProvider.on("chainChanged", handleChainChanged);
    activeProvider.on("accountsChanged", handleAccountsChanged);
    
    return () => {
      activeProvider.removeListener("chainChanged", handleChainChanged);
      activeProvider.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [activeProvider]);

  const isLocked = !account || chainId !== ARC_CONFIG.chainIdDecimal;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Address copied to clipboard!");
  };

  const [form, setForm] = useState({
    businessName: "Acme Store",
    email: "merchant@acme.com",
    publicKey: "0x4427e7f84908285fba94193709c985849a785b05",
    webhookUrl: "",
  });

  const [config, setConfig] = useState({
    merchantId: "acme_merchant",
    publicKey: "0x4427e7f84908285fba94193709c985849a785b05",
    amount: "49.99",
    orderId: "order_001",
    successUrl: "https://acme.com/success",
    cancelUrl: "https://acme.com/cancel",
    label: "Pay with USDC",
  });

  const snippet = `<!-- Arc Pay Widget -->
<div id="arc-pay-btn"
     data-merchant-id="${config.merchantId}"
     data-public-key="${config.publicKey}"
     data-amount="${config.amount}"
     data-order-id="${config.orderId}"
     data-success-url="${config.successUrl}"
     data-cancel-url="${config.cancelUrl}"
     data-label="${config.label}">
</div>
<script src="https://arcpay-gamma.vercel.app/widget.js" async></script>`;

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function connectWallet(providerType = "metamask") {
    let injectedProvider = window.ethereum;

    if (providerType === "okx") {
      injectedProvider = window.okxwallet;
    } else if (providerType === "coinbase") {
      injectedProvider = window.coinbaseWalletExtension || window.ethereum;
    }

    if (!injectedProvider) {
      alert(`Please install ${providerType} wallet!`);
      return;
    }

    setIsConnecting(true);
    try {
      // Force account selection popup
      await injectedProvider.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
      
      const provider = new ethers.providers.Web3Provider(injectedProvider);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      
      const network = await provider.getNetwork();
      setChainId(network.chainId); // MANUALLY UPDATE CHAIN ID STATE
      
      if (network.chainId !== ARC_CONFIG.chainIdDecimal) {
        await switchNetwork(injectedProvider);
        // Re-check after switch
        const updatedNetwork = await provider.getNetwork();
        setChainId(updatedNetwork.chainId);
      }
      setShowWalletModal(false);
    } catch (err) {
      console.error(err);
      alert("Connection failed: " + err.message);
    } finally {
      setIsConnecting(false);
    }
  }

  async function connectViaWalletConnect() {
    try {
      setShowWalletModal(false);
      console.log("Initializing WalletConnect...");
      const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
      
      const provider = await EthereumProvider.init({
        projectId: 'f56d02863772227d825c93547f89647b', // Public testing ID
        showQrModal: true,
        chains: [1], // Mainnet is often required as a base
        optionalChains: [5042002],
        rpcMap: {
          5042002: 'https://rpc.testnet.arc.network'
        },
        metadata: {
          name: 'Arc Pay',
          description: 'Arc Pay Merchant Dashboard',
          url: window.location.origin,
          icons: ['https://avatars.githubusercontent.com/u/18060234?s=280&v=4']
        }
      });

      console.log("WalletConnect Provider Initialized");

      provider.on("display_uri", (uri) => {
        console.log("QR Code URI:", uri);
      });

      await provider.connect();
      setActiveProvider(provider);
      
      const accounts = await provider.request({ method: 'eth_accounts' });
      setAccount(accounts[0]);
      const cid = await provider.request({ method: 'eth_chainId' });
      setChainId(parseInt(cid, 16) || parseInt(cid));
    } catch (err) {
      console.error("WalletConnect Error:", err);
      if (err.message && !err.message.includes("User closed modal")) {
        alert("WalletConnect Error: " + err.message);
      }
    }
  }

  function disconnectWallet() {
    setAccount(null);
    // Note: We can't force MetaMask to disconnect, but we clear our app state
  }

  async function switchNetwork(injectedProvider = window.ethereum) {
    if (!injectedProvider) return;
    
    const hexChainId = ARC_CONFIG.chainId;
    
    try {
      console.log("Attempting to switch to:", hexChainId);
      await injectedProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (err) {
      console.error("Switch error:", err);
      // This error code means the chain has not been added to MetaMask/OKX.
      if (err.code === 4902 || (err.data && err.data.originalError && err.data.originalError.code === 4902)) {
        try {
          console.log("Adding network...");
          await injectedProvider.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: hexChainId,
              chainName: ARC_CONFIG.chainName,
              nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
              rpcUrls: [ARC_CONFIG.rpcUrl],
              blockExplorerUrls: [ARC_CONFIG.blockExplorer],
            }],
          });
        } catch (addError) {
          console.error("Add network error:", addError);
          alert("Could not add Arc Network. Please add it manually in your wallet.");
        }
      } else {
        alert("Failed to switch network. Please switch to Arc Testnet manually.");
      }
    }
  }

  async function handleModalConfirm() {
    if (!account) {
      await connectWallet();
      return;
    }

    setModalPhase("loading");
    setTxHash(null);
    setError(null);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const network = await provider.getNetwork();
      if (network.chainId !== ARC_CONFIG.chainIdDecimal) {
        await switchNetwork();
      }

      // Native USDC transfer
      const amountUnits = ethers.utils.parseUnits(config.amount, USDC_DECIMALS);
      
      const tx = await signer.sendTransaction({
        to: config.publicKey,
        value: amountUnits
      });
      
      setTxHash(tx.hash);
      
      await tx.wait();
      setModalPhase("success");
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || "Payment failed");
      setModalPhase("idle");
      alert("Error: " + (err.reason || err.message || "Payment failed"));
    }
  }

  return (
    <>
      {/* Bubbly Background */}
      <div className="bubbles-container">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      </div>

      {/* Wrong Network Banner */}
      {account && chainId !== ARC_CONFIG.chainIdDecimal && (
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "#ff0080",
          color: "#fff",
          textAlign: "center",
          padding: "10px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 15
        }}>
          <span>
            ⚠️ PLEASE SWITCH TO ARC TESTNET TO CONTINUE (ID: {chainId || "detecting..."})
          </span>
          <button 
            onClick={() => switchNetwork(activeProvider)}
            style={{
              background: "white",
              color: "#ff0080",
              border: "none",
              padding: "5px 15px",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            SWITCH NETWORK
          </button>
        </div>
      )}

      {/* Top Nav */}
      <header style={{
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        padding: "16px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        position: "sticky",
        top: account && chainId !== ARC_CONFIG.chainIdDecimal ? 45 : 0,
        zIndex: 50,
        background: "rgba(10, 15, 29, 0.95)",
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ArcLogo size={28} className="neon-text" />
          <span className="neon-text" style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>Arc Pay</span>
        </div>

        <nav style={{ 
          display: "flex", 
          gap: 8, 
          flexWrap: "wrap", 
          alignItems: "center",
          justifyContent: "center"
        }}>
          {[
            { id: "about",     label: "ABOUT" },
            { id: "dashboard", label: "PORTAL" },
            { id: "preview",   label: "PREVIEW" },
            { id: "snippet",   label: "EMBED" },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              border: tab === id ? "1px solid var(--neon-cyan)" : "1px solid transparent",
              background: tab === id ? "rgba(0, 242, 255, 0.1)" : "transparent",
              color: tab === id ? "var(--neon-cyan)" : "rgba(232,244,253,0.4)",
              transition: "all 0.2s",
              letterSpacing: "0.1em"
            }}>
              {label}
            </button>
          ))}
          
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={account ? disconnectWallet : () => setShowWalletModal(true)} disabled={isConnecting} style={{
              padding: "10px 20px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              background: account ? "rgba(239,68,68,0.1)" : "var(--neon-cyan)",
              border: account ? "1px solid #ef4444" : "none",
              color: account ? "#ef4444" : "#000",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              transition: "all 0.3s",
              minWidth: "140px"
            }}>
              {isConnecting ? "LINKING..." : account ? `LOGOUT: ${shortAddr(account)}` : "CONNECT WALLET"}
            </button>
            {account && (
              <button 
                onClick={() => copyToClipboard(account)}
                title="Copy Address"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "var(--neon-cyan)",
                  padding: "8px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <i className='bx bx-copy' style={{ fontSize: 18 }}></i>
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "40px 24px 80px",
      }}>
      
        {/* ── About Creator Tab ── */}
        {tab === "about" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 30, alignItems: "center", width: "100%" }}>
            <div className="arcade-card" style={{ width: "100%", padding: 0, overflow: "hidden" }}>
              <div style={{ 
                display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", width: "100%", 
                background: "linear-gradient(160deg, #0d1526 0%, #0f1c3a 100%)", padding: "40px 20px",
                textAlign: "center"
              }}>
                <div style={{ flex: "1 1 100%", maxWidth: "100%", order: 2 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <Zap size={16} color="var(--neon-pink)" fill="var(--neon-pink)" fillOpacity={0.2} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--neon-pink)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Creator Portal</span>
                    </div>
                    <h1 className="neon-text" style={{ fontSize: 48, fontWeight: 900, margin: "0 0 10px", letterSpacing: "-0.04em", lineHeight: 1 }}>Asad Lee</h1>
                    <p style={{ fontSize: 18, color: "var(--neon-cyan)", margin: "0 0 24px", fontWeight: 700, letterSpacing: "-0.01em" }}>Full-Stack Web Architect & Security Researcher</p>
                    <p style={{ fontSize: 15, color: "rgba(232,244,253,0.7)", lineHeight: 1.7, margin: "0 0 32px" }}>
                      Bridging the gap between Arc Network's high-speed infrastructure and the global merchant economy. 
                      Crafting zero-code payment solutions that feel like magic.
                    </p>
                    
                    <div className="hero-socials">
                        <SocialBtn href="https://asad-lee-portfolio.vercel.app/" icon={<Globe size={18} />} />
                        <SocialBtn href="https://www.linkedin.com/in/asad-ali-3355273ba" icon={<i className='bx bxl-linkedin'></i>} />
                        <SocialBtn href="https://x.com/asadleo416?s=21" icon={<i className='bx bxl-twitter'></i>} />
                        <SocialBtn href="https://www.instagram.com/asadlee24" icon={<i className='bx bxl-instagram'></i>} />
                        <SocialBtn href="https://facebook.com/share/189Ce1Shco/" icon={<i className='bx bxl-facebook'></i>} />
                    </div>
                  </div>
                </div>

                <div className="hero-image-wrap" style={{ order: 1, marginBottom: "30px" }}>
                    <img 
                      src="https://i.ibb.co/G3fvMHZY/IMG-4886.jpg" 
                      alt="Asad Lee" 
                      className="hero-img" 
                    />
                    <div 
                      className="stat-card stat-card-1"
                    >
                        <span style={{ fontSize: 10, color: "rgba(0, 242, 255, 0.6)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Live Systems</span>
                        <span style={{ fontSize: 28, fontWeight: 900, color: "white", lineHeight: 1 }}>15<span style={{ color: "var(--neon-pink)" }}>+</span></span>
                    </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, width: "100%" }}>
              <Card title="The Vision" icon={Globe}>
                <p style={{ fontSize: 14, color: "rgba(232,244,253,0.7)", margin: 0, lineHeight: 1.7 }}>
                  Arc Network is the future of commerce. We build the layer that lets everyday businesses harness 
                  USDC without needing a blockchain degree.
                </p>
              </Card>
              <Card title="Technology" icon={Cpu}>
                <p style={{ fontSize: 14, color: "rgba(232,244,253,0.7)", margin: 0, lineHeight: 1.7 }}>
                  Optimized for Arc Testnet 5042002. Powered by Circle's Programmable Wallets and sub-second 
                  deterministic finality.
                </p>
              </Card>
              <Card title="Security" icon={Shield}>
                <p style={{ fontSize: 14, color: "rgba(232,244,253,0.7)", margin: 0, lineHeight: 1.7 }}>
                  Non-custodial by design. Your keys never leave your system. Every transaction is 
                  auditable on ArcScan.
                </p>
              </Card>
            </div>
            
            <PrimaryBtn onClick={() => setTab("dashboard")} icon={ExternalLink}>Explore Merchant Dashboard</PrimaryBtn>
          </div>
        )}

        {/* ── Dashboard Tab ── */}
        {tab === "dashboard" && (
          <div style={{ position: "relative" }}>
            {isLocked && (
              <div style={{
                position: "absolute", inset: "-20px", zIndex: 10,
                background: "rgba(6, 12, 26, 0.7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 24, border: "1px solid rgba(0, 242, 255, 0.2)"
              }}>
                <div className="arcade-card" style={{ padding: "30px", textAlign: "center", maxWidth: 300 }}>
                  <i className='bx bx-lock-alt' style={{ fontSize: 40, color: "var(--neon-cyan)", marginBottom: 15 }}></i>
                  <h3 style={{ margin: "0 0 10px", color: "white" }}>INTERFACE LOCKED</h3>
                  <p style={{ fontSize: 12, color: "rgba(232,244,253,0.5)", marginBottom: 20 }}>Please connect your wallet to Arc Testnet to access the portal.</p>
                  <PrimaryBtn onClick={connectWallet}>CONNECT SYSTEM</PrimaryBtn>
                </div>
              </div>
            )}
            <div style={{ marginBottom: 32, opacity: isLocked ? 0.3 : 1 }}>
              <h1 className="neon-text" style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 10px" }}>
                MERCHANT PORTAL
              </h1>
              <p style={{ fontSize: 14, color: "rgba(0, 242, 255, 0.5)", margin: 0, fontWeight: 600 }}>
                REGISTER · CONFIGURE · DEPLOY — ZERO CODE REQUIRED
              </p>
            </div>

            <StepProgress step={step} />

            <div style={{ marginTop: 24, opacity: isLocked ? 0.3 : 1 }}>
              {step === 1 && (
                <Card title="register your merchant account">
                  <Field label="business name" value={form.businessName} onChange={v => setForm(f => ({ ...f, businessName: v }))} placeholder="Acme Store" />
                  <Field label="email address" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="you@store.com" />
                  <Field label="Arc wallet address — USDC goes here" value={form.publicKey} onChange={v => { setForm(f => ({ ...f, publicKey: v })); setConfig(c => ({ ...c, publicKey: v })); }} placeholder="0x..." mono />
                  <Field label="webhook URL (optional)" value={form.webhookUrl} onChange={v => setForm(f => ({ ...f, webhookUrl: v }))} placeholder="https://yoursite.com/api/arc-hook" />
                  <InfoBox>your wallet address is your public payment destination on Arc Network — we never custody your funds</InfoBox>
                  <PrimaryBtn onClick={() => setStep(2)}>continue →</PrimaryBtn>
                </Card>
              )}

              {step === 2 && (
                <Card title="configure your payment button">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field label="amount (USDC)" value={config.amount} onChange={v => setConfig(c => ({ ...c, amount: v }))} placeholder="49.99" />
                    <Field label="order ID" value={config.orderId} onChange={v => setConfig(c => ({ ...c, orderId: v }))} placeholder="order_001" />
                  </div>
                  <Field label="button label" value={config.label} onChange={v => setConfig(c => ({ ...c, label: v }))} placeholder="Pay with USDC" />
                  <Field label="success redirect URL" value={config.successUrl} onChange={v => setConfig(c => ({ ...c, successUrl: v }))} placeholder="https://yoursite.com/success" />
                  <Field label="cancel redirect URL" value={config.cancelUrl} onChange={v => setConfig(c => ({ ...c, cancelUrl: v }))} placeholder="https://yoursite.com/cancel" />

                  <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px", background: "rgba(255,255,255,0.015)", marginTop: 4 }}>
                    <p style={{ fontSize: 10, color: "rgba(232,244,253,0.25)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, marginTop: 0 }}>live preview</p>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <ArcPayButton config={config} onClick={() => { setShowModal(true); setModalPhase("idle"); }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <SecondaryBtn onClick={() => setStep(1)}>← back</SecondaryBtn>
                    <PrimaryBtn onClick={() => setStep(3)}>generate snippet →</PrimaryBtn>
                  </div>
                </Card>
              )}

              {step === 3 && (
                <Card title="your embed snippet is ready">
                  <SuccessBadge />
                  <CodeBlock snippet={snippet} copied={copied} onCopy={handleCopy} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 4 }}>
                    <PlatformPill icon="🛍️" name="Shopify" hint="Custom Liquid" />
                    <PlatformPill icon="🔷" name="WordPress" hint="Custom HTML block" />
                    <PlatformPill icon="⚡" name="Any HTML" hint="paste in body" />
                  </div>
                  <InfoBox>
                    set amount dynamically:&nbsp;
                    <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 11 }}>
                      document.getElementById('arc-pay-btn').dataset.amount = cartTotal
                    </code>
                  </InfoBox>
                  <SecondaryBtn onClick={() => setStep(2)}>← edit config</SecondaryBtn>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ── Widget Preview Tab ── */}
        {tab === "preview" && (
          <div style={{ position: "relative" }}>
            {isLocked && (
              <div style={{
                position: "absolute", inset: "-20px", zIndex: 10,
                background: "rgba(6, 12, 26, 0.7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 24, border: "1px solid rgba(0, 242, 255, 0.2)"
              }}>
                <div className="arcade-card" style={{ padding: "30px", textAlign: "center", maxWidth: 300 }}>
                  <i className='bx bx-lock-alt' style={{ fontSize: 40, color: "var(--neon-cyan)", marginBottom: 15 }}></i>
                  <h3 style={{ margin: "0 0 10px", color: "white" }}>PREVIEW LOCKED</h3>
                  <p style={{ fontSize: 12, color: "rgba(232,244,253,0.5)", marginBottom: 20 }}>Link your system to Arc Testnet to test the payment widget.</p>
                  <PrimaryBtn onClick={connectWallet}>INITIALIZE LINK</PrimaryBtn>
                </div>
              </div>
            )}
            <div style={{ marginBottom: 28, opacity: isLocked ? 0.3 : 1 }}>
              <h1 className="neon-text" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 6px" }}>WIDGET DEMO</h1>
              <p style={{ fontSize: 13, color: "rgba(0, 242, 255, 0.5)", margin: 0, fontWeight: 600 }}>INTERACT WITH THE PAY BUTTON TO SIMULATE THE FLOW</p>
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, overflow: "hidden" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.6 }} />)}
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "rgba(232,244,253,0.25)", marginLeft: 8 }}>
                  acme-store.com/product/premium-plan
                </div>
              </div>

              <div style={{ padding: "40px 36px", background: "linear-gradient(180deg, #0d1a30 0%, #0a1225 100%)" }}>
                <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ width: 160, height: 160, borderRadius: 14, background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 48 }}>📦</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 250 }}>
                    <p style={{ fontSize: 11, color: "rgba(99,179,237,0.6)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>premium plan</p>
                    <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Arc Business Suite</h2>
                    <p style={{ fontSize: 13, color: "rgba(232,244,253,0.4)", margin: "0 0 20px", lineHeight: 1.6 }}>
                      full access to all features · unlimited team members · priority support · monthly billing
                    </p>
                    <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 24px" }}>
                      ${config.amount}<span style={{ fontSize: 15, color: "rgba(232,244,253,0.4)", fontWeight: 400 }}> USDC</span>
                    </div>

                    <ArcPayButton config={config} onClick={() => { setShowModal(true); setModalPhase("idle"); }} />

                    <p style={{ fontSize: 11, color: "rgba(232,244,253,0.2)", marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
                      <Shield size={12} /> powered by Arc Network · USDC · Circle
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <InfoBox style={{ marginTop: 16 }}>
              this is how the button looks embedded in a merchant site — the widget injects itself via the script tag and requires zero framework dependencies
            </InfoBox>
          </div>
        )}

        {/* ── Snippet Tab ── */}
        {tab === "snippet" && (
          <div style={{ position: "relative" }}>
            {isLocked && (
              <div style={{
                position: "absolute", inset: "-20px", zIndex: 10,
                background: "rgba(6, 12, 26, 0.7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 24, border: "1px solid rgba(0, 242, 255, 0.2)"
              }}>
                <div className="arcade-card" style={{ padding: "30px", textAlign: "center", maxWidth: 300 }}>
                  <i className='bx bx-lock-alt' style={{ fontSize: 40, color: "var(--neon-cyan)", marginBottom: 15 }}></i>
                  <h3 style={{ margin: "0 0 10px", color: "white" }}>ENCRYPTION LOCKED</h3>
                  <p style={{ fontSize: 12, color: "rgba(232,244,253,0.5)", marginBottom: 20 }}>Establish a secure Arc Testnet connection to generate your snippet.</p>
                  <PrimaryBtn onClick={connectWallet}>SECURE CONNECTION</PrimaryBtn>
                </div>
              </div>
            )}
            <div style={{ marginBottom: 28, opacity: isLocked ? 0.3 : 1 }}>
              <h1 className="neon-text" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 6px" }}>EMBED SNIPPET</h1>
              <p style={{ fontSize: 13, color: "rgba(0, 242, 255, 0.5)", margin: 0, fontWeight: 600 }}>ONE SCRIPT TAG · UNIVERSAL COMPATIBILITY</p>
            </div>

            <Card title="">
              <CodeBlock snippet={snippet} copied={copied} onCopy={handleCopy} />

              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(232,244,253,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 0 }}>platform instructions</p>
                <div style={{ display: "grid", gap: 10 }}>
                  <PlatformCard icon="🛍️" name="Shopify" steps={["go to Online Store → Themes → Edit code", "open the product or cart template", "paste the snippet where you want the button", "save — no app required"]} />
                  <PlatformCard icon="🔷" name="WordPress" steps={["edit your page in Gutenberg or Classic editor", "add a Custom HTML block", "paste the snippet inside", "publish — works with any theme"]} />
                  <PlatformCard icon="⚡" name="Custom HTML" steps={["paste the snippet in your HTML body", "script loads async — zero performance impact", "set data-amount and data-order-id dynamically via JS"]} />
                </div>
              </div>
            </Card>

            <div style={{ marginTop: 20 }}>
              <Card title="how it works">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0, alignItems: "center" }}>
                  {[
                    { icon: "🏪", label: "merchant site", sub: "Shopify · WP · HTML" },
                    null,
                    { icon: "⚙️", label: "Arc Pay backend", sub: "Next.js API route" },
                    null,
                    { icon: "🔵", label: "Arc Network", sub: "USDC settlement" },
                  ].map((item, i) =>
                    item ? (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(232,244,253,0.7)", margin: "0 0 2px" }}>{item.label}</p>
                        <p style={{ fontSize: 10, color: "rgba(232,244,253,0.25)", margin: 0 }}>{item.sub}</p>
                      </div>
                    ) : (
                      <div key={i} style={{ textAlign: "center", color: "rgba(99,179,237,0.4)", fontSize: 18 }}>→</div>
                    )
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0, marginTop: 16 }}>
                  {[
                    "widget script injected",
                    null,
                    "POST /api/create-checkout",
                    null,
                    "USDC transfer on-chain",
                  ].map((t, i) =>
                    t ? (
                      <p key={i} style={{ fontSize: 10, color: "rgba(232,244,253,0.2)", textAlign: "center", margin: 0 }}>{t}</p>
                    ) : <div key={i} />
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        padding: "40px 24px",
        textAlign: "center",
        marginTop: "auto",
        background: "rgba(10, 15, 29, 0.5)"
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 15 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ArcLogo size={20} className="neon-text" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--neon-cyan)", letterSpacing: "0.1em" }}>ARC PAY v1.0</span>
          </div>
          <p style={{ fontSize: 14, color: "rgba(232, 244, 253, 0.4)", margin: 0 }}>
            Built with ❤️ by <a href="https://asad-lee-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--neon-cyan)", textDecoration: "none", fontWeight: 700 }}>Asad Lee</a>
          </p>
          <div style={{ display: "flex", gap: 20, opacity: 0.5 }}>
            <Shield size={14} />
            <Zap size={14} />
            <Cpu size={14} />
          </div>
          <p style={{ fontSize: 11, color: "rgba(232, 244, 253, 0.2)", letterSpacing: "0.05em" }}>
            © 2026 ARC PAY PROTOCOL | ALL SYSTEMS OPERATIONAL
          </p>
        </div>
      </footer>

      {/* ── Wallet Selector Modal ── */}
      {showWalletModal && (
        <div 
          onClick={() => setShowWalletModal(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(5, 8, 20, 0.95)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="arcade-card" 
            style={{ maxWidth: 400, width: "100%", padding: 32, textAlign: "center" }}
          >
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10, letterSpacing: "-0.03em" }}>Connect Wallet</h2>
            <p style={{ fontSize: 13, color: "rgba(232, 244, 253, 0.4)", marginBottom: 30 }}>Select your preferred wallet to access Arc Pay</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <WalletOption 
                name="OKX Wallet" 
                icon="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUilLVKrILOqwy_HV2bcf1nuIZkqrvf9p0vQ&s"
                onClick={() => connectWallet("okx")}
              />
              <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />
              <WalletOption 
                name="WalletConnect" 
                icon="https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg"
                onClick={connectViaWalletConnect}
              />
            </div>

            <button 
              onClick={() => setShowWalletModal(false)}
              style={{ marginTop: 25, background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget && modalPhase !== "loading") setShowModal(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(5,8,20,0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div style={{
            background: "#141b2d",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 22,
            padding: 32,
            maxWidth: 380,
            width: "100%",
            boxShadow: "0 30px 70px rgba(0,0,0,0.7)",
            position: "relative",
          }}>
            {modalPhase !== "success" && (
              <button
                onClick={() => { if (modalPhase !== "loading") setShowModal(false); }}
                style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(232,244,253,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}
              >✕</button>
            )}

            {modalPhase !== "success" ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
                  <ArcLogo size={22} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(99,179,237,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Arc Pay</span>
                </div>

                <h2 style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 3px" }}>complete your payment</h2>
                <p style={{ fontSize: 12, color: "rgba(232,244,253,0.35)", margin: "0 0 22px" }}>secured by Arc Network · settled in USDC</p>

                <div style={{ background: "rgba(99,179,237,0.06)", border: "1px solid rgba(99,179,237,0.12)", borderRadius: 14, padding: "20px", marginBottom: 18, textAlign: "center" }}>
                  <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1 }}>
                    ${parseFloat(config.amount || 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(99,179,237,0.65)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 7 }}>
                    USDC · stable · instant
                  </div>
                </div>

                {[
                  ["order id", config.orderId],
                  ["recipient", shortAddr(config.publicKey)],
                  ["network", "Arc Testnet"],
                  ["estimated gas", "~$0.001 USDC"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                    <span style={{ color: "rgba(232,244,253,0.35)" }}>{k}</span>
                    <span style={{ fontWeight: 600, fontFamily: k === "recipient" ? "monospace" : undefined, fontSize: k === "recipient" ? 11 : 12, background: k === "recipient" ? "rgba(255,255,255,0.04)" : "transparent", padding: k === "recipient" ? "2px 7px" : 0, borderRadius: k === "recipient" ? 5 : 0 }}>{v}</span>
                  </div>
                ))}

                <button
                  onClick={handleModalConfirm}
                  disabled={modalPhase === "loading"}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: "14px", marginTop: 20, borderRadius: 12,
                    background: "var(--neon-cyan)",
                    border: "none", color: "#000", fontSize: 14, fontWeight: 600, cursor: "pointer",
                    opacity: modalPhase === "loading" ? 0.8 : 1,
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}
                >
                  {modalPhase === "loading" ? (
                    <>
                      <div style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      <span>processing payment...</span>
                    </>
                  ) : (
                    <><ArcLogo size={18} /><span>confirm on-chain payment</span></>
                  )}
                </button>

                <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12, fontSize: 11, color: "rgba(232,244,253,0.2)" }}>
                  <ShieldIcon /> 256-bit encrypted · non-custodial · powered by Circle
                </p>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#22c55e" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 8px" }}>payment confirmed</h2>
                <p style={{ fontSize: 13, color: "rgba(232,244,253,0.4)", margin: "0 0 12px" }}>
                  ${parseFloat(config.amount).toFixed(2)} USDC sent to merchant
                </p>
                {txHash && (
                  <a href={`${ARC_CONFIG.blockExplorer}tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#63b3ed", fontFamily: "monospace", textDecoration: "none", display: "inline-block", background: "rgba(99,179,237,0.08)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(99,179,237,0.15)" }}>
                    tx: {shortAddr(txHash)} · View on Explorer ↗
                  </a>
                )}
                <p style={{ fontSize: 10, color: "rgba(34,197,94,0.6)", marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  Verified on Arc Testnet
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ArcPayButton({ config, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "14px 28px", borderRadius: 14,
        background: "#0f1629",
        border: "1px solid var(--neon-cyan)",
        color: "#e8f4fd", fontSize: 13, fontWeight: 800, cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "inherit",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <ArcLogo size={20} />
      <span>{config.label || "PAY WITH USDC"}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(0, 242, 255, 0.12)", border: "1px solid rgba(0, 242, 255, 0.2)", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 800, color: "var(--neon-cyan)" }}>
        ${parseFloat(config.amount || 0).toFixed(2)} USDC
      </span>
    </button>
  );
}

function WalletOption({ name, icon, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 15,
        padding: "16px 20px", borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "white", fontSize: 15, fontWeight: 700,
        cursor: "pointer", transition: "all 0.2s",
        textAlign: "left"
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(0, 242, 255, 0.05)"; e.currentTarget.style.borderColor = "var(--neon-cyan)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      <img src={icon} alt={name} style={{ width: 28, height: 28, borderRadius: 6 }} />
      <span style={{ flex: 1 }}>{name}</span>
      <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
    </button>
  );
}

function StepProgress({ step }) {
  const steps = [{ n: 1, label: "register" }, { n: 2, label: "configure" }, { n: 3, label: "snippet" }];
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: 6, 
      marginBottom: 20,
      overflowX: "auto",
      paddingBottom: "10px",
      scrollbarWidth: "none"
    }}>
      {steps.map(({ n, label }, i) => (
        <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "6px 12px", borderRadius: 9, fontSize: 12, fontWeight: 600,
            border: step === n ? "1px solid rgba(99,179,237,0.35)" : "1px solid rgba(255,255,255,0.05)",
            background: step === n ? "rgba(99,179,237,0.08)" : "rgba(255,255,255,0.02)",
            color: step === n ? "#63b3ed" : step > n ? "rgba(232,244,253,0.3)" : "rgba(232,244,253,0.2)",
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700,
              background: step > n ? "#22c55e" : step === n ? "#1a56db" : "rgba(255,255,255,0.08)",
              color: step >= n ? "#fff" : "rgba(232,244,253,0.3)",
            }}>
              {step > n ? <Check size={10} /> : n}
            </div>
            {label}
          </div>
          {i < steps.length - 1 && <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 14 }}>›</span>}
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", mono = false }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(232,244,253,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, padding: "11px 14px", fontSize: mono ? 12 : 13, color: "#e8f4fd",
          fontFamily: mono ? "'Courier New', monospace" : "inherit",
          outline: "none", transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = "var(--neon-cyan)"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
      />
    </div>
  );
}

function InfoBox({ children, style = {} }) {
  return (
    <div style={{ background: "rgba(0, 242, 255, 0.04)", border: "1px solid rgba(0, 242, 255, 0.1)", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "rgba(232,244,253,0.6)", lineHeight: 1.6, ...style }}>
      {children}
    </div>
  );
}

function SuccessBadge() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 14, marginBottom: 16 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", color: "#000" }}><Check size={14} /></div>
      <span style={{ fontSize: 13, color: "#86efac", fontWeight: 700 }}>Merchant profile activated · Embed snippet generated</span>
    </div>
  );
}

function CodeBlock({ snippet, copied, onCopy }) {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(232,244,253,0.4)", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          <Terminal size={14} /> Arc Deployment Code
        </div>
        <button 
          onClick={onCopy} 
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${copied ? "#22c55e" : "var(--neon-cyan)"}`, background: copied ? "rgba(34,197,94,0.1)" : "rgba(0, 242, 255, 0.1)", color: copied ? "#22c55e" : "var(--neon-cyan)", fontFamily: "inherit", transition: "all 0.15s" }}
        >
          {copied ? <><Check size={14} /> copied</> : <><Copy size={14} /> copy code</>}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "24px", background: "#040812", color: "#a5c8f0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12, lineHeight: 1.8, overflowX: "auto" }}>
        {snippet}
      </pre>
    </div>
  );
}

function PlatformPill({ icon, name, hint }) {
  return (
    <div className="arcade-card" style={{ padding: "16px", textAlign: "center", background: "rgba(255,255,255,0.01)" }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <p style={{ fontSize: 12, fontWeight: 800, color: "white", margin: "0 0 4px" }}>{name}</p>
      <p style={{ fontSize: 10, color: "rgba(232,244,253,0.3)", margin: 0 }}>{hint}</p>
    </div>
  );
}

function PlatformCard({ icon, name, steps }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px 20px", background: "rgba(255,255,255,0.01)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(232,244,253,0.6)", textTransform: "uppercase", letterSpacing: "0.15em" }}>{name} Deployment</span>
      </div>
      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((s, i) => (
          <li key={i} style={{ display: "flex", gap: 12, fontSize: 13, color: "rgba(232,244,253,0.45)", alignItems: "flex-start" }}>
            <span style={{ color: "var(--neon-cyan)", fontWeight: 800, flexShrink: 0, fontSize: 11, marginTop: 2 }}>{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
