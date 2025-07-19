import { createRoot } from "react-dom/client";
import DebugApp from "./App-debug";
import ErrorBoundary from "./ErrorBoundary";
// import "./index.css"; // Temporarily disabled for debugging

// Temporarily disable service worker for debugging
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then((registration) => {
//         console.log('SW registered: ', registration);
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError);
//       });
//   });
// }

console.log("main.tsx executing");

const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

if (rootElement) {
  console.log("Creating React root...");
  const root = createRoot(rootElement);
  console.log("Rendering DebugApp...");
  root.render(
    <ErrorBoundary>
      <DebugApp />
    </ErrorBoundary>
  );
  console.log("React app rendered");
} else {
  console.error("Root element not found!");
}
