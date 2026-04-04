const Razorpay = require('razorpay');
const crypto = require('crypto');
const PaymentModel = require('../Models/Payment');
const ProjectModel = require('../Models/Project');
const ContractModel = require('../Models/Contract');
const UserModel = require('../Models/User');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { projectId, amount, contractId } = req.body;

        // Validate inputs
        if (!projectId || !amount) {
            return res.status(400).json({
                message: 'Project ID and amount are required',
                success: false
            });
        }

        // Fetch project details
        const project = await ProjectModel.findById(projectId)
            .populate('clientId', 'name email')
            .populate('assignedFreelancerId', 'name');

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Verify user is the client
        if (project.clientId._id.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only the project client can make payments',
                success: false
            });
        }

        // For escrow payments, allow payment when project is accepted or in-progress
        // For regular payments, require completed status
        const isEscrowPayment = contractId ? true : false;

        // Determine freelancer ID based on payment type
        let freelancerId;

        if (isEscrowPayment && contractId) {
            // For escrow payments, get freelancer from contract
            const contract = await ContractModel.findById(contractId)
                .populate('freelancerId', 'name email');

            if (!contract) {
                return res.status(404).json({
                    message: 'Contract not found',
                    success: false
                });
            }

            freelancerId = contract.freelancerId._id;
        } else {
            // For regular payments, require assigned freelancer in project
            if (!project.assignedFreelancerId) {
                return res.status(400).json({
                    message: 'Cannot create payment - project has no assigned freelancer',
                    success: false
                });
            }

            freelancerId = project.assignedFreelancerId._id;
        }

        if (!isEscrowPayment && project.status !== 'completed') {
            return res.status(400).json({
                message: 'Project must be completed before payment',
                success: false
            });
        }

        // Create receipt ID (max 40 chars for Razorpay)
        const receipt = `prj_${projectId.toString().slice(-10)}_${Date.now()}`;

        // Create Razorpay order
        const orderOptions = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: receipt,
            notes: {
                projectId: projectId,
                projectTitle: project.title,
                clientId: userId.toString(),
                freelancerId: freelancerId.toString()
            }
        };

        const razorpayOrder = await razorpay.orders.create(orderOptions);

        // Create payment record in database
        const payment = new PaymentModel({
            razorpayOrderId: razorpayOrder.id,
            amount: amount,
            currency: 'INR',
            status: 'created',
            escrowStatus: isEscrowPayment ? 'held' : 'released', // Set to 'held' for escrow payments
            projectId: projectId,
            clientId: userId,
            freelancerId: freelancerId,
            contractId: contractId || null,
            receipt: receipt,
            notes: orderOptions.notes,
            email: project.clientId.email,
            contact: req.user.phone || null
        });

        await payment.save();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                receipt: razorpayOrder.receipt
            },
            paymentId: payment._id,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({
            message: 'Failed to create payment order',
            success: false,
            error: err.message
        });
    }
};

