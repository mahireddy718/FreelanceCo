const mongoose = require('mongoose');
const mongo_url = process.env.MONGO_CONN || process.env.MONGO_URI;

if (!mongo_url) {
    console.error('MongoDB Connection Error: missing MONGO_CONN or MONGO_URI in environment variables.');
} else {
    mongoose.connect(mongo_url).then(() => {
        console.log('MongoDB Connected...');
    }).catch((err) => {
        console.log('MongoDB Connection Error: ', err);
    });
}