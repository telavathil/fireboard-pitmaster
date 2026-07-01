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
      console.log("Connected to Chrome. Injecting mock localStorage token...");
      
      await sendCommandPromise("Runtime.evaluate", {
        expression: `
          localStorage.setItem('pitmaster_token', 'mock_token_visual_verification');
          localStorage.setItem('pitmaster_username', 'pitmaster_verify_user');
          console.log("Mock credentials injected.");
        `
      });

      console.log("Navigating to http://localhost:3001/ ...");
      await sendCommandPromise("Page.navigate", { url: "http://localhost:3001/" });
      await sleep(4000);

      console.log("Performing cache-bypassed reload...");
      await sendCommandPromise("Page.reload", { ignoreCache: true });
      await sleep(4000);

      const captureScreen = async (filename) => {
        const screenshotResult = await sendCommandPromise("Page.captureScreenshot", { format: "png" });
        if (screenshotResult && screenshotResult.data) {
          const buffer = Buffer.from(screenshotResult.data, 'base64');
          const dir = path.join(__dirname, 'screenshots');
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          const filepath = path.join(dir, `${filename}.png`);
          fs.writeFileSync(filepath, buffer);
          console.log(`Saved screenshot to: ${filepath}`);
        } else {
          console.error(`Failed to capture screenshot: ${filename}`);
        }
      };

      const getVal = async (expr) => {
        const res = await sendCommandPromise("Runtime.evaluate", { expression: expr });
        return res.result.value;
      };

      console.log("Initial Tab:", await getVal("window.activeTab"));
      await captureScreen("nav_dashboard_active_view");

      // 1. Click Probes tab
      console.log("Clicking 'Probes' tab...");
      await sendCommandPromise("Runtime.evaluate", {
        expression: `
          {
            const el = Array.from(document.querySelectorAll('nav div')).find(e => e.innerText.includes('Probes'));
            if (el) el.click();
          }
        `
      });
      await sleep(2000);
      console.log("Current Tab:", await getVal("window.activeTab"));
      await captureScreen("nav_probes_view");

      // 2. Click History tab
      console.log("Clicking 'History' tab...");
      await sendCommandPromise("Runtime.evaluate", {
        expression: `
          {
            const el = Array.from(document.querySelectorAll('nav div')).find(e => e.innerText.includes('History'));
            if (el) el.click();
          }
        `
      });
      await sleep(2000);
      console.log("Current Tab:", await getVal("window.activeTab"));
      await captureScreen("nav_history_view");

      // 3. Click Settings tab
      console.log("Clicking 'Settings' tab...");
      await sendCommandPromise("Runtime.evaluate", {
        expression: `
          {
            const el = Array.from(document.querySelectorAll('nav div')).find(e => e.innerText.includes('Settings'));
            if (el) el.click();
          }
        `
      });
      await sleep(2000);
      console.log("Current Tab:", await getVal("window.activeTab"));
      await captureScreen("nav_settings_view");

      // 4. Click Dashboard tab
      console.log("Clicking 'Dashboard' tab...");
      await sendCommandPromise("Runtime.evaluate", {
        expression: `
          {
            const el = Array.from(document.querySelectorAll('nav div')).find(e => e.innerText.includes('Dashboard'));
            if (el) el.click();
          }
        `
      });
      await sleep(2000);
      console.log("Current Tab:", await getVal("window.activeTab"));
      await captureScreen("nav_dashboard_active_view_back");

      console.log("Navigation verification completed!");
      ws.close();
    } catch (err) {
      console.error("Error during navigation verification:", err);
      ws.close();
    }
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
}

main().catch(console.error);