// Verify payment signature
const verifyPayment = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            projectId
        } = req.body;

        // Validate inputs
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                message: 'Missing payment verification details',
                success: false
            });
        }

        // Find payment record
        const payment = await PaymentModel.findOne({ razorpayOrderId: razorpay_order_id });

        if (!payment) {
            return res.status(404).json({
                message: 'Payment record not found',
                success: false
            });
        }

        // Verify user is the client who made the payment
        if (payment.clientId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Unauthorized to verify this payment',
                success: false
            });
        }

        // Generate signature for verification
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        // Verify signature
        if (generatedSignature !== razorpay_signature) {
            payment.status = 'failed';
            payment.errorDescription = 'Payment signature verification failed';
            await payment.save();

            return res.status(400).json({
                message: 'Payment verification failed',
                success: false
            });
        }

        // Fetch payment details from Razorpay
        const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

        // Update payment record
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.verified = true;
        payment.verifiedAt = new Date();
        payment.status = razorpayPayment.status === 'captured' ? 'captured' : razorpayPayment.status;
        payment.capturedAt = razorpayPayment.status === 'captured' ? new Date() : null;
        payment.paymentMethod = razorpayPayment.method;
        payment.bank = razorpayPayment.bank || null;
        payment.wallet = razorpayPayment.wallet || null;
        payment.vpa = razorpayPayment.vpa || null;
        payment.email = razorpayPayment.email || payment.email;
        payment.contact = razorpayPayment.contact || payment.contact;

        await payment.save();

        // Check if this is an escrow payment
        const isEscrowPayment = payment.escrowStatus === 'held';

        if (isEscrowPayment) {
            // Escrow Payment Flow - Do NOT release funds yet

            // CRITICAL: Validate payment status before accepting contract
            // Check for edge cases: failed, refunded, disputed payments
            if (payment.status === 'failed') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot accept contract - payment has failed',
                    error: payment.errorDescription || 'Payment failed'
                });
            }

            if (payment.status === 'refunded' || payment.escrowStatus === 'refunded') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot accept contract - payment has been refunded',
                    error: 'Payment was refunded'
                });
            }

            // Ensure payment is actually captured or authorized
            if (payment.status !== 'captured' && payment.status !== 'authorized') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot accept contract - payment not completed',
                    error: `Payment status is ${payment.status}`
                });
            }

            // Additional check: ensure payment is verified
            if (!payment.verified) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot accept contract - payment not verified',
                    error: 'Payment verification pending'
                });
            }

            // Update contract with escrow funding details AND set status to accepted
            if (payment.contractId) {
                const contract = await ContractModel.findById(payment.contractId)
                    .populate('projectId')
                    .populate('freelancerId', 'name')
                    .populate('clientId', 'name');

                if (contract) {
                    // NOW set the contract to accepted (payment is verified)
                    contract.status = 'accepted';
                    contract.escrowFunded = true;
                    contract.escrowPaymentId = payment._id;
                    contract.escrowFundedAt = new Date();
                    await contract.save();

                    // Update project status to in-progress
                    if (contract.projectId) {
                        contract.projectId.status = 'in-progress';
                        contract.projectId.acceptedProposalId = contract.applicationId;
                        contract.projectId.assignedFreelancerId = contract.freelancerId._id;
                        await contract.projectId.save();
                    }

                    // Emit contract-accepted event
                    const io = req.app.get('io');
                    if (io && contract.conversationId) {
                        io.to(`conversation:${contract.conversationId}`).emit('contract-updated', {
                            contract,
                            conversationId: contract.conversationId
                        });
                    }
                }
            }

            // Fetch project with populated client info for notifications
            const project = await ProjectModel.findById(payment.projectId)
                .populate('clientId', 'name')
                .populate('assignedFreelancerId', 'name');

            if (project) {
                // Create notification for freelancer about escrow funding
                const freelancerNotification = {
                    type: 'escrow_funded',
                    title: 'Project Funded! 💰',
                    message: `Great news! The client has deposited ₹${payment.amount.toLocaleString()} in escrow for "${project.title}". You can now start working confidently knowing payment is secured.`,
                    projectId: project._id,
                    read: false,
                    createdAt: new Date()
                };

                await UserModel.findByIdAndUpdate(
                    project.assignedFreelancerId._id,
                    { $push: { notifications: freelancerNotification } }
                );

                // Create notification for client about escrow hold
                const clientNotification = {
                    type: 'escrow_payment_held',
                    title: 'Payment Held in Escrow',
                    message: `Your payment of ₹${payment.amount.toLocaleString()} for "${project.title}" is now held securely in escrow. It will be released to the freelancer once you approve the completed work.`,
                    projectId: project._id,
                    read: false,
                    createdAt: new Date()
                };

                await UserModel.findByIdAndUpdate(
                    project.clientId._id,
                    { $push: { notifications: clientNotification } }
                );

                // Emit Socket.io events for real-time updates
                const io = req.app.get('io');
                if (io) {
                    // Notify freelancer about escrow funding
                    io.to(`user:${project.assignedFreelancerId._id}`).emit('new-notification', freelancerNotification);

                    // Notify client about escrow hold
                    io.to(`user:${project.clientId._id}`).emit('new-notification', clientNotification);

                    // Emit escrow-funded event to project room and contract
                    io.to(`project:${project._id}`).emit('escrow-funded', {
                        projectId: project._id,
                        contractId: payment.contractId, // Use payment.contractId as contract might not be found
                        amount: payment.amount,
                        escrowStatus: 'held'
                    });
                }
            }

            res.status(200).json({
                success: true,
                message: 'Payment verified and held in escrow',
                payment: {
                    id: payment._id,
                    status: payment.status,
                    escrowStatus: payment.escrowStatus,
                    amount: payment.amount,
                    method: payment.paymentMethod,
                    verifiedAt: payment.verifiedAt
                }
            });

        } else {
            // Regular Payment Flow - Release immediately (backward compatibility)
            // Update project status to closed
            const project = await ProjectModel.findById(payment.projectId)
                .populate('clientId', 'name')
                .populate('assignedFreelancerId', 'name');

            if (project) {
                project.status = 'closed';
                await project.save();

                // Update freelancer's earnings and completed projects count
                await UserModel.findByIdAndUpdate(
                    project.assignedFreelancerId._id,
                    {
                        $inc: {
                            totalEarnings: payment.amount,
                            completedProjects: 1
                        }
                    }
                );

                // Update client's total spent and completed projects count
                await UserModel.findByIdAndUpdate(
                    project.clientId._id,
                    {
                        $inc: {
                            totalSpent: payment.amount,
                            completedProjects: 1
                        }
                    }
                );

                // Create notification for freelancer
                const freelancerNotification = {
                    type: 'payment_received',
                    title: 'Payment Received! 💰',
                    message: `Congratulations! Payment of ₹${payment.amount.toLocaleString()} received for project "${project.title}". Project has been successfully completed.`,
                    projectId: project._id,
                    read: false,
                    createdAt: new Date()
                };

                // Create notification for client
                const clientNotification = {
                    type: 'project_completed',
                    title: 'Payment Successful! ✅',
                    message: `Payment of ₹${payment.amount.toLocaleString()} sent successfully for project "${project.title}". Project has been closed.`,
                    projectId: project._id,
                    read: false,
                    createdAt: new Date()
                };

                // Send notifications to both users
                await UserModel.findByIdAndUpdate(
                    project.assignedFreelancerId._id,
                    { $push: { notifications: freelancerNotification } }
                );

                await UserModel.findByIdAndUpdate(
                    project.clientId._id,
                    { $push: { notifications: clientNotification } }
                );

                // Emit Socket.io events
                const io = req.app.get('io');
                if (io) {
                    io.to(`project:${project._id}`).emit('payment-completed', {
                        projectId: project._id,
                        paymentId: payment._id,
                        status: 'closed',
                        amount: payment.amount
                    });
                    io.to(`user:${project.assignedFreelancerId._id}`).emit('new-notification', freelancerNotification);
                    io.to(`user:${project.clientId._id}`).emit('new-notification', clientNotification);
                }
            }

            res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                payment: {
                    id: payment._id,
                    status: payment.status,
                    amount: payment.amount,
                    method: payment.paymentMethod,
                    verifiedAt: payment.verifiedAt
                }
            });
        }
    } catch (err) {
        console.error('Error verifying payment:', err);
        res.status(500).json({
            message: 'Payment verification failed',
            success: false,
            error: err.message
        });
    }
};

// Handle Razorpay webhook
const handleWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookBody = JSON.stringify(req.body);

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(webhookBody)
            .digest('hex');

        if (webhookSignature !== expectedSignature) {
            return res.status(400).json({
                message: 'Invalid webhook signature',
                success: false
            });
        }

        const event = req.body.event;
        const paymentEntity = req.body.payload.payment.entity;

        // Find payment by order ID or payment ID
        let payment = await PaymentModel.findOne({
            $or: [
                { razorpayOrderId: paymentEntity.order_id },
                { razorpayPaymentId: paymentEntity.id }
            ]
        });

        if (!payment) {
            console.log('Payment not found for webhook event');
            return res.status(200).json({ received: true });
        }

        // Update payment based on event
        payment.webhookData = req.body;
        payment.razorpayPaymentId = paymentEntity.id;

        switch (event) {
            case 'payment.authorized':
                payment.status = 'authorized';
                break;
            case 'payment.captured':
                payment.status = 'captured';
                payment.capturedAt = new Date();
                payment.verified = true;
                payment.verifiedAt = new Date();
                break;
            case 'payment.failed':
                payment.status = 'failed';
                payment.errorCode = paymentEntity.error_code;
                payment.errorDescription = paymentEntity.error_description;
                payment.errorSource = paymentEntity.error_source;
                payment.errorStep = paymentEntity.error_step;
                payment.errorReason = paymentEntity.error_reason;
                break;
            case 'refund.created':
                payment.status = 'refunded';
                payment.refundedAt = new Date();
                break;
        }

        await payment.save();

        res.status(200).json({ received: true });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({
            message: 'Webhook processing failed',
            success: false,
            error: err.message
        });
    }
};

// Get payment history for user
const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { role, status, page = 1, limit = 20 } = req.query;

        let query = {};

        // Filter by role
        if (role === 'client') {
            query.clientId = userId;
        } else if (role === 'freelancer') {
            query.freelancerId = userId;
        } else {
            query.$or = [
                { clientId: userId },
                { freelancerId: userId }
            ];
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const payments = await PaymentModel.find(query)
            .populate('projectId', 'title thumbnail')
            .populate('clientId', 'name avatar email')
            .populate('freelancerId', 'name avatar email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await PaymentModel.countDocuments(query);

        res.status(200).json({
            success: true,
            payments,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        console.error('Error fetching payment history:', err);
        res.status(500).json({
            message: 'Failed to fetch payment history',
            success: false,
            error: err.message
        });
    }
};

// Get payment by project ID
const getPaymentByProject = async (req, res) => {
    try {
        const userId = req.user._id;
        const { projectId } = req.params;

        const payment = await PaymentModel.findOne({ projectId })
            .populate('projectId', 'title')
            .populate('clientId', 'name email')
            .populate('freelancerId', 'name email');

        if (!payment) {
            return res.status(404).json({
                message: 'No payment found for this project',
                success: false
            });
        }

        // Verify user is either client or freelancer
        if (
            payment.clientId._id.toString() !== userId.toString() &&
            payment.freelancerId._id.toString() !== userId.toString()
        ) {
            return res.status(403).json({
                message: 'Unauthorized to view this payment',
                success: false
            });
        }

        res.status(200).json({
            success: true,
            payment
        });
    } catch (err) {
        console.error('Error fetching payment:', err);
        res.status(500).json({
            message: 'Failed to fetch payment details',
            success: false,
            error: err.message
        });
    }
};

// Release escrow payment (called when client approves completed work)
const releaseEscrowPayment = async (req, res) => {
    try {
        const userId = req.user._id;
        const { paymentId } = req.params;

        // Find payment record
        const payment = await PaymentModel.findById(paymentId)
            .populate('projectId')
            .populate('clientId', 'name')
            .populate('freelancerId', 'name');

        if (!payment) {
            return res.status(404).json({
                message: 'Payment not found',
                success: false
            });
        }

        // Verify user is the client who made the payment
        if (payment.clientId._id.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only the client can release escrow payment',
                success: false
            });
        }

        // Verify payment is in escrow
        if (payment.escrowStatus !== 'held') {
            return res.status(400).json({
                message: 'Payment is not in escrow status',
                success: false
            });
        }

        // CRITICAL: Validate payment status before releasing escrow
        // Check for edge cases: failed, refunded, disputed payments
        if (payment.status === 'failed') {
            return res.status(400).json({
                message: 'Cannot release escrow - payment has failed',
                success: false,
                error: payment.errorDescription || 'Payment failed'
            });
        }

        if (payment.status === 'refunded') {
            return res.status(400).json({
                message: 'Cannot release escrow - payment has been refunded',
                success: false,
                error: 'Payment was already refunded'
            });
        }

        // Ensure payment is captured or authorized
        if (payment.status !== 'captured' && payment.status !== 'authorized') {
            return res.status(400).json({
                message: 'Cannot release escrow - payment not captured or authorized',
                success: false,
                error: `Payment status is ${payment.status}. Only captured or authorized payments can be released.`
            });
        }

        // Ensure payment is verified
        if (!payment.verified) {
            return res.status(400).json({
                message: 'Cannot release escrow - payment not verified',
                success: false,
                error: 'Payment verification pending or failed'
            });
        }

        // Verify project is completed
        if (payment.projectId.status !== 'completed') {
            return res.status(400).json({
                message: 'Project must be in completed status before releasing payment',
                success: false
            });
        }

        // Release escrow payment
        payment.escrowStatus = 'released';
        payment.releasedAt = new Date();
        payment.releasedBy = userId;
        await payment.save();

        // Update project status to closed
        payment.projectId.status = 'closed';
        await payment.projectId.save();

        // Update freelancer's earnings and completed projects count
        await UserModel.findByIdAndUpdate(
            payment.freelancerId._id,
            {
                $inc: {
                    totalEarnings: payment.amount,
                    completedProjects: 1
                }
            }
        );

        // Update client's total spent and completed projects count
        await UserModel.findByIdAndUpdate(
            payment.clientId._id,
            {
                $inc: {
                    totalSpent: payment.amount,
                    completedProjects: 1
                }
            }
        );

        // Create notification for freelancer
        const freelancerNotification = {
            type: 'escrow_released',
            title: 'Payment Released! 🎉',
            message: `Congratulations! Payment of ₹${payment.amount.toLocaleString()} has been released from escrow for project "${payment.projectId.title}". The funds have been added to your earnings.`,
            projectId: payment.projectId._id,
            read: false,
            createdAt: new Date()
        };

        // Create notification for client
        const clientNotification = {
            type: 'project_closed',
            title: 'Project Completed Successfully! ✅',
            message: `Payment of ₹${payment.amount.toLocaleString()} has been released to ${payment.freelancerId.name} for project "${payment.projectId.title}". The project has been closed.`,
            projectId: payment.projectId._id,
            read: false,
            createdAt: new Date()
        };

        // Send notifications to both users
        await UserModel.findByIdAndUpdate(
            payment.freelancerId._id,
            { $push: { notifications: freelancerNotification } }
        );

        await UserModel.findByIdAndUpdate(
            payment.clientId._id,
            { $push: { notifications: clientNotification } }
        );

        // Emit Socket.io events
        const io = req.app.get('io');
        if (io) {
            io.to(`project:${payment.projectId._id}`).emit('escrow-released', {
                projectId: payment.projectId._id,
                paymentId: payment._id,
                status: 'closed',
                amount: payment.amount
            });
            io.to(`user:${payment.freelancerId._id}`).emit('new-notification', freelancerNotification);
            io.to(`user:${payment.clientId._id}`).emit('new-notification', clientNotification);
        }

        res.status(200).json({
            success: true,
            message: 'Escrow payment released successfully',
            payment: {
                id: payment._id,
                escrowStatus: payment.escrowStatus,
                releasedAt: payment.releasedAt,
                amount: payment.amount
            }
        });
    } catch (err) {
        console.error('Error releasing escrow payment:', err);
        res.status(500).json({
            message: 'Failed to release escrow payment',
            success: false,
            error: err.message
        });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    handleWebhook,
    getPaymentHistory,
    getPaymentByProject,
    releaseEscrowPayment
};
