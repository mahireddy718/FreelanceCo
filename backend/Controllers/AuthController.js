const bcrypt = require('bcrypt');
const UserModel = require('../Models/User');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Auto-generate username from email (part before @)
        const emailUsername = email.split('@')[0].toLowerCase();
        // Remove any characters that aren't allowed in usernames
        let generatedUsername = emailUsername.replace(/[^a-z0-9_-]/g, '');

        // Ensure username is at least 3 characters
        if (generatedUsername.length < 3) {
            generatedUsername = generatedUsername.padEnd(3, '0');
        }

        // Ensure username is not more than 20 characters
        if (generatedUsername.length > 20) {
            generatedUsername = generatedUsername.substring(0, 20);
        }

        // Check if email already exists
        const userByEmail = await UserModel.findOne({ email });
        if (userByEmail) {
            return res.status(409).json({
                message: 'User with this email already exists, you can login',
                success: false
            });
        }

        // Check if username already exists, if so, append a number
        let username = generatedUsername;
        let counter = 1;
        while (await UserModel.findOne({ username })) {
            username = `${generatedUsername}${counter}`;
            // Ensure the username with counter doesn't exceed 20 characters
            if (username.length > 20) {
                generatedUsername = generatedUsername.substring(0, 20 - counter.toString().length);
                username = `${generatedUsername}${counter}`;
            }
            counter++;
        }

        const userModel = new UserModel({
            name,
            email,
            password,
            username,
            role: role || 'freelancer' // Default to freelancer if not provided
        });
        userModel.password = await bcrypt.hash(password, 10);
        await userModel.save();
        res.status(201).json({
            message: "Signup successful",
            success: true
        });
    } catch (err) {
        // Handle mongoose validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: err.message,
                success: false
            });
        }
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for hardcoded admin credentials
        if (email === 'admin@prolancer.com' && password === 'admin123') {
            const jwtToken = jwt.sign(
                { email: email, _id: 'admin', isAdmin: true },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.status(200).json({
                message: "Admin login successful",
                success: true,
                jwtToken,
                email: email,
                name: 'Admin',
                username: 'admin',
                role: 'admin',
                userId: 'admin',
                isAdmin: true
            });
        }

        const user = await UserModel.findOne({ email });
        const errorMsg = 'Auth failed, email or password is wrong';
        if (!user) {
            return res.status(403).json({
                message: errorMsg,
                success: false
            });
        }
        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) {
            return res.status(403).json({
                message: errorMsg,
                success: false
            });
        }

        // Check if user is banned
        if (user.isBanned) {
            return res.status(403).json({
                message: 'Your account has been banned. Please contact support.',
                success: false,
                banned: true
            });
        }

        const jwtToken = jwt.sign(
            { email: user.email, _id: user._id, isAdmin: user.isAdmin || false },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login successful",
            success: true,
            jwtToken,
            email,
            name: user.name,
            username: user.username,
            role: user.role,
            userId: user._id,
            isAdmin: user.isAdmin || false
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

// Firebase account linking - check if email exists and link or create account
const firebaseAuth = async (req, res) => {
    try {
        const { email, name, firebaseUid, photoURL } = req.body;

        if (!email) {
            return res.status(400).json({
                message: 'Email is required',
                success: false
            });
        }

        // Check if user with this email already exists
        let user = await UserModel.findOne({ email });

        if (user) {
            // Check if user is banned
            if (user.isBanned) {
                return res.status(403).json({
                    message: 'Your account has been banned. Please contact support.',
                    success: false,
                    banned: true
                });
            }

            // User exists - link Firebase account
            // Update firebaseUid if not already set
            if (!user.firebaseUid) {
                user.firebaseUid = firebaseUid;
            }

            // Set avatar from Google photoURL if user doesn't have one
            if (!user.avatar && photoURL) {
                user.avatar = photoURL;
            }

            await user.save();

            // Generate JWT token for existing user
            const jwtToken = jwt.sign(
                { email: user.email, _id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.status(200).json({
                message: "Logged in with existing account",
                success: true,
                jwtToken,
                email: user.email,
                name: user.name,
                username: user.username,
                role: user.role,
                userId: user._id,
                linkedAccount: true
            });
        } else {
            // User doesn't exist - create new account
            const emailUsername = email.split('@')[0].toLowerCase();
            let generatedUsername = emailUsername.replace(/[^a-z0-9_-]/g, '');

            if (generatedUsername.length < 3) {
                generatedUsername = generatedUsername.padEnd(3, '0');
            }

            if (generatedUsername.length > 20) {
                generatedUsername = generatedUsername.substring(0, 20);
            }

            // Check if username already exists, if so, append a number
            let username = generatedUsername;
            let counter = 1;
            while (await UserModel.findOne({ username })) {
                username = `${generatedUsername}${counter}`;
                if (username.length > 20) {
                    generatedUsername = generatedUsername.substring(0, 20 - counter.toString().length);
                    username = `${generatedUsername}${counter}`;
                }
                counter++;
            }

            // Create new user with Firebase data
            const newUser = new UserModel({
                name: name || email.split('@')[0],
                email,
                username,
                firebaseUid,
                photoURL,
                avatar: photoURL || '', // Set avatar from Google photoURL
                role: 'freelancer', // Default role
                password: await bcrypt.hash(Math.random().toString(36), 10) // Random password for Firebase users
            });

            await newUser.save();

            const jwtToken = jwt.sign(
                { email: newUser.email, _id: newUser._id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.status(201).json({
                message: "Account created successfully",
                success: true,
                jwtToken,
                email: newUser.email,
                name: newUser.name,
                username: newUser.username,
                role: newUser.role,
                userId: newUser._id,
                newAccount: true
            });
        }
    } catch (err) {
        console.error('Firebase auth error:', err);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

// Update user role (for new Google users)
const updateRole = async (req, res) => {
    try {
        console.log('Update role request received');
        console.log('User from token:', req.user);
        console.log('Request body:', req.body);

        const userId = req.user._id;
        const { role } = req.body;

        if (!role || !['freelancer', 'client', 'both'].includes(role)) {
            console.log('Invalid role:', role);
            return res.status(400).json({
                message: 'Valid role is required',
                success: false
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        console.log('Updating user role from', user.role, 'to', role);
        user.role = role;
        await user.save();

        console.log('Role updated successfully');
        res.status(200).json({
            message: 'Role updated successfully',
            success: true,
            user: {
                userId: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Update role error:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: err.message
        });
    }
}

module.exports = {
    signup,
    login,
    firebaseAuth,
    updateRole
}
