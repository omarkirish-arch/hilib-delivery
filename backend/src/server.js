import http from 'http';
import app from './app.js';
import { initSocket } from './services/socketService.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialisation de Socket.io pour les mises à jour temps réel
initSocket(server);

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Serveur Hilib Delivery démarré sur le port ${PORT}`);
  console.log(`📡 Endpoints API v1 disponibles sur http://localhost:${PORT}/api/v1`);
  console.log(`=================================================`);
});

export { server };

