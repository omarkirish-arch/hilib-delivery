import { Server } from 'socket.io';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connecté : ${socket.id}`);

    // Rejoindre une chambre spécifique pour le suivi d'une commande
    socket.on('join_order_room', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`[Socket.io] Client ${socket.id} a rejoint la chambre order:${orderId}`);
    });

    // Rejointe par le livreur pour recevoir les notifications d'assignation
    socket.on('join_driver_channel', (driverId) => {
      socket.join(`driver:${driverId}`);
      console.log(`[Socket.io] Livreur ${driverId} a rejoint son canal dédié`);
    });

    // Événement de mise à jour GPS en direct par le livreur
    socket.on('update_driver_location', ({ orderId, driverId, latitude, longitude }) => {
      io.to(`order:${orderId}`).emit('driver_location_updated', {
        driverId,
        latitude,
        longitude,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client déconnecté : ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn('[Socket.io] Attention: Socket.io n\'est pas encore initialisé.');
  }
  return io;
};

export const notifyOrderUpdate = (orderId, statusData) => {
  if (io) {
    io.to(`order:${orderId}`).emit('order_status_changed', statusData);
    io.emit('global_order_updated', statusData); // Pour le dashboard Admin
  }
};

export const notifyDriverAssignment = (driverId, assignmentData) => {
  if (io) {
    io.to(`driver:${driverId}`).emit('new_delivery_assigned', assignmentData);
  }
};

