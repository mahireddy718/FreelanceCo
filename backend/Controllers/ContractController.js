const ContractModel = require('../Models/Contract');
const ConversationModel = require('../Models/Conversation');
const ProjectModel = require('../Models/Project');
const ApplicationModel = require('../Models/Application');

// Create contract proposal (Freelancer only)
const proposeContract = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId, projectId, applicationId, contractDetails } = req.body;

        // Validate required fields
        if (!conversationId || !projectId || !applicationId || !contractDetails) {
            return res.status(400).json({
                message: 'All fields are required',
                success: false
            });
        }

        // Verify conversation exists and user is a participant
        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation not found',
                success: false
            });
        }

        const isParticipant = conversation.participants.some(
            p => p.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                message: 'You are not authorized to propose a contract in this conversation',
                success: false
            });
        }

        // Verify application exists and belongs to user
        const application = await ApplicationModel.findById(applicationId);
        if (!application || application.freelancerId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Invalid application',
                success: false
            });
        }

        // Get project and client details
        const project = await ProjectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Create contract
        const contract = new ContractModel({
            projectId,
            applicationId,
            freelancerId: userId,
            clientId: project.clientId,
            conversationId,
            contractDetails
        });

        await contract.save();

        // Populate details
        await contract.populate('freelancerId', 'name avatar');
        await contract.populate('clientId', 'name avatar');
        await contract.populate('projectId', 'title');

        // Create notification for client
        const UserModel = require('../Models/User');
        const MessageModel = require('../Models/Message');

        const clientNotification = {
            type: 'contract_proposed',
            title: 'New Contract Proposal 📋',
            message: `${contract.freelancerId.name} has proposed a work contract for "${contract.projectId.title}". Review and respond to the proposal.`,
            projectId: contract.projectId._id,
            read: false,
            createdAt: new Date()
        };

        await UserModel.findByIdAndUpdate(
            contract.clientId._id,
            { $push: { notifications: clientNotification } }
        );

        // Create system message in chat to show proposal banner
        const systemMessageContent = `Contract Proposal: ${contract.freelancerId.name} has proposed a work contract for "${contract.projectId.title}" with a budget of ₹${contract.contractDetails.finalAmount.toLocaleString()}. Please review and respond.`;

        const systemMessage = new MessageModel({
            conversationId,
            content: systemMessageContent,
            messageType: 'system'
        });

        await systemMessage.save();

        // Update conversation's lastMessage to show in sidebar
        await ConversationModel.findByIdAndUpdate(conversationId, {
            lastMessage: {
                content: systemMessageContent,
                senderId: null,
                createdAt: systemMessage.createdAt
            },
            lastMessageAt: systemMessage.createdAt
        });

        // Emit Socket.IO events
        const io = req.app.get('io');
        if (io) {
            // Emit contract-proposed event
            io.to(`conversation:${conversationId}`).emit('contract-proposed', {
                contract,
                conversationId
            });

            // Send notification to client
            io.to(`user:${contract.clientId._id}`).emit('new-notification', clientNotification);

            // Broadcast system message to chat
            io.to(`conversation:${conversationId}`).emit('new-message', {
                message: systemMessage,
                conversationId
            });

            // Update conversation list with new lastMessage for both participants
            io.to(`user:${contract.freelancerId._id}`).emit('conversation-updated', {
                conversationId,
                lastMessage: {
                    content: systemMessageContent,
                    senderId: null,
                    createdAt: systemMessage.createdAt
                }
            });

            io.to(`user:${contract.clientId._id}`).emit('conversation-updated', {
                conversationId,
                lastMessage: {
                    content: systemMessageContent,
                    senderId: null,
                    createdAt: systemMessage.createdAt
                }
            });
        }

        res.status(201).json({
            message: 'Contract proposed successfully',
            success: true,
            contract
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get contracts by conversation
const getContractsByConversation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;

        // Verify user is participant
        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation not found',
                success: false
            });
        }

        const isParticipant = conversation.participants.some(
            p => p.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                message: 'Not authorized',
                success: false
            });
        }

        const contracts = await ContractModel.find({ conversationId })
            .populate('freelancerId', 'name avatar')
            .populate('clientId', 'name avatar')
            .populate('projectId', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            contracts
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Update contract status (Client only)
const updateContractStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { status, clientNotes } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid status',
                success: false
            });
        }

        const contract = await ContractModel.findById(id)
            .populate('projectId')
            .populate('freelancerId', 'name avatar')
            .populate('clientId', 'name avatar');

        if (!contract) {
            return res.status(404).json({
                message: 'Contract not found',
                success: false
            });
        }

        // Verify user is the client
        if (contract.clientId._id.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only the client can accept or reject contracts',
                success: false
            });
        }

        // If accepting and payment is required, DON'T change status yet
        // Status will be changed after successful payment
        if (status === 'accepted' && contract.paymentRequired) {
            // Keep status as pending, just return payment required flag
            contract.respondedAt = new Date();
            if (clientNotes) {
                contract.clientNotes = clientNotes;
            }
            await contract.save();

            // Return flag to frontend indicating payment is required
            // Status will be updated to 'accepted' after payment verification
            return res.status(200).json({
                message: 'Payment required to accept contract',
                success: true,
                requiresPayment: true,
                contract,
                paymentDetails: {
                    amount: contract.contractDetails.finalAmount,
                    contractId: contract._id,
                    projectId: contract.projectId._id
                }
            });
        }

        // For rejection or acceptance without payment requirement
        contract.status = status;
        contract.respondedAt = new Date();
        if (clientNotes) {
            contract.clientNotes = clientNotes;
        }

        await contract.save();

        // If accepted (without payment requirement), update project status
        if (status === 'accepted') {
            contract.projectId.status = 'in-progress';
            contract.projectId.acceptedProposalId = contract.applicationId;
            contract.projectId.assignedFreelancerId = contract.freelancerId._id;
            await contract.projectId.save();

            // Create notification for freelancer
            const UserModel = require('../Models/User');

            const freelancerNotification = {
                type: 'contract_accepted',
                title: 'Contract Accepted! 🎉',
                message: `Great news! ${contract.clientId.name} has accepted your proposal for "${contract.projectId.title}". You can now start working on the project.`,
                projectId: contract.projectId._id,
                read: false,
                createdAt: new Date()
            };

            await UserModel.findByIdAndUpdate(
                contract.freelancerId._id,
                { $push: { notifications: freelancerNotification } }
            );

            // Emit Socket.io event to freelancer immediately
            const io = req.app.get('io');
            if (io) {
                io.to(`user:${contract.freelancerId._id}`).emit('new-notification', freelancerNotification);
                io.to(`project:${contract.projectId._id}`).emit('contract-accepted', {
                    contractId: contract._id,
                    status: 'accepted'
                });
            }
        }

        // For rejected contracts or accepted without payment
        const UserModel = require('../Models/User');
        const MessageModel = require('../Models/Message');

        const notificationType = status === 'accepted' ? 'contract_accepted' : 'contract_rejected';
        const notificationTitle = status === 'accepted' ? 'Contract Accepted! 🎉' : 'Contract Updated';
        const notificationMessage = status === 'accepted'
            ? `Great news! ${contract.clientId.name} has accepted your proposal for "${contract.projectId.title}". You can now start working on the project.`
            : `${contract.clientId.name} has ${status} your contract proposal for "${contract.projectId.title}".${clientNotes ? ` Note: ${clientNotes}` : ''}`;

        const freelancerNotification = {
            type: notificationType,
            title: notificationTitle,
            message: notificationMessage,
            projectId: contract.projectId._id,
            read: false,
            createdAt: new Date()
        };

        await UserModel.findByIdAndUpdate(
            contract.freelancerId._id,
            { $push: { notifications: freelancerNotification } }
        );

        // Create system message in chat to show status banner
        const systemMessageContent = status === 'accepted'
            ? `Contract Accepted! The project "${contract.projectId.title}" is now in progress. The freelancer can begin work.`
            : `Contract ${status}${clientNotes ? `: ${clientNotes}` : '.'}`;

        const systemMessage = new MessageModel({
            conversationId: contract.conversationId,
            content: systemMessageContent,
            messageType: 'system'
        });

        await systemMessage.save();

        // Update conversation's lastMessage to show in sidebar
        await ConversationModel.findByIdAndUpdate(contract.conversationId, {
            lastMessage: {
                content: systemMessageContent,
                senderId: null,
                createdAt: systemMessage.createdAt
            },
            lastMessageAt: systemMessage.createdAt
        });

        // Emit Socket.IO events
        const io = req.app.get('io');
        if (io) {
            // Update contract in conversation
            io.to(`conversation:${contract.conversationId}`).emit('contract-updated', {
                contract,
                conversationId: contract.conversationId
            });

            // Send notification to freelancer
            io.to(`user:${contract.freelancerId._id}`).emit('new-notification', freelancerNotification);

            // Broadcast system message to chat
            io.to(`conversation:${contract.conversationId}`).emit('new-message', {
                message: systemMessage,
                conversationId: contract.conversationId
            });

            // Update conversation list with new lastMessage for both participants
            io.to(`user:${contract.freelancerId._id}`).emit('conversation-updated', {
                conversationId: contract.conversationId,
                lastMessage: {
                    content: systemMessageContent,
                    senderId: null,
                    createdAt: systemMessage.createdAt
                }
            });

            io.to(`user:${contract.clientId._id}`).emit('conversation-updated', {
                conversationId: contract.conversationId,
                lastMessage: {
                    content: systemMessageContent,
                    senderId: null,
                    createdAt: systemMessage.createdAt
                }
            });
        }

        res.status(200).json({
            message: `Contract ${status} successfully`,
            success: true,
            contract
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get user's contracts (both as freelancer and client)
const getMyContracts = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, role } = req.query;

        let query = {};

        if (role === 'freelancer') {
            query.freelancerId = userId;
        } else if (role === 'client') {
            query.clientId = userId;
        } else {
            query.$or = [
                { freelancerId: userId },
                { clientId: userId }
            ];
        }

        if (status) {
            query.status = status;
        }

        const contracts = await ContractModel.find(query)
            .populate('freelancerId', 'name avatar')
            .populate('clientId', 'name avatar')
            .populate('projectId', 'title thumbnail status')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            contracts
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

module.exports = {
    proposeContract,
    getContractsByConversation,
    updateContractStatus,
    getMyContracts
};
