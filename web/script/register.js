// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Get DOM elements
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const isAdminCheckbox = document.getElementById('isAdmin');
    const termsCheckbox = document.getElementById('terms');
    const registerBtn = document.querySelector('.register-btn');
    const messageDiv = document.getElementById('message');
    const eyeIcon = document.getElementById('eye-icon');
    const confirmEyeIcon = document.getElementById('confirm-eye-icon');
    
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
    
    // Confirm password toggle functionality
    window.toggleConfirmPassword = function() {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        
        // Toggle eye icon
        if (type === 'text') {
            confirmEyeIcon.classList.remove('fa-eye');
            confirmEyeIcon.classList.add('fa-eye-slash');
        } else {
            confirmEyeIcon.classList.remove('fa-eye-slash');
            confirmEyeIcon.classList.add('fa-eye');
        }
    };
    
    // Form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        const isAdmin = isAdminCheckbox.checked;
        const termsAccepted = termsCheckbox.checked;
        
        // Validation
        if (!username || !password || !confirmPassword) {
            showMessage('Por favor, preencha todos os campos.', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem.', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }
        
        if (!termsAccepted) {
            showMessage('Você deve aceitar os termos de uso para continuar.', 'error');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        try {
            // Make API request
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ username, password, isAdmin })
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
                
                // Redirect to login page after successful registration
                setTimeout(() => { 
                    window.location.href = '/login'; 
                }, 2000);
            } else {
                showMessage(data.error || 'Falha no registro. Tente novamente.', 'error');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
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
            registerBtn.classList.add('loading');
            registerBtn.disabled = true;
        } else {
            registerBtn.classList.remove('loading');
            registerBtn.disabled = false;
        }
    }
    
    // Real-time password validation
    function validatePasswords() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Remove existing validation classes
        passwordInput.classList.remove('valid', 'invalid');
        confirmPasswordInput.classList.remove('valid', 'invalid');
        
        if (password.length > 0) {
            if (password.length >= 6) {
                passwordInput.classList.add('valid');
            } else {
                passwordInput.classList.add('invalid');
            }
        }
        
        if (confirmPassword.length > 0) {
            if (password === confirmPassword && password.length >= 6) {
                confirmPasswordInput.classList.add('valid');
            } else {
                confirmPasswordInput.classList.add('invalid');
            }
        }
    }
    
    // Add password validation listeners
    passwordInput.addEventListener('input', validatePasswords);
    confirmPasswordInput.addEventListener('input', validatePasswords);
    
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
    const formElements = document.querySelectorAll('.form-header, .form-group, .form-options, .register-btn, .login-link');
    
    formElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Add CSS for ripple effect and validation
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
        
        .form-group input.valid {
            border-color: var(--success-color);
            box-shadow: 0 0 0 3px rgba(56, 161, 105, 0.1);
        }
        
        .form-group input.invalid {
            border-color: var(--error-color);
            box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
        }
        
        .password-strength {
            margin-top: 0.5rem;
            font-size: 0.75rem;
            color: var(--text-secondary);
        }
        
        .strength-bar {
            height: 4px;
            background: var(--border-color);
            border-radius: 2px;
            margin-top: 0.25rem;
            overflow: hidden;
        }
        
        .strength-fill {
            height: 100%;
            transition: all 0.3s ease;
            border-radius: 2px;
        }
        
        .strength-weak .strength-fill {
            background: var(--error-color);
            width: 33%;
        }
        
        .strength-medium .strength-fill {
            background: #d69e2e;
            width: 66%;
        }
        
        .strength-strong .strength-fill {
            background: var(--success-color);
            width: 100%;
        }
    `;
    document.head.appendChild(style);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            registerForm.dispatchEvent(new Event('submit'));
        }
        
        // Escape to clear form
        if (e.key === 'Escape') {
            registerForm.reset();
            messageDiv.style.display = 'none';
            validatePasswords();
        }
    });
    
    // Add some fun interactions
    console.log('🚀 WaSolCRM Register Page loaded successfully!');
    console.log('💡 Dica: Use Ctrl+Enter para criar conta rapidamente');
    
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
    
    // Add password strength indicator
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
        
        if (password.length >= 6) score++;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score <= 2) return 'weak';
        if (score <= 4) return 'medium';
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
    
    // Add terms link functionality
    const termsLinks = document.querySelectorAll('.terms-link');
    termsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showMessage('Termos de uso e política de privacidade serão implementados em breve!', 'error');
        });
    });
    
    // Add some visual feedback for admin checkbox
    isAdminCheckbox.addEventListener('change', function() {
        if (this.checked) {
            showMessage('⚠️ Conta de administrador criada com privilégios especiais.', 'error');
        }
    });
    
}); 