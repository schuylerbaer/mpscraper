const model = require('./model');
const express = require('express');
const app = express();
const session = require('express-session');

// MIDDLEWARES

function authorizeUser(req, res, next) {
    console.log("Session:", req.session);
    console.log("userId:", req.session.userId);
    if (req.session && req.session.userId) {
        // user is authenticated
        model.User.findOne({
            _id: req.session.userId
        }).then(function (user) {
            req.user = user;
            next();
        });
    } else {
        // user is NOT authenticated
        res.sendStatus(401);
    }
}

app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: "aoi4u8yrthakejfhlakjh348fhalkdjfhffe8fjfjjfja89383812",
    saveUninitialized: true,
    resave: false
}));
app.use(express.static('public'));

// TRACKER ROUTES

app.get('/trackers', authorizeUser, function (req, res) {
    model.Tracker.find({
        user: req.user._id
    }).then((trackers) => {
        res.json(trackers);
    });
});

app.post('/trackers', authorizeUser, function (req, res) {
    console.log('Parsed request body:', req.body);
    let newTracker = new model.Tracker({
        brand: req.body.brand,
        model: req.body.model,
        size: req.body.size,
        user: req.user._id
    });
    newTracker.save().then(() => {
        // Tracker was saved successfully
        res.status(201).send("Created");
    }).catch((error) => {
        // Validate client inputs
        if (error.errors) {
            // There are mongoose validation errors
            let errorMessages = {};
            for (let field in error.errors) {
                errorMessages[field] = error.errors[field].message;
            }
            res.status(422).json({ error: 'Size must be a number' });
            console.log("Failed to validate", errorMessages);
        } else {
            // Something bad happened
            console.error("Failed to save tracker", error);
            res.sendStatus(500);
        }
    });
});

app.put('/trackers/:trackerId', authorizeUser, function(req, res) {
    const trackerId = req.params.trackerId;
    const updates = req.body;

    if (!updates.brand || !updates.model || !updates.size) {
        return res.status(400).json({ error: 'Please fill in all required fields' });
    }
    
    model.Tracker.findOneAndUpdate(
        { _id: trackerId, user: req.user._id },
        updates,
        { new: true }
    ).then(updatedTracker => {
        if (updatedTracker) {
            res.json(updatedTracker);
        } else {
            res.status(404).json({ error: 'Tracker not found' });
        }
    }).catch(error => {
        // Validate client inputs
        if (error.errors) {
            // There are mongoose validation errors
            let errorMessages = {};
            for (let field in error.errors) {
                errorMessages[field] = error.errors[field].message;
            }
            res.status(422).json(errorMessages);
            console.log("Failed to validate", errorMessages);
        } else {
            // Something bad happened
            console.error("Failed to save tracker", error);
            res.sendStatus(500);
        }
    });
});

app.put('/trackers/:trackerId/toggle', authorizeUser, function(req, res) {
    const trackerId = req.params.trackerId;

    model.Tracker.findOne({ _id: trackerId, user: req.user._id }).then(function(tracker) {
        if (tracker) {
            tracker.isActive = !tracker.isActive;
            tracker.save().then(() => {
                res.json(tracker);
            }).catch(error => {
                console.error('Error toggling tracker:', error);
                res.sendStatus(500);
            });
        } else {
            res.status(404).json({ error: 'Tracker not found' });
        }
    }).catch(error => {
        // Validate client inputs
        if (error.errors) {
            // There are mongoose validation errors
            let errorMessages = {};
            for (let field in error.errors) {
                errorMessages[field] = error.errors[field].message;
            }
            res.status(422).json(errorMessages);
            console.log("Failed to validate", errorMessages);
        } else {
            // Something bad happened
            console.error("Failed to save tracker", error);
            res.sendStatus(500);
        }
    });
});

