import React from 'react';

function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>App Test</h1>
      <p>If you can see this, React is loading correctly.</p>
      <button onClick={() => alert('React is working!')}>
        Test Button
      </button>
    </div>
  );
}

export default SimpleApp;