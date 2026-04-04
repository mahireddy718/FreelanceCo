// IMPORTANT: Load environment variables FIRST before anything else
require('dotenv').config();

const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors')
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const AuthRouter = require('./Routes/AuthRouter')
const UserRouter = require('./Routes/UserRouter')
const ProjectRouter = require('./Routes/ProjectRouter')
const SettingsRouter = require('./Routes/SettingsRouter')
const UploadRouter = require('./Routes/UploadRouter')
const CaptchaRouter = require('./Routes/CaptchaRouter')
const ApplicationRouter = require('./Routes/ApplicationRouter')
const ChatRouter = require('./Routes/ChatRouter')
const ContractRouter = require('./Routes/ContractRouter')
const AdminRouter = require('./Routes/AdminRouter')
const PaymentRouter = require('./Routes/PaymentRouter')
const NotificationRouter = require('./Routes/NotificationRouter')
const AIRouter = require('./Routes/AIRouter')
const MessageModel = require('./Models/Message')
const ConversationModel = require('./Models/Conversation')

require('./Models/db')
const PORT = process.env.PORT || 8080;

app.get('/ping', (req, res) => {
    res.send('PONG');
})

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);
console.log('Allowed origins:', allowedOrigins);
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Razorpay webhook - must be before other routes (raw body needed)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), PaymentRouter);

app.use('/auth', AuthRouter)
app.use('/api/users', UserRouter)
app.use('/api/projects', ProjectRouter)
app.use('/api/settings', SettingsRouter)
app.use('/api/upload', UploadRouter)
app.use('/api/captcha', CaptchaRouter)
app.use('/api/applications', ApplicationRouter)
app.use('/api/chat', ChatRouter)
app.use('/api/contracts', ContractRouter)
app.use('/api/admin', AdminRouter)
app.use('/api/payments', PaymentRouter)
app.use('/api/notifications', NotificationRouter)
app.use('/api/ai', AIRouter)


// Create HTTP server and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Make io accessible to route handlers
app.set('io', io);

// Socket.IO authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication error'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded._id;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join a conversation
    socket.on('join-conversation', async (conversationId) => {
        try {
            // Verify user is a participant
            const conversation = await ConversationModel.findById(conversationId);
            const canJoin = conversation && (
                conversation.conversationType === 'global' ||
                conversation.participants.some(p => p.toString() === socket.userId)
            );

            if (canJoin) {
                socket.join(`conversation:${conversationId}`);
                console.log(`User ${socket.userId} joined conversation ${conversationId}`);
            }
        } catch (err) {
            console.error('Error joining conversation:', err);
        }
    });

    // Leave a conversation
    socket.on('leave-conversation', (conversationId) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle new message
    socket.on('send-message', async (data) => {
        try {
            const { conversationId, content } = data;

            // Verify user is a participant
            const conversation = await ConversationModel.findById(conversationId);
            const canSend = conversation && (
                conversation.conversationType === 'global' ||
                conversation.participants.some(p => p.toString() === socket.userId)
            );

            if (!canSend) {
                return;
            }

            // Create message
            const message = new MessageModel({
                conversationId,
                senderId: socket.userId,
                content: content.trim()
            });

            await message.save();

            // Update conversation
            conversation.lastMessage = {
                content: content.trim(),
                senderId: socket.userId,
                createdAt: message.createdAt
            };
            conversation.lastMessageAt = message.createdAt;
            await conversation.save();

            // Populate sender info
            await message.populate('senderId', 'name avatar');

            // Broadcast to conversation room
            io.to(`conversation:${conversationId}`).emit('new-message', {
                message,
                conversationId
            });

            if (conversation.conversationType === 'global') {
                io.emit('conversation-updated', {
                    conversationId,
                    lastMessage: conversation.lastMessage
                });
            } else {
                // Notify the other participant
                const recipientId = conversation.participants.find(p => p.toString() !== socket.userId);
                if (recipientId) {
                    io.to(`user:${recipientId}`).emit('conversation-updated', {
                        conversationId,
                        lastMessage: conversation.lastMessage
                    });
                }
            }
        } catch (err) {
            console.error('Error sending message:', err);
            socket.emit('message-error', { error: 'Failed to send message' });
        }
    });

    // Handle typing indicator
    socket.on('typing', ({ conversationId, isTyping }) => {
        socket.to(`conversation:${conversationId}`).emit('user-typing', {
            userId: socket.userId,
            isTyping
        });
    });

    // Handle message read
    socket.on('mark-read', async ({ conversationId }) => {
        try {
            await MessageModel.updateMany(
                {
                    conversationId,
                    senderId: { $ne: socket.userId },
                    read: false
                },
                {
                    $set: { read: true, readAt: new Date() }
                }
            );

            socket.to(`conversation:${conversationId}`).emit('messages-read', {
                conversationId,
                readBy: socket.userId
            });
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    });

    // Join a project workspace
    socket.on('join-project', (projectId) => {
        socket.join(`project:${projectId}`);
        console.log(`User ${socket.userId} joined project ${projectId}`);
    });

    // Leave a project workspace
    socket.on('leave-project', (projectId) => {
        socket.leave(`project:${projectId}`);
        console.log(`User ${socket.userId} left project ${projectId}`);
    });

    socket.on('disconnect', () => {
        // Intentionally silent to avoid noisy terminal logs during normal use.
    });
});

// Start server for Render/Railway/Heroku (or local dev)
// Don't start server on Vercel (serverless)
if (!process.env.VERCEL) {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

// Export for Vercel serverless
module.exports = app;

// Ensure conversation indexes match current schema (fixes legacy unique index conflicts).
const ensureConversationIndexes = async () => {
    try {
        await ConversationModel.collection.dropIndex('applicationId_1');
    } catch (err) {
        // Ignore when index is already removed or has a different shape.
        const ignorable = ['IndexNotFound', 27, 26];
        if (!ignorable.includes(err?.codeName) && !ignorable.includes(err?.code)) {
            console.warn('Could not drop legacy applicationId_1 index:', err.message);
        }
    }

    try {
        await ConversationModel.syncIndexes();
    } catch (err) {
        console.warn('Conversation index sync warning:', err.message);
    }
};

ensureConversationIndexes();
