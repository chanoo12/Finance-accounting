document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMsg = document.getElementById('errorMsg');

    if (password !== confirmPassword) {
        errorMsg.textContent = 'Passwords do not match.';
        return;
    }

    if (username.length < 3) {
        errorMsg.textContent = 'Username must be at least 3 characters.';
        return;
    }

    if (!email.includes('@')) {
        errorMsg.textContent = 'Please enter a valid email.';
        return;
    }

    errorMsg.textContent = '';
    alert('Sign up successful!');
    // Add further logic here (e.g., send data to