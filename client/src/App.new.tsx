import React from "react";

function App() {
  return (
    <div style={{ 
      background: '#F5F7FA', 
      minHeight: '100vh', 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ 
        color: '#1C1C1E', 
        fontSize: '24px', 
        fontWeight: 'bold',
        margin: 0,
        marginBottom: '16px'
      }}>
        myRoommate
      </h1>
      <p style={{ 
        color: '#8E8E93', 
        margin: 0,
        marginBottom: '12px'
      }}>
        React is working correctly
      </p>
      <button 
        style={{
          background: 'linear-gradient(135deg, #10b981, #06b6d4)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
        onClick={() => window.location.href = '/api/login'}
      >
        Sign In
      </button>
    </div>
  );
}

export default App;