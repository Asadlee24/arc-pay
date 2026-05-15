(function() {
  const btnDiv = document.getElementById('arc-pay-btn');
  if (!btnDiv) return;

  const config = {
    merchantId: btnDiv.dataset.merchantId,
    publicKey: btnDiv.dataset.publicKey,
    amount: btnDiv.dataset.amount,
    orderId: btnDiv.dataset.orderId,
    successUrl: btnDiv.dataset.successUrl,
    cancelUrl: btnDiv.dataset.cancelUrl,
    label: btnDiv.dataset.label || "Pay with USDC",
    chainId: "0x4ced12", // 5042002
    rpcUrl: "https://rpc.testnet.arc.network"
  };

  const btn = document.createElement('button');
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 40 40" fill="none" style="margin-right:8px;">
      <path d="M20 5L35 32H5L20 5Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
    </svg>
    <span>${config.label}</span>
    <span style="margin-left:10px; background:rgba(0,242,255,0.15); padding:2px 8px; border-radius:6px; font-size:12px;">$${config.amount}</span>
  `;
  
  btn.style.cssText = `
    display: inline-flex; align-items: center; justify-content: center;
    padding: 14px 28px; border-radius: 14px;
    background: #020617; border: 2px solid #00f2ff;
    color: #e8f4fd; font-size: 14px; font-weight: 800; cursor: pointer;
    transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 0.05em;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.02)'; btn.style.boxShadow = '0 0 20px rgba(0,242,255,0.2)'; });
  btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = 'none'; });

  if (typeof window.ethers === 'undefined') {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js";
    document.head.appendChild(script);
  }

  btn.addEventListener('click', async () => {
    if (!window.ethereum) {
      alert("Please install a Web3 wallet like MetaMask to continue.");
      return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = `position: fixed; inset: 0; z-index: 100000; background: rgba(0,0,0,0.92); display: flex; align-items: center; justify-content: center; font-family: system-ui, sans-serif;`;
    
    const modal = document.createElement('div');
    modal.style.cssText = `background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px; max-width: 400px; width: 90%; color: white; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5);`;
    
    const setStatus = (title, sub, loading = false) => {
      modal.innerHTML = `
        <div style="margin-bottom:20px; display:flex; justify-content:center;">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style="color:#00f2ff;">
            <path d="M20 5L35 32H5L20 5Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
          </svg>
        </div>
        <h2 style="margin:0 0 10px; font-size:24px; font-weight:800;">${title}</h2>
        <p style="margin:0 0 25px; color:#94a3b8; font-size:14px; line-height:1.5;">${sub}</p>
        ${loading ? '<div style="width:30px; height:30px; border:3px solid rgba(0,242,255,0.2); border-top-color:#00f2ff; border-radius:50%; animation:arc-spin 1s linear infinite; margin:0 auto;"></div>' : ''}
      `;
    };

    if (!document.getElementById('arc-widget-styles')) {
      const style = document.createElement('style');
      style.id = 'arc-widget-styles';
      style.innerHTML = '@keyframes arc-spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    try {
      setStatus("Connecting Wallet", "Please approve the connection request...", true);
      const provider = new window.ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      setStatus("Verifying Network", "Switching to Arc Testnet...", true);
      const network = await provider.getNetwork();
      if (network.chainId !== 5042002) {
        try {
          await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: config.chainId }] });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: config.chainId,
                chainName: "Arc Testnet",
                nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
                rpcUrls: [config.rpcUrl],
                blockExplorerUrls: ["https://testnet.arcscan.app/"]
              }]
            });
          } else throw switchError;
        }
      }

      setStatus("Confirming Payment", `Sending $${config.amount} USDC (Native Token) to merchant.`, true);
      
      // Arc uses USDC as Native Gas Token
      const tx = await signer.sendTransaction({
        to: config.publicKey,
        value: window.ethers.utils.parseUnits(config.amount, 18)
      });
      
      setStatus("Processing on Arc", `Waiting for confirmation...<br><small style="opacity:0.5; font-size:10px;">TX: ${tx.hash.slice(0,10)}...</small>`, true);
      await tx.wait();

      setStatus("Success!", "Payment confirmed on Arc Network. Redirecting...", false);
      modal.querySelector('div').innerHTML = '<div style="width:60px; height:60px; border-radius:50%; background:rgba(34,197,94,0.1); border:2px solid #22c55e; color:#22c55e; display:flex; align-items:center; justify-content:center; font-size:30px;">✓</div>';
      
      setTimeout(() => {
        if (config.successUrl) window.location.href = config.successUrl;
        else document.body.removeChild(overlay);
      }, 2000);

    } catch (err) {
      console.error(err);
      setStatus("Payment Failed", err.reason || err.message || "User rejected or error occurred.", false);
      const closeBtn = document.createElement('button');
      closeBtn.innerText = "Close";
      closeBtn.style.cssText = "margin-top:20px; padding:10px 20px; border-radius:10px; background:#ef4444; color:white; border:none; cursor:pointer; font-weight:700;";
      closeBtn.onclick = () => document.body.removeChild(overlay);
      modal.appendChild(closeBtn);
    }
  });

  btnDiv.appendChild(btn);
})();
