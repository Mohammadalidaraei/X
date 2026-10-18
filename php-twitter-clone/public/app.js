document.addEventListener('DOMContentLoaded', () => {
    // Ensure API requests work whether deployed at the root or in a subdirectory
    // We construct the API_URL based on the current location. Assuming public and api are siblings:
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    const API_URL = `${basePath}/../api`;

    // Elements
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const toggleAuthLink = document.getElementById('toggle-auth');
    const registerFields = document.getElementById('register-fields');
    const authError = document.getElementById('auth-error');

    const tweetsList = document.getElementById('tweets-list');
    const tweetContent = document.getElementById('tweet-content');
    const postTweetBtn = document.getElementById('post-tweet-btn');
    const tweetError = document.getElementById('tweet-error');
    const logoutBtn = document.getElementById('logout-btn');

    let isLoginMode = true;

    // Check Auth Status on Load
    checkAuthStatus();

    // Toggle Login/Register
    const toggleAuthHandler = (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        authError.textContent = '';

        if (isLoginMode) {
            authTitle.textContent = 'Happening now';
            authSubmitBtn.textContent = 'Log in';
            registerFields.style.display = 'none';
            document.getElementById('email').required = false;
            document.getElementById('full_name').required = false;
            toggleAuthLink.innerHTML = 'Sign up';
            toggleAuthLink.parentElement.innerHTML = `Don't have an account? <a href="#" id="toggle-auth">Sign up</a>`;
        } else {
            authTitle.textContent = 'Create your account';
            authSubmitBtn.textContent = 'Sign up';
            registerFields.style.display = 'block';
            document.getElementById('email').required = true;
            document.getElementById('full_name').required = true;
            toggleAuthLink.innerHTML = 'Log in';
            toggleAuthLink.parentElement.innerHTML = `Already have an account? <a href="#" id="toggle-auth">Log in</a>`;
        }

        // Re-attach listener as innerHTML rewrote it
        document.getElementById('toggle-auth').addEventListener('click', toggleAuthHandler);
    };

    toggleAuthLink.addEventListener('click', toggleAuthHandler);

    // Handle Auth Submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authError.textContent = '';

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        let url = `${API_URL}/login`;
        let payload = { username, password };

        if (!isLoginMode) {
            url = `${API_URL}/register`;
            payload.email = document.getElementById('email').value;
            payload.full_name = document.getElementById('full_name').value;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Authentication failed');

            if (!isLoginMode) {
                // Auto login after register
                alert('Registration successful! Please log in.');
                document.getElementById('toggle-auth').click();
            } else {
                showApp();
            }
        } catch (error) {
            authError.textContent = error.message;
        }
    });

    // Handle Logout
    logoutBtn.addEventListener('click', async () => {
        await fetch(`${API_URL}/logout`, { method: 'POST' });
        showAuth();
    });

    // Post a Tweet
    postTweetBtn.addEventListener('click', async () => {
        const content = tweetContent.value.trim();
        tweetError.textContent = '';

        if (!content) return;

        try {
            const response = await fetch(`${API_URL}/tweets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to post tweet');

            tweetContent.value = '';
            prependTweet(data); // Add new tweet to top of list
        } catch (error) {
            tweetError.textContent = error.message;
        }
    });

    // --- Helper Functions ---

    async function checkAuthStatus() {
        try {
            const response = await fetch(`${API_URL}/me`);
            if (response.ok) {
                const user = await response.json();
                document.getElementById('current-user-fullname').textContent = user.full_name;
                document.getElementById('current-user-username').textContent = `@${user.username}`;
                showApp();
            } else {
                showAuth();
            }
        } catch (error) {
            showAuth();
        }
    }

    function showAuth() {
        appContainer.style.display = 'none';
        authContainer.style.display = 'flex';
    }

    function showApp() {
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        loadTweets();
    }

    async function loadTweets() {
        try {
            const response = await fetch(`${API_URL}/tweets`);
            const tweets = await response.json();

            tweetsList.innerHTML = '';
            tweets.forEach(tweet => {
                tweetsList.appendChild(createTweetElement(tweet));
            });
        } catch (error) {
            console.error('Failed to load tweets');
        }
    }

    function prependTweet(tweet) {
        tweetsList.insertBefore(createTweetElement(tweet), tweetsList.firstChild);
    }

    function createTweetElement(tweet) {
        const div = document.createElement('div');
        div.className = 'tweet';

        // Ensure cross-browser date parsing by replacing space with 'T' if present
        const safeDateString = tweet.created_at.replace(' ', 'T');
        const date = new Date(safeDateString);
        const timeString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        div.innerHTML = `
            <div class="tweet-avatar">
                <i class="fas fa-user-circle fa-3x"></i>
            </div>
            <div class="tweet-content-wrapper">
                <div class="tweet-header">
                    <span class="tweet-author">${escapeHTML(tweet.full_name)}</span>
                    <span class="tweet-username">@${escapeHTML(tweet.username)}</span>
                    <span class="tweet-time">· ${timeString}</span>
                </div>
                <div class="tweet-text">
                    ${escapeHTML(tweet.content)}
                </div>
                <div class="tweet-actions">
                    <i class="far fa-comment"></i>
                    <i class="fas fa-retweet"></i>
                    <i class="far fa-heart"></i>
                    <i class="far fa-share-square"></i>
                </div>
            </div>
        `;
        return div;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
