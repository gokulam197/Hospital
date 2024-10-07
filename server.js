const http = require('http');
const fs = require('fs');
const url = require('url');


const DATA_FILE = './hospitals.json';


const readData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading data:', err);
    return [];
  }
};


const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing data:', err);
  }
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathSegments = parsedUrl.pathname.split('/').filter(seg => seg);
  const method = req.method;

  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  
  if (pathSegments[0] === 'hospitals') {
    // GET /hospitals or GET /hospitals/:id
    if (method === 'GET') {
      const hospitals = readData();
      if (pathSegments.length === 1) {
        // Return all hospitals
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(hospitals));
      } else if (pathSegments.length === 2) {
        // Return hospital by id
        const id = parseInt(pathSegments[1]);
        const hospital = hospitals.find(h => h.id === id);
        if (hospital) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(hospital));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Hospital not found' }));
        }
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Bad Request' }));
      }
    }

    // POST /hospitals
    else if (method === 'POST' && pathSegments.length === 1) {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const newHospital = JSON.parse(body);
          const hospitals = readData();
          // Assign a new unique id
          const newId = hospitals.length > 0 ? Math.max(...hospitals.map(h => h.id)) + 1 : 1;
          newHospital.id = newId;
          hospitals.push(newHospital);
          writeData(hospitals);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newHospital));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Invalid JSON data' }));
        }
      });
    }

    // PUT /hospitals/:id
    else if (method === 'PUT' && pathSegments.length === 2) {
      const id = parseInt(pathSegments[1]);
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const updatedHospital = JSON.parse(body);
          const hospitals = readData();
          const index = hospitals.findIndex(h => h.id === id);
          if (index !== -1) {
            hospitals[index] = { id, ...updatedHospital };
            writeData(hospitals);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(hospitals[index]));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Hospital not found' }));
          }
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Invalid JSON data' }));
        }
      });
    }

    // DELETE /hospitals/:id
    else if (method === 'DELETE' && pathSegments.length === 2) {
      const id = parseInt(pathSegments[1]);
      const hospitals = readData();
      const index = hospitals.findIndex(h => h.id === id);
      if (index !== -1) {
        const deletedHospital = hospitals.splice(index, 1)[0];
        writeData(hospitals);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(deletedHospital));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Hospital not found' }));
      }
    }

    // Unsupported operations
    else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Method Not Allowed' }));
    }
  }

  // Handle unknown routes
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not Found' }));
  }
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