app.delete('/trackers/:trackerId', authorizeUser, function(req, res) {
    // Does the tracker exist?
    model.Tracker.findOne({ _id: req.params.trackerId }).then(function(tracker) {
        if (tracker) {
            model.Tracker.deleteOne({ _id: req.params.trackerId }).then(function () {
                res.sendStatus(204);
            });
        } else {
            res.status(404).json({ error: 'Tracker not found' });
        }
    });
});

// USER ROUTES

app.post('/users', function (req, res) {
    console.log('Parsed request body:', req.body);
    let newUser = new model.User({
        email: req.body.newEmail,
        username: req.body.newUsername,
    });

    newUser.setEncryptedPassword(req.body.newPassword).then(function () {
        newUser.save().then(() => {
            res.status(201).send("Created");
        }).catch((error) => {
            // to do: validate clients inputs
            if (error.errors) {
                let errorMessages = {};
                for (let field in error.errors) {
                    errorMessages[field] = error.errors[field].message;
                }
                res.status(422).json(errorMessages);
            } else if (error.code == 11000) {
                // database uniqueness violation
                res.status(422).json({
                    email: 'That email is already registered',
                    username: 'That username is already registered'
                });
            } else {
                console.error("Failed to create user", error);
                res.sendStatus(500);
            }
        });
    }).catch(function () {
        // encrypted password has not been fulfilled
        console.error("Failed to create user", error);
        res.sendStatus(500);
    });
});

app.put('/users/:userId', authorizeUser, function(req, res) {
    const updates = req.body;

    model.User.findOne({ _id: req.user._id }).then(function(user) {
        if (user) {
            if (updates.email) user.email = updates.email;
            if (updates.username) user.username = updates.username;
            if (updates.password) {
                user.setEncryptedPassword(updates.password).then(function() {
                    user.save().then(() => {
                        res.status(200).send("Updated");
                    }).catch((error) => {
                        if (error.errors) {
                            let errorMessages = {};
                            for (let field in error.errors) {
                                errorMessages[field] = error.errors[field].message;
                            }
                            res.status(422).json(errorMessage);
                        } else if (error.code == 11000) {
                            res.status(422).json({
                                email: 'That email is already registered',
                                username: 'That username is already registered'
                            });
                        } else {
                            console.error("Failed to create user", error);
                            res.sendStatus(500);
                        }
                    });
                });
            } else {
                user.save().then(() => {
                    res.status(200).send("Updated");
                }).catch((error) => {
                    if (error.errors) {
                        let errorMessages = {};
                        for (let field in error.errors) {
                            errorMessages[field] = error.errors[field].message;
                        }
                        res.status(422).json(errorMessage);
                    } else if (error.code == 11000) {
                        res.status(422).json({
                            email: 'That email is already registered',
                            username: 'That username is already registered'
                        });
                    } else {
                        console.error("Failed to create user", error);
                        res.sendStatus(500);
                    }
                });
            }
        } else {
            res.status(404).send("Could not find account");
        }
    }).catch(error => {
        console.error('Error updating profile:', error);
        res.sendStatus(500);
    });
});

// SESSION ROUTES

app.get('/session', authorizeUser, function (req, res) {
    res.json(req.user);
});

app.post('/session', function (req, res) {
    console.log('Parsed request body:', req.body);

    model.User.findOne({
        username: req.body.username
    }).then(function (user) {
        if (user) {
            // if user exists, verify hashed password
            user.verifyEncryptedPassword(req.body.plainPassword).then(function (verified) {
                if (verified) {
                    // if verified, record user into the session (authenticated)
                    // save user to a session object
                    req.session.userId = user._id;
                    res.sendStatus(201);
                } else {
                    res.sendStatus(401);
                }
            });
        } else {
            res.sendStatus(401);
        }
    });
});

app.delete('/session', authorizeUser, function(req, res) {
    delete req.session.userId;
    res.sendStatus(200);
});

app.listen(8080, function () {
    console.log("Server ready. Listening on port 8080");
});
