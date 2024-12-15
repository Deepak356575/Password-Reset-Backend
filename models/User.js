const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {
    collection: 'users',  // explicitly set to 'users' collection
    timestamps: true
});

const User = mongoose.model('User', userSchema);

// Add this logging
console.log('Model collection name:', User.collection.name);
console.log('Model database:', mongoose.connection.db?.databaseName);

module.exports = User;
