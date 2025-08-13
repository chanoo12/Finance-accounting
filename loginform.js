document.getElementById('loginForm').addEventListener('submit', login);
function login(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    const correctusername = 'admin';    
    const correctpassword = 'admin';

    if (username === correctusername && password === correctpassword) {
        errorMsg.textContent = '';
        window.location.href = 'dashboard.html'; 
    } else {
        errorMsg.textContent = 'Invalid username or password. Please try again.';
    }
}

document.getElementById('errorMsg').style.color = 'red';