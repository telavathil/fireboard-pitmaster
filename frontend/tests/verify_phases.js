const fs = require('fs');
const path = require('path');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const res = await fetch("http://127.0.0.1:9222/json/list");
  const list = await res.json();
  const page = list.find(p => p.url.includes("localhost:3001"));
  if (!page) {
    console.error("Dashboard page not found! Make sure the next.js app is running on port 3001.");
    return;
  }
  const wsUrl = page.webSocketDebuggerUrl;
  console.log("Connecting to WebSocket:", wsUrl);
  const ws = new WebSocket(wsUrl);

  let messageId = 0;
  const sendCommand = (method, params = {}) => {
    messageId++;
    ws.send(JSON.stringify({ id: messageId, method, params }));
    return messageId;
  };

  const pendingCommands = new Map();
  const sendCommandPromise = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = sendCommand(method, params);
      pendingCommands.set(id, { resolve, reject });
    });
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (pendingCommands.has(data.id)) {
      const { resolve } = pendingCommands.get(data.id);
      pendingCommands.delete(data.id);
      resolve(data.result);
    }
  };

  ws.onopen = async () => {
    try {
      console.log("Connected to Chrome. Bypassing login by injecting mock localStorage token...");
      
      await sendCommandPromise("Runtime.evaluate", {
        expression: `
          localStorage.setItem('pitmaster_token', 'mock_token_visual_verification');
          localStorage.setItem('pitmaster_username', 'pitmaster_verify_user');
          console.log("Mock credentials injected into localStorage.");
        `
      });

      const phases = [
        { num: 1, name: "phase1_setup" },
        { num: 2, name: "phase2_calibration" },
        { num: 3, name: "phase3_stall" },
        { num: 4, name: "phase4_pull" },
        { num: 5, name: "phase5_resting" }
      ];

      for (const phase of phases) {
        const url = `http://localhost:3001/?phase=${phase.num}`;
        console.log(`Navigating to Phase ${phase.num} (${phase.name}) via URL: ${url}`);
        
        await sendCommandPromise("Page.navigate", { url });
        
        console.log("Waiting 3 seconds for rendering...");
        await sleep(3000);
        
        console.log(`Capturing screenshot for Phase ${phase.num}...`);
        const screenshotResult = await sendCommandPromise("Page.captureScreenshot", { format: "png" });
        
        if (screenshotResult && screenshotResult.data) {
          const buffer = Buffer.from(screenshotResult.data, 'base64');
          const dir = path.join(__dirname, 'screenshots');
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          const filepath = path.join(dir, `${phase.name}.png`);
          fs.writeFileSync(filepath, buffer);
          console.log(`Saved screenshot successfully to: ${filepath}`);
        } else {
          console.error(`Failed to capture screenshot for phase ${phase.num}`);
        }
      }

      console.log("All phase screenshots captured successfully!");
      ws.close();
    } catch (err) {
      console.error("Error during visual verification:", err);
      ws.close();
    }
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
}

main().catch(console.error);
