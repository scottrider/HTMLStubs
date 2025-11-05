const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Enable CORS
app.use(cors());

// Set proper MIME types for JavaScript modules
app.use('/dist', express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Serve all other static files
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'position-management.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 HTMLStubs server running at http://localhost:${PORT}`);
  console.log(`📄 Position Management: http://localhost:${PORT}/position-management.html`);
  console.log(`🧪 Module Test: http://localhost:${PORT}/test-modules.html`);
});