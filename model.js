const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://se4200:i2SLBKRAWxONTYUa@cluster0.fgvw4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    dbName: 'shoeFinder'
});

const trackerSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const Tracker = mongoose.model('Tracker', trackerSchema);

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    username: {
        type: String,
        unique: true,
        required: true,
    },
    encryptedPassword: {
        type: String,
        required: true
    },
});

userSchema.methods.setEncryptedPassword = function (plainPassword) {
    let promise = new Promise((resolve, reject) => {
        bcrypt.hash(plainPassword, 12).then((hash) => {
            console.log('hashed pw:', hash);
            this.encryptedPassword = hash;
            resolve();
        });
    });
    return promise;
};

userSchema.methods.verifyEncryptedPassword = function (plainPassword) {
    let promise = new Promise((resolve, reject) => {
        bcrypt.compare(plainPassword, this.encryptedPassword).then(result => {
            resolve(result);
        });
    });
    return promise;
};

const User = mongoose.model('User', userSchema);

module.exports = {
    Tracker,
    User
};
