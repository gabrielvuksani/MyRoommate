#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create basic web assets for Capacitor
const distDir = path.join(__dirname, 'dist', 'public');

// Ensure dist/public directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create a basic index.html for the iOS app
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MyRoommate</title>
  <meta name="format-detection" content="telephone=no">
  <meta name="msapplication-tap-highlight" content="no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    
    .container {
      max-width: 400px;
      padding: 2rem;
    }
    
    .logo {
      width: 120px;
      height: 120px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 30px;
      margin: 0 auto 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      backdrop-filter: blur(10px);
    }
    
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    
    p {
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 2rem;
    }
    
    .btn {
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 1rem 2rem;
      border-radius: 15px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }
    
    .btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🏠</div>
    <h1>MyRoommate</h1>
    <p>Your premium roommate companion app is loading...</p>
    <button class="btn" onclick="window.location.reload()">Refresh</button>
  </div>
  
  <script>
    // Redirect to the actual app URL in production
    setTimeout(() => {
      // This would redirect to your deployed web app
      console.log('App loaded');
    }, 2000);
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);

// Create manifest.json for PWA features
const manifest = {
  name: "MyRoommate",
  short_name: "MyRoommate",
  start_url: "/",
  display: "standalone",
  background_color: "#667eea",
  theme_color: "#667eea",
  icons: [
    {
      src: "icon-192.png",
      sizes: "192x192",
      type: "image/png"
    },
    {
      src: "icon-512.png", 
      sizes: "512x512",
      type: "image/png"
    }
  ]
};

fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('✅ Basic web assets created for iOS app');
console.log('📱 Ready to sync with Capacitor');