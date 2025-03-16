Vue.createApp({

    data: function() {
        return {
            currentPage: 'login',
            errors: {},

            username: '',
            plainPassword: '',

            newEmail: '',
            newUsername: '',
            newPassword: '',
            confirmPassword: '',
            signUpSuccess: false,

            trackers: [],
            newBrand: '',
            newModel: '',
            newSize: '',
            editMode: false,
            editTrackers: [],

            profile: {
                email: '',
                username: '',
                password: ''
            },
            editEmailMode: false,
            editUsernameMode: false,
            editPasswordMode: false,
        };
    },

    methods: {
        hasError: function (fieldName) {
            return fieldName in this.errors;
        },

        validateLogIn: function() {
            this.errors = {};

            if (this.username.length == 0) {
                this.errors.username = 'Please enter your username';
            }
            if (this.username.length == 0) {
                this.errors.plainPassword = 'Please enter your password';
            }
            return Object.keys(this.errors).length == 0;
        },

        logIn: function() {
            if (!this.validateLogIn()) {
                console.error("Log in failed");
                return;
            }

            let user = {
                username: this.username,
                plainPassword: this.plainPassword
            };

            fetch("https://mpforsalescraper.onrender.com/session", {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            }).then(response => {
                if (response.status === 201) {
                    this.username = '';
                    this.plainPassword = '';
                    this.signUpSuccess = false;
                    this.loadTrackersFromAPI();
                } else {
                    this.errors.login = "Invalid username or password";
                }
            });
        },

        goToSignUp: function() {
            this.username = '';
            this.plainPassword = '';
            this.currentPage = 'signup';
            this.errors = {};
            this.signUpSuccess = 'false';
        },

        logOut: function () {
            fetch("https://mpforsalescraper.onrender.com/session", {
                method: 'DELETE',
                credentials: 'include',
            }).then(response => {
                if (response.status === 200) {
                    this.currentPage = 'login';
                    this.errors = {};
                } else {
                    this.errors.logout = "Failed to log out"
                }
            });
        },

        validateSignUp: function () {
            this.errors = {};

            if (this.newEmail.length < 5 || this.newEmail.length > 30) {
                this.errors.newEmail = 'Please enter your email';
            }
            if (this.newUsername.length < 5 || this.newUsername.length > 20) {
                this.errors.newUsername = 'Please enter a username between 5-20 characters long';
            }
            if (this.newPassword.length < 8 || this.newPassword.length > 32) {
                this.errors.newPassword = 'Please enter a password between 8-32 characters long';
            }
            if (this.confirmPassword !== this.newPassword) {
                this.errors.confirmPassword = 'Your password confirmation does not match';
            }
            return Object.keys(this.errors).length == 0;
        },

        signUp: function() {
            if (!this.validateSignUp()) {
                console.error("Sign up failed")
                return;
            }

            let newUser = {
                newEmail: this.newEmail,
                newUsername: this.newUsername,
                newPassword: this.newPassword
            };

            fetch("https://mpforsalescraper.onrender.com/users", {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser)
            }).then(response => {
                if (response.status === 201) {
                    this.newEmail = '';
                    this.newUsername = '';
                    this.newPassword = '';
                    this.confirmPassword = '';
                    this.currentPage = 'login';
                    this.signUpSuccess = true;
                    this.errors = {};
                } else {
                    console.error('Failed to save profile');
                    this.errors.saveProfile = 'This username or email has already been taken.'
                }
            }).catch(error => {
                console.error('Error saving profile:', error);
            });
        },

        signUpCancel: function() {
            this.username = '';
            this.plainPassword = '';
            this.newEmail = '';
            this.newUsername = '';
            this.newPassword = '';
            this.confirmPassword = '';
            this.currentPage = 'login';
            this.errors = {};
        },

        loadProfile: function() {
            fetch("https://mpforsalescraper.onrender.com/session", {
                method: 'GET',
                credentials: 'include'
            }).then(response => {
                if (response.status === 200) {
                    response.json().then(user => {
                        this.profile.email = user.email;
                        this.profile.username = user.username;
                        this.profile.password = '';
                        this.profile.confirmPW = '';
                        this.errors = {};
                    });
                } else {
                    console.error('Failed to load profile');
                }
            }).catch(error => {
                console.error('Error loading profile:', error);
            });
        },

        toggleEditEmailMode: function() {
            this.editEmailMode = !this.editEmailMode;
        },

        toggleEditUsernameMode: function() {
            this.editUsernameMode = !this.editUsernameMode;
        },

        toggleEditPasswordMode: function() {
            this.editPasswordMode = !this.editPasswordMode;
        },

        validateSaveProfile: function () {
            this.errors = {};

            if (this.editEmailMode && (this.profile.email.length < 5 || this.profile.email.length > 30)) {
                this.errors.newEmail = 'Please enter your email';
            }
            if (this.editUsernameMode && (this.profile.username.length < 5 || this.profile.username.length > 20)) {
                this.errors.newUsername = 'Please enter a username between 5-20 characters long';
            }
            if (this.editPasswordMode && (this.profile.password.length < 8 || this.profile.password.length > 32)) {
                this.errors.newPassword = 'Please enter a password between 8-32 characters long';
            }
            if (this.editPasswordMode && (this.profile.confirmPW !== this.profile.password)) {
                this.errors.confirmPassword = 'Your password confirmation does not match';
            }
            return Object.keys(this.errors).length == 0;
        },

        saveProfile: function() {
            if (!this.validateSaveProfile()) {
                console.error("Save profile failed")
                return;
            }

            const updatedProfile = {
                email: this.profile.email,
                username: this.profile.username,
                password: this.profile.password
            };

            fetch("https://mpforsalescraper.onrender.com/users/:userId", {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedProfile)
            }).then(response => {
                if (response.status === 200) {
                    this.editEmailMode = false;
                    this.editUsernameMode = false;
                    this.editPasswordMode = false;
                    this.loadProfile();
                    this.errors = {};
                } else {
                    console.error('Failed to save profile');
                    this.errors.saveProfile = 'This username or email has already been taken.'
                }

            }).catch(error => {
                console.error('Error saving profile:', error);
            });
        },

        goToProfile: function() {
            this.editEmailMode = false;
            this.editUsernameMode = false;
            this.editPasswordMode = false;
            this.currentPage = 'profile';
            this.loadProfile();
            this.errors = {};
        },

        validateTracker: function() {
            this.errors = {};

            if (this.newBrand.length === 0 || this.newBrand.length > 20) {
                this.errors.newBrand = 'Please enter the shoe brand';
            }
            if (this.newModel.length === 0 || this.newBrand.length > 20) {
                this.errors.newModel = 'Please enter the shoe model';
            }
            if (this.newSize.length === 0 || this.newSize > 60 || this.newSize < 0) {
                this.errors.newSize = 'Please enter a valid shoe size';
            }

            return Object.keys(this.errors).length == 0;
        },

        addTracker: function() {
            if (!this.validateTracker()) {
                console.error("Add tracker failed")
                return;
            }

            let newTracker = {
                brand: this.newBrand,
                model: this.newModel,
                size: this.newSize
            };

            fetch("https://mpforsalescraper.onrender.com/trackers", {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTracker)
            }).then(response => {
                if (response.status === 201) {
                    this.newBrand = '';
                    this.newModel = '';
                    this.newSize = '';
                    this.loadTrackersFromAPI();
                    this.errors = {};
                } else {
                    this.errors.tracker = "Failed to save tracker. Make sure shoe size is a number";
                }
            });
        },

        editPage: function(tracker) {
            this.editTrackers = [tracker];
            this.editMode = true;
            this.currentPage = 'addTracker';

            this.newBrand = tracker.brand;
            this.newModel = tracker.model;
            this.newSize = tracker.size;
            this.errors = {};
        },

        editTracker: function() {
            if (!this.validateTracker()) {
                console.error("Add tracker failed")
                return;
            }

            const tracker = this.editTrackers[0];
            this.editTrackers = [];
            const updates = {
                brand: this.newBrand,
                model: this.newModel,
                size: this.newSize
            };

            fetch(`https://mpforsalescraper.onrender.com/trackers/${tracker._id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            }).then(response => {
                if (response.status === 200) {
                    console.log("Tracker updated successfully");
                    this.newBrand = '';
                    this.newModel = '';
                    this.newSize = '';
                    this.loadTrackersFromAPI();
                } else {
                    console.error("Failed to update tracker");
                    this.editPage(tracker)
                    this.errors.tracker = "Failed to save tracker. Make sure shoe size is a number";
                }
            }).catch(error => {
                console.error("Error updating tracker:", error);
            });
        },

        cancelEdit: function() {
            this.newBrand = '';
            this.newModel = '';
            this.newSize = '';
            this.loadTrackersFromAPI();
            this.errors = {};
        },

        toggleTracker: function(tracker) {
            fetch(`https://mpforsalescraper.onrender.com/trackers/${tracker._id}/toggle`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then(response => {
                if (response.status === 200) {
                    this.loadTrackersFromAPI();
                } else {
                    console.error ('Failed to toggle tracker');
                }
            }).catch(error => {
                console.error('Error toggling tracker:', error);
            });
        },

        deleteTracker: function(tracker) {
            console.log("delete ", tracker._id);
            fetch(`https://mpforsalescraper.onrender.com/trackers/${tracker._id}`, {
                method: 'DELETE',
                credentials: 'include'
            }).then(response => {
                console.log('Delete successful');
                this.loadTrackersFromAPI();
            });
        },

        loadTrackersFromAPI: function() {
            this.editMode = false;
            this.currentPage = 'dashboard';
            fetch("https://mpforsalescraper.onrender.com/trackers", {
                method: 'GET',
                credentials: 'include',
            }).then(response => {
                response.json().then(trackers => {
                    this.trackers = trackers;
                });
            });
        },

    },

    created: function () {
        console.log("App created");
    }

}).mount('#app');
