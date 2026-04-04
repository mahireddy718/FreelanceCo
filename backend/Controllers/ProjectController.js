const ProjectModel = require('../Models/Project');
const UserModel = require('../Models/User');

// Create new project (Client only)
const createProject = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            title,
            description,
            category,
            budget,
            duration,
            skillsRequired,
            deadline,
            tags,
            visibility,
            thumbnail,
            images
        } = req.body;

        // Validate required fields
        if (!title || !description || !category || !budget || !duration) {
            return res.status(400).json({
                message: 'Please provide all required fields',
                success: false
            });
        }

        // Check user role
        const user = await UserModel.findById(userId);
        if (user.role !== 'client' && user.role !== 'both') {
            return res.status(403).json({
                message: 'Only clients can post projects',
                success: false
            });
        }

        const project = new ProjectModel({
            title,
            description,
            category,
            budget,
            duration,
            skillsRequired: skillsRequired || [],
            clientId: userId,
            deadline: deadline || null,
            tags: tags || [],
            visibility: visibility || 'public',
            thumbnail: thumbnail || '',
            images: images || []
        });

        await project.save();

        res.status(201).json({
            message: 'Project created successfully',
            success: true,
            project
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get all projects (with filters)
const getAllProjects = async (req, res) => {
    try {
        const {
            category,
            minBudget,
            maxBudget,
            skills,
            search,
            status = 'open',
            page = 1,
            limit = 20
        } = req.query;

        let query = { status, visibility: 'public' };

        // Category filter
        if (category) {
            query.category = category;
        }

        // Budget filter
        if (minBudget || maxBudget) {
            query['budget.min'] = {};
            if (minBudget) query['budget.min'].$gte = Number(minBudget);
            if (maxBudget) query['budget.max'] = { $lte: Number(maxBudget) };
        }

        // Skills filter
        if (skills) {
            const skillsArray = skills.split(',').map(s => s.trim());
            query.skillsRequired = { $in: skillsArray };
        }

        // Search filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const projects = await ProjectModel.find(query)
            .populate('clientId', 'name avatar rating totalReviews location username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await ProjectModel.countDocuments(query);

        res.status(200).json({
            success: true,
            projects,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get project by ID
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id; // May be undefined for non-authenticated users

        const project = await ProjectModel.findById(id)
            .populate('clientId', 'name avatar rating totalReviews location email username');

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Only increment view count if user is authenticated and hasn't viewed before
        if (userId) {
            const hasViewed = project.viewedBy.some(
                viewerId => viewerId.toString() === userId.toString()
            );

            if (!hasViewed) {
                // Add user to viewedBy array and increment count
                project.viewedBy.push(userId);
                project.viewCount += 1;
                await project.save();
            }
        } else {
            // For non-authenticated users, increment count on every view
            // (or you could skip incrementing for anonymous users)
            project.viewCount += 1;
            await project.save();
        }

        res.status(200).json({
            success: true,
            project
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get user's posted projects (Client) and assigned projects (Freelancer)
const getMyProjects = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, role } = req.query;

        let query = {};

        // If role is specified, filter by that role
        if (role === 'client') {
            query.clientId = userId;
        } else if (role === 'freelancer') {
            query.assignedFreelancerId = userId;
        } else {
            // Default: show both client projects and assigned projects
            query.$or = [
                { clientId: userId },
                { assignedFreelancerId: userId }
            ];
        }

        if (status) {
            query.status = status;
        }

        const projects = await ProjectModel.find(query)
            .populate('clientId', 'name avatar')
            .populate('assignedFreelancerId', 'name avatar')
            .sort({ createdAt: -1 });

        // Add pending application count to each project
        const ApplicationModel = require('../Models/Application');
        const projectsWithPendingCount = await Promise.all(
            projects.map(async (project) => {
                const projectObj = project.toObject();
                // Count only pending applications for this project
                const pendingCount = await ApplicationModel.countDocuments({
                    projectId: project._id,
                    status: 'pending'
                });
                projectObj.pendingApplicationCount = pendingCount;
                return projectObj;
            })
        );

        res.status(200).json({
            success: true,
            projects: projectsWithPendingCount
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Update project
const updateProject = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const project = await ProjectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Check ownership
        if (project.clientId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'You are not authorized to update this project',
                success: false
            });
        }

        const updateData = req.body;
        // Prevent updating certain fields
        delete updateData.clientId;
        delete updateData.proposalCount;

        const updatedProject = await ProjectModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Project updated successfully',
            success: true,
            project: updatedProject
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Delete project
const deleteProject = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const project = await ProjectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Check ownership
        if (project.clientId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'You are not authorized to delete this project',
                success: false
            });
        }

        await ProjectModel.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Project deleted successfully',
            success: true
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get project workspace (Freelancer or Client)
const getProjectWorkspace = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const project = await ProjectModel.findById(id)
            .populate('clientId', 'name avatar email')
            .populate('assignedFreelancerId', 'name avatar email');

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Check if user is assigned freelancer or client
        const isFreelancer = project.assignedFreelancerId &&
            project.assignedFreelancerId._id.toString() === userId.toString();
        const isClient = project.clientId._id.toString() === userId.toString();

        if (!isFreelancer && !isClient) {
            return res.status(403).json({
                message: 'You are not authorized to access this workspace',
                success: false
            });
        }

        res.status(200).json({
            success: true,
            project,
            userRole: isFreelancer ? 'freelancer' : 'client'
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Update work status
const updateWorkStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { workStatus, isRollback } = req.body;

        const project = await ProjectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Only assigned freelancer can update
        if (!project.assignedFreelancerId ||
            project.assignedFreelancerId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only assigned freelancer can update work status',
                success: false
            });
        }

        // Update status
        project.workStatus = workStatus;

        if (isRollback) {
            // For rollback, remove phases after the selected one
            const WORK_PHASES = ['planning', 'designing', 'development', 'testing', 'review', 'completed'];
            const targetPhaseIndex = WORK_PHASES.indexOf(workStatus);

            // Keep only phases up to and including the target phase
            project.phaseHistory = project.phaseHistory.filter(entry => {
                const entryPhaseIndex = WORK_PHASES.indexOf(entry.phase);
                return entryPhaseIndex <= targetPhaseIndex;
            });
        } else {
            // Forward progress - add new phase entry
            project.phaseHistory.push({
                phase: workStatus,
                completedAt: new Date()
            });
        }

        await project.save();

        // Create system message in chat to show status update
        const ConversationModel = require('../Models/Conversation');
        const MessageModel = require('../Models/Message');

        // Find conversation for this project
        const conversation = await ConversationModel.findOne({ projectId: id });

        if (conversation) {
            const phaseLabels = {
                'planning': 'Planning Phase',
                'designing': 'Design Phase',
                'development': 'Development Phase',
                'testing': 'Testing Phase',
                'review': 'Review Phase',
                'completed': 'Completed'
            };

            const label = phaseLabels[workStatus] || workStatus;

            const systemMessageContent = isRollback
                ? `Status rolled back to: ${label}`
                : `Project Status Update: Now in ${label}`;

            const systemMessage = new MessageModel({
                conversationId: conversation._id,
                content: systemMessageContent,
                messageType: 'system'
            });

            await systemMessage.save();

            // Broadcast system message to chat via socket
            const io = req.app.get('io');
            if (io) {
                io.to(`project:${id}`).emit('work-status-updated', {
                    projectId: id,
                    workStatus,
                    phaseHistory: project.phaseHistory
                });

                io.to(`conversation:${conversation._id}`).emit('new-message', {
                    message: systemMessage,
                    conversationId: conversation._id
                });
            }
        } else {
            // Still emit the project event even if no conversation found
            const io = req.app.get('io');
            if (io) {
                io.to(`project:${id}`).emit('work-status-updated', {
                    projectId: id,
                    workStatus,
                    phaseHistory: project.phaseHistory
                });
            }
        }

        res.status(200).json({
            message: isRollback ? 'Status rolled back successfully' : 'Work status updated successfully',
            success: true,
            workStatus: project.workStatus
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Add milestone
const addMilestone = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { title, description, dueDate } = req.body;

        const project = await ProjectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        if (!project.assignedFreelancerId ||
            project.assignedFreelancerId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only assigned freelancer can add milestones',
                success: false
            });
        }

        const milestone = {
            title,
            description,
            dueDate: dueDate ? new Date(dueDate) : null,
            status: 'pending'
        };

        project.milestones.push(milestone);
        await project.save();

        const addedMilestone = project.milestones[project.milestones.length - 1];

        // Emit Socket.io event
        const io = req.app.get('io');
        if (io) {
            io.to(`project:${id}`).emit('milestone-added', {
                projectId: id,
                milestone: addedMilestone
            });
        }

        res.status(201).json({
            message: 'Milestone added successfully',
            success: true,
            milestone: addedMilestone
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Update milestone
const updateMilestone = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id, milestoneId } = req.params;
        const { status, title, description, dueDate } = req.body;

        const project = await ProjectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        if (!project.assignedFreelancerId ||
            project.assignedFreelancerId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only assigned freelancer can update milestones',
                success: false
            });
        }

        const milestone = project.milestones.id(milestoneId);
        if (!milestone) {
            return res.status(404).json({
                message: 'Milestone not found',
                success: false
            });
        }

        if (title) milestone.title = title;
        if (description) milestone.description = description;
        if (dueDate) milestone.dueDate = new Date(dueDate);
        if (status) {
            milestone.status = status;
            if (status === 'completed') {
                milestone.completedAt = new Date();
            }
        }

        await project.save();

        // Emit Socket.io event
        const io = req.app.get('io');
        if (io) {
            io.to(`project:${id}`).emit('milestone-updated', {
                projectId: id,
                milestone
            });
        }

        res.status(200).json({
            message: 'Milestone updated successfully',
            success: true,
            milestone
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Add deliverable
const addDeliverable = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { title, description, fileUrl, fileName, fileSize, deliverableType } = req.body;

        if (!title || !fileUrl) {
            return res.status(400).json({
                message: 'Title and file URL are required',
                success: false
            });
        }

        // Validate deliverableType if provided
        if (deliverableType && !['demo', 'final'].includes(deliverableType)) {
            return res.status(400).json({
                message: 'Invalid deliverable type. Must be "demo" or "final"',
                success: false
            });
        }

        const project = await ProjectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Only assigned freelancer can add deliverables
        if (project.assignedFreelancerId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only assigned freelancer can add deliverables',
                success: false
            });
        }

        const deliverable = {
            title,
            description,
            fileUrl,
            fileName,
            fileSize,
            deliverableType: deliverableType || 'final', // Default to 'final' for backward compatibility
            uploadedAt: new Date()
        };

        project.deliverables.push(deliverable);
        await project.save();

        const addedDeliverable = project.deliverables[project.deliverables.length - 1];

        // Emit Socket.io event
        const io = req.app.get('io');
        if (io) {
            io.to(`project:${id}`).emit('deliverable-added', {
                projectId: id,
                deliverable: addedDeliverable
            });
        }

        res.status(201).json({
            message: 'Deliverable added successfully',
            success: true,
            deliverable: addedDeliverable
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Add work note
const addWorkNote = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { note } = req.body;

        const project = await ProjectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        if (!project.assignedFreelancerId ||
            project.assignedFreelancerId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only assigned freelancer can add work notes',
                success: false
            });
        }

        const workNote = { note };
        project.workNotes.push(workNote);
        await project.save();

        const addedNote = project.workNotes[project.workNotes.length - 1];

        // Emit Socket.io event
        const io = req.app.get('io');
        if (io) {
            io.to(`project:${id}`).emit('work-note-added', {
                projectId: id,
                workNote: addedNote
            });
        }

        res.status(201).json({
            message: 'Work note added successfully',
            success: true,
            workNote: addedNote
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Delete a deliverable
const deleteDeliverable = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id, deliverableId } = req.params;

        const project = await ProjectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Only assigned freelancer can delete deliverables
        if (!project.assignedFreelancerId ||
            project.assignedFreelancerId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only assigned freelancer can delete deliverables',
                success: false
            });
        }

        // Find and remove the deliverable
        const deliverableIndex = project.deliverables.findIndex(
            d => d._id.toString() === deliverableId
        );

        if (deliverableIndex === -1) {
            return res.status(404).json({
                message: 'Deliverable not found',
                success: false
            });
        }

        project.deliverables.splice(deliverableIndex, 1);
        await project.save();

        // Emit Socket.io event
        const io = req.app.get('io');
        if (io) {
            io.to(`project:${id}`).emit('deliverable-deleted', {
                projectId: id,
                deliverableId
            });
        }

        res.status(200).json({
            message: 'Deliverable deleted successfully',
            success: true,
            project
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Update progress percentage
const updateProgress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { progressPercentage } = req.body;

        const project = await ProjectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        if (!project.assignedFreelancerId ||
            project.assignedFreelancerId.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only assigned freelancer can update progress',
                success: false
            });
        }

        project.progressPercentage = Math.min(100, Math.max(0, progressPercentage));
        await project.save();

        // Emit Socket.io event
        const io = req.app.get('io');
        if (io) {
            io.to(`project:${id}`).emit('progress-updated', {
                projectId: id,
                progressPercentage: project.progressPercentage
            });
        }

        res.status(200).json({
            message: 'Progress updated successfully',
            success: true,
            progressPercentage: project.progressPercentage
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Submit completed work to client
const submitWork = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const project = await ProjectModel.findById(id)
            .populate('assignedFreelancerId', 'name')
            .populate('clientId', 'name');

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Only assigned freelancer can submit
        if (!project.assignedFreelancerId ||
            project.assignedFreelancerId._id.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only assigned freelancer can submit work',
                success: false
            });
        }

        // Validate that work status is completed
        if (project.workStatus !== 'completed') {
            return res.status(400).json({
                message: 'Project work status must be completed before submitting',
                success: false
            });
        }

        // Validate that there's at least one deliverable
        if (!project.deliverables || project.deliverables.length === 0) {
            return res.status(400).json({
                message: 'Please add at least one demo and one final deliverable before submitting work',
                success: false
            });
        }

        // Validate that both demo and final deliverables exist
        const hasDemoDeliverable = project.deliverables.some(d => d.deliverableType === 'demo');
        const hasFinalDeliverable = project.deliverables.some(d => d.deliverableType === 'final');

        if (!hasDemoDeliverable) {
            return res.status(400).json({
                message: 'Please upload at least one DEMO deliverable (preview for client review) before submitting work',
                success: false
            });
        }

        if (!hasFinalDeliverable) {
            return res.status(400).json({
                message: 'Please upload at least one FINAL deliverable (complete work for after payment) before submitting work',
                success: false
            });
        }

        // Mark project as completed
        project.status = 'completed';
        await project.save();

        // Create notification for client
        const clientNotification = {
            type: 'project_completed',
            title: 'Work Submitted',
            message: `${project.assignedFreelancerId.name || 'Freelancer'} has completed and submitted work for "${project.title}"`,
            projectId: project._id,
            read: false,
            createdAt: new Date()
        };

        // Add notification to client's notifications array in User model
        await UserModel.findByIdAndUpdate(
            project.clientId,
            { $push: { notifications: clientNotification } },
            { new: true }
        );

        // Emit Socket.io event
        const io = req.app.get('io');
        if (io) {
            console.log(`Emitting work-submitted event to project:${id}`);
            io.to(`project:${id}`).emit('work-submitted', {
                projectId: id.toString(),
                status: 'completed'
            });
            // Send notification to client
            console.log(`Sending notification to user:${project.clientId}`);
            io.to(`user:${project.clientId}`).emit('new-notification', clientNotification);
        }

        res.status(200).json({
            message: 'Work submitted successfully',
            success: true,
            project: {
                id: project._id,
                status: project.status,
                workStatus: project.workStatus
            }
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Client accepts project and closes it (after payment)
const acceptProject = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const project = await ProjectModel.findById(id)
            .populate('clientId', 'name')
            .populate('assignedFreelancerId', 'name');

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Only client can accept
        if (project.clientId._id.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only the project client can accept and close the project',
                success: false
            });
        }

        // Validate project is ready to be accepted
        if (project.status !== 'completed') {
            return res.status(400).json({
                message: 'Project must be completed before accepting',
                success: false
            });
        }

        // Validate deliverables exist
        if (!project.deliverables || project.deliverables.length === 0) {
            return res.status(400).json({
                message: 'No deliverables to accept',
                success: false
            });
        }

        // Check if payment is required and completed
        const PaymentModel = require('../Models/Payment');
        const payment = await PaymentModel.findOne({
            projectId: id,
            status: 'captured',
            verified: true
        });

        if (!payment) {
            return res.status(400).json({
                message: 'Payment must be completed before accepting the project',
                success: false,
                requiresPayment: true
            });
        }

        // Mark as closed
        project.status = 'closed';
        await project.save();

        // Create notification for freelancer
        const freelancerNotification = {
            type: 'project_accepted',
            title: 'Project Accepted',
            message: `${project.clientId.name || 'Client'} has accepted your work for "${project.title}" and closed the project`,
            projectId: project._id,
            read: false,
            createdAt: new Date()
        };

        // Add notification to freelancer's notifications array
        await UserModel.findByIdAndUpdate(
            project.assignedFreelancerId,
            { $push: { notifications: freelancerNotification } },
            { new: true }
        );

        // Emit Socket.io event
        const io = req.app.get('io');
        if (io) {
            io.to(`project:${id}`).emit('project-accepted', {
                projectId: id,
                status: 'closed'
            });
            // Send notification to freelancer
            io.to(`user:${project.assignedFreelancerId}`).emit('new-notification', freelancerNotification);
        }

        res.status(200).json({
            message: 'Project accepted and closed successfully',
            success: true,
            project: {
                id: project._id,
                status: project.status
            }
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Client requests review/changes on completed work
const requestReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { comments } = req.body;

        const project = await ProjectModel.findById(id)
            .populate('clientId', 'name')
            .populate('assignedFreelancerId', 'name');

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                success: false
            });
        }

        // Only client can request review
        if (project.clientId._id.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'Only the project client can request review',
                success: false
            });
        }

        // Validate project is in completed status
        if (project.status !== 'completed') {
            return res.status(400).json({
                message: 'Project must be completed before requesting review',
                success: false
            });
        }

        // Send back to review phase
        project.workStatus = 'review';
        project.status = 'in-progress';
        await project.save();

        // Create notification for freelancer
        const freelancerNotification = {
            type: 'review_requested',
            title: 'Review Requested',
            message: `${project.clientId.name || 'Client'} has requested changes on "${project.title}"${comments ? ': ' + comments : ''}`,
            projectId: project._id,
            read: false,
            createdAt: new Date()
        };

        // Add notification to freelancer's notifications array
        await UserModel.findByIdAndUpdate(
            project.assignedFreelancerId._id,
            { $push: { notifications: freelancerNotification } },
            { new: true }
        );

        // Emit Socket.io event
        const io = req.app.get('io');
        if (io) {
            io.to(`project:${id}`).emit('review-requested', {
                projectId: id,
                status: 'in-progress',
                workStatus: 'review',
                comments
            });
            // Send notification to freelancer
            io.to(`user:${project.assignedFreelancerId._id}`).emit('new-notification', freelancerNotification);
        }

        res.status(200).json({
            message: 'Review requested successfully',
            success: true,
            project: {
                id: project._id,
                status: project.status,
                workStatus: project.workStatus
            }
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
    createProject,
    getAllProjects,
    getProjectById,
    getMyProjects,
    updateProject,
    deleteProject,
    getProjectWorkspace,
    updateWorkStatus,
    submitWork,
    acceptProject,
    requestReview,
    addMilestone,
    updateMilestone,
    addDeliverable,
    deleteDeliverable,
    addWorkNote,
    updateProgress
};
