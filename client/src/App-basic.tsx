// Super basic app without any dependencies
function BasicApp() {
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>Basic App Working</h1>
      <p>This is a minimal React component without any external dependencies.</p>
      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#666', marginTop: 0 }}>Test Information</h2>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
        <p>React is rendering successfully</p>
      </div>
    </div>
  );
}

export default BasicApp;