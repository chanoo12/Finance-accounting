document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    // Demo credentials
    if (username === 'admin' && password === 'password123') {
        errorMsg.textContent = '';
        alert('Login successful!');
        // Redirect or further logic here
    } else {
        errorMsg.textContent =