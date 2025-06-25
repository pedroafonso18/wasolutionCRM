// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Check if user is already authenticated
    fetch('/api/user-info', { credentials: 'include' })
        .then(res => {
            if (res.ok) {
                // User is already logged in, redirect to chats
                window.location.href = '/chats';
                return;
            }
        })
        .catch(() => {
            // Not authenticated, continue with login form
        });
    
    // Get DOM elements
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('.login-btn');
    const messageDiv = document.getElementById('message');
    const eyeIcon = document.getElementById('eye-icon');
    
    // Password toggle functionality
    window.togglePassword = function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle eye icon
        if (type === 'text') {
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        } else {
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        }
    };
    
    // Form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Basic validation
        if (!username || !password) {
            showMessage('Por favor, preencha todos os campos.', 'error');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        try {
            // Make API request
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ username, password })
            });
            
            let data = {};
            try {
                data = await response.json();
            } catch (err) {
                showMessage('Resposta inesperada do servidor.', 'error');
                return;
            }
            
            if (response.ok && data.success) {
                showMessage(data.success, 'success');
                // Always redirect to /chats after login
                setTimeout(() => { 
                    window.location.href = '/chats'; 
                }, 1500);
            } else {
                showMessage(data.error || 'Falha no login. Verifique suas credenciais.', 'error');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Erro de conexão. Tente novamente.', 'error');
        } finally {
            setLoadingState(false);
        }
    });
    
    // Show message function
    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }
    
    // Set loading state
    function setLoadingState(loading) {
        if (loading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    }
    
    // Input focus effects
    const inputs = document.querySelectorAll('.form-group input');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
        
        // Add ripple effect on input
        input.addEventListener('click', function(e) {
            createRipple(e, this);
        });
    });
    
    // Create ripple effect
    function createRipple(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // Remember me functionality
    const rememberCheckbox = document.getElementById('remember');
    
    // Load saved state
    const savedUsername = localStorage.getItem('wasolcrm_username');
    const savedRemember = localStorage.getItem('wasolcrm_remember');
    
    if (savedRemember === 'true' && savedUsername) {
        usernameInput.value = savedUsername;
        rememberCheckbox.checked = true;
    }
    
    // Save state on form submission
    loginForm.addEventListener('submit', function() {
        if (rememberCheckbox.checked) {
            localStorage.setItem('wasolcrm_username', usernameInput.value);
            localStorage.setItem('wasolcrm_remember', 'true');
        } else {
            localStorage.removeItem('wasolcrm_username');
            localStorage.removeItem('wasolcrm_remember');
        }
    });
    
    // Add some fun animations
    const floatingCards = document.querySelectorAll('.floating-card');
    
    floatingCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.5}s`;
        
        // Add hover effect
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.05)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add entrance animations
    const formElements = document.querySelectorAll('.form-header, .form-group, .form-options, .login-btn, .signup-link');
    
    formElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Add CSS for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .form-group input {
            position: relative;
            overflow: hidden;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(37, 211, 102, 0.2);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .form-group.focused label {
            color: var(--primary-color);
        }
        
        .form-group.focused label i {
            transform: scale(1.1);
        }
        
        .floating-card {
            transition: transform 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
        
        // Escape to clear form
        if (e.key === 'Escape') {
            loginForm.reset();
            messageDiv.style.display = 'none';
        }
    });
    
    // Add some fun interactions
    console.log('🔐 WaSolCRM Login Page loaded successfully!');
    console.log('💡 Dica: Use Ctrl+Enter para fazer login rapidamente');
    
    // Easter egg - type "admin" in username field
    let adminTyped = '';
    usernameInput.addEventListener('keydown', function(e) {
        adminTyped += e.key.toLowerCase();
        if (adminTyped.includes('admin')) {
            console.log('🎉 Easter egg ativado! Você digitou "admin"!');
            adminTyped = '';
        }
        
        // Reset after 2 seconds of no typing
        setTimeout(() => {
            adminTyped = '';
        }, 2000);
    });
    
    // Add some visual feedback for password strength (future feature)
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        
        // Remove existing strength classes
        this.classList.remove('weak', 'medium', 'strong');
        
        if (password.length > 0) {
            this.classList.add(strength);
        }
    });
    
    function calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score <= 2) return 'weak';
        if (score <= 3) return 'medium';
        return 'strong';
    }
    
    // Add CSS for password strength
    const strengthStyle = document.createElement('style');
    strengthStyle.textContent = `
        .form-group input.weak {
            border-color: #e53e3e;
            box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
        }
        
        .form-group input.medium {
            border-color: #d69e2e;
            box-shadow: 0 0 0 3px rgba(214, 158, 46, 0.1);
        }
        
        .form-group input.strong {
            border-color: #38a169;
            box-shadow: 0 0 0 3px rgba(56, 161, 105, 0.1);
        }
    `;
    document.head.appendChild(strengthStyle);
    
}); 