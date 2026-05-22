/**
 * Socket.IO Manager
 * Manages WebSocket connections and provides helpers to emit events to specific users.
 * Users join a room named `user:<userId>` on connection, so we can target individual users.
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.IO on the given HTTP server.
 * @param {import('http').Server} httpServer
 * @param {string[]} allowedOrigins - CORS origins
 * @returns {import('socket.io').Server}
 */
const init = (httpServer, allowedOrigins) => {
    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
        path: '/socket.io',
        transports: ['websocket', 'polling'],
    });

    // Authenticate socket connections using JWT
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token
            || socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication required'));
        }

        jwt.verify(token, process.env.JWT_SECRET, { issuer: 'hr-genie-api', audience: 'hr-genie-frontend' }, (err, decoded) => {
            if (err) {
                // Fallback for older tokens without iss/aud
                jwt.verify(token, process.env.JWT_SECRET, (fbErr, fbDecoded) => {
                    if (fbErr) return next(new Error('Invalid token'));
                    socket.userId = fbDecoded.id;
                    socket.orgId = fbDecoded.org_id;
                    next();
                });
                return;
            }
            socket.userId = decoded.id;
            socket.orgId = decoded.org_id;
            next();
        });
    });

    io.on('connection', (socket) => {
        // Join user-specific and org-specific rooms
        socket.join(`user:${socket.userId}`);
        socket.join(`org:${socket.orgId}`);

        socket.on('disconnect', () => {
            // Cleanup is automatic — socket.io removes from rooms
        });
    });

    return io;
};

/**
 * Get the Socket.IO server instance.
 */
const getIO = () => io;

/**
 * Emit a notification event to a specific user.
 * @param {number} userId
 * @param {object} notification - { id, type, title, message, created_at }
 */
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
};

/**
 * Emit an event to all users in an organization.
 * @param {number} orgId
 * @param {string} event
 * @param {object} data
 */
const emitToOrg = (orgId, event, data) => {
    if (io) {
        io.to(`org:${orgId}`).emit(event, data);
    }
};

module.exports = { init, getIO, emitToUser, emitToOrg };
