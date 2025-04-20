import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.url}`);
  
  // Serve the test.html file
  if (req.url === '/' || req.url === '/test.html') {
    fs.readFile(path.join(__dirname, 'public', 'test.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error loading test.html: ${err.message}`);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
}); 