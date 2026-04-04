const ApplicationModel = require('../Models/Application');
const ConversationModel = require('../Models/Conversation');
const ProjectModel = require('../Models/Project');
const UserModel = require('../Models/User');
const { scoreApplication } = require('./AIController');

// Submit application for a project
const submitApplication = async (req, res) => {
    try {
        const freelancerId = req.user._id;
        const { projectId, coverLetter, proposedBudget, proposedDuration } = req.body;

        // Validate required fields
        if (!projectId || !coverLetter || !proposedBudget || !proposedDuration) {
            return res.status(400).json({
                message: 'Please provide all required fields',
                success: false
            });
        }

        // Check if project exists
        const project = await ProjectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Check if project is still open
        if (project.status !== 'open') {
            return res.status(400).json({
                message: 'This project is no longer accepting applications',
                success: false
            });
        }

        // Prevent applying to own project
        if (project.clientId.toString() === freelancerId.toString()) {
            return res.status(403).json({
                message: 'You cannot apply to your own project',
                success: false
            });
        }

        // Check if user is a freelancer
        const user = await UserModel.findById(freelancerId);
        if (user.role !== 'freelancer' && user.role !== 'both') {
            return res.status(403).json({
                message: 'Only freelancers can apply to projects',
                success: false
            });
        }

        // Check if user was previously rejected for this project
        const previousRejection = await ApplicationModel.findOne({
            projectId,
            freelancerId,
            status: 'rejected'
        });

        if (previousRejection) {
            return res.status(403).json({
                message: 'You cannot reapply to this project as your previous application was rejected',
                success: false
            });
        }

        // Create application
        const application = new ApplicationModel({
            projectId,
            freelancerId,
            coverLetter,
            proposedBudget,
            proposedDuration
        });

        await application.save();

        // Increment project proposal count
        project.proposalCount += 1;
        await project.save();

        // Trigger AI scoring asynchronously (don't block the response)
        scoreApplication(
            project.title,
            project.description,
            project.skillsRequired,
            coverLetter
        ).then(async (result) => {
            if (result.success) {
                try {
                    await ApplicationModel.findByIdAndUpdate(application._id, {
                        aiScore: result.aiScore,
                        aiAnalysis: result.aiAnalysis,
                        scoredAt: new Date()
                    });
                    console.log(`AI scored application ${application._id}: ${result.aiScore}`);
                } catch (updateErr) {
                    console.error('Error updating application with AI score:', updateErr);
                }
            } else {
                console.error('AI scoring failed for application:', application._id, result.error);
            }
        }).catch(err => {
            console.error('AI scoring error:', err);
        });

        // Populate application details
        await application.populate('projectId', 'title category budget');
        await application.populate('freelancerId', 'name avatar');

        res.status(201).json({
            message: 'Application submitted successfully',
            success: true,
            application
        });
    } catch (err) {
        // Handle duplicate application error
        if (err.code === 11000) {
            return res.status(400).json({
                message: 'You have already applied to this project',
                success: false
            });
        }

        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get all applications for a specific project (Client only)
const getApplicationsByProject = async (req, res) => {
    try {
        const userId = req.user._id;
        const { projectId } = req.params;

        // Check if project exists and user is the owner
        const project = await ProjectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        if (project.clientId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'You are not authorized to view these applications',
                success: false
            });
        }

        const applications = await ApplicationModel.find({ projectId })
            .populate('freelancerId', 'name avatar rating totalReviews experienceLevel hourlyCharges location')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            applications,
            total: applications.length
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get all applications submitted by the freelancer
const getMyApplications = async (req, res) => {
    try {
        const freelancerId = req.user._id;
        const { status } = req.query;

        let query = { freelancerId };
        if (status) {
            query.status = status;
        }

        const applications = await ApplicationModel.find(query)
            .populate('projectId', 'title category budget duration thumbnail status')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            applications,
            total: applications.length
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get single application details
const getApplicationById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const application = await ApplicationModel.findById(id)
            .populate('projectId', 'title category budget duration clientId')
            .populate('freelancerId', 'name avatar rating totalReviews experienceLevel');

        if (!application) {
            return res.status(404).json({
                message: 'Application not found',
                success: false
            });
        }

        // Check authorization (either the freelancer or the client)
        const isFreelancer = application.freelancerId._id.toString() === userId.toString();
        const isClient = application.projectId.clientId.toString() === userId.toString();

        if (!isFreelancer && !isClient) {
            return res.status(403).json({
                message: 'You are not authorized to view this application',
                success: false
            });
        }

        res.status(200).json({
            success: true,
            application
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Update application status (Client only)
const updateApplicationStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { status, clientNotes } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid status. Must be either "accepted" or "rejected"',
                success: false
            });
        }

        const application = await ApplicationModel.findById(id)
            .populate('projectId');

        if (!application) {
            return res.status(404).json({
                message: 'Application not found',
                success: false
            });
        }

        // Check if user is the project owner
        if (application.projectId.clientId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'You are not authorized to update this application',
                success: false
            });
        }

        application.status = status;
        if (clientNotes) {
            application.clientNotes = clientNotes;
        }

        await application.save();

        // If accepted, create conversation, notify freelancer, and update project status
        if (status === 'accepted') {
            // Create conversation for chat
            let conversation = await ConversationModel.findOne({
                applicationId: application._id
            });

            if (!conversation) {
                conversation = new ConversationModel({
                    participants: [application.freelancerId, application.projectId.clientId],
                    projectId: application.projectId._id,
                    applicationId: application._id
                });
                await conversation.save();
            }

            const client = await UserModel.findById(userId).select('name');

            const freelancerNotification = {
                type: 'application_accepted',
                title: 'Application Accepted! 🎉',
                message: `${client?.name || 'A client'} accepted your proposal for "${application.projectId.title}". You can now connect in Messages.`,
                projectId: application.projectId._id,
                conversationId: conversation._id,
                read: false,
                createdAt: new Date()
            };

            await UserModel.findByIdAndUpdate(
                application.freelancerId,
                { $push: { notifications: freelancerNotification } }
            );

            const io = req.app.get('io');
            if (io) {
                io.to(`user:${application.freelancerId}`).emit('new-notification', freelancerNotification);
                io.to(`user:${application.freelancerId}`).emit('conversation-updated', {
                    conversationId: conversation._id,
                    lastMessage: conversation.lastMessage || null
                });
            }

            // Update project status
            // application.projectId.status = 'in-progress'; //should still be available in explore projects
            application.projectId.acceptedProposalId = application._id;
            await application.projectId.save();
        }

        await application.populate('freelancerId', 'name avatar email');

        res.status(200).json({
            message: `Application ${status} successfully`,
            success: true,
            application
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get pending applications count for client (for notifications)
const getPendingApplicationsCount = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get all projects owned by this client
        const projects = await ProjectModel.find({ clientId: userId }).select('_id');
        const projectIds = projects.map(p => p._id);

        // Count pending applications for all these projects
        const pendingCount = await ApplicationModel.countDocuments({
            projectId: { $in: projectIds },
            status: 'pending'
        });

        // Get recent pending applications (last 10)
        const recentApplications = await ApplicationModel.find({
            projectId: { $in: projectIds },
            status: 'pending'
        })
            .populate('freelancerId', 'name avatar')
            .populate('projectId', 'title')
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            pendingCount,
            recentApplications
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
    submitApplication,
    getApplicationsByProject,
    getMyApplications,
    getApplicationById,
    updateApplicationStatus,
    getPendingApplicationsCount
};

