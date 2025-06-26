document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    fetch('/api/user-info', { credentials: 'include' })
        .then(res => {
            if (!res.ok) {
                window.location.href = '/login';
                throw new Error('Not authenticated');
            }
            return res.json();
        })
        .then(userData => {
            console.log('User data:', userData);
            loadInstances();
        })
        .catch(error => {
            console.error('Authentication error:', error);
        });

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link, .nav-btn').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    let instances = [];
    let selectedInstanceId = null;

    const instancesList = document.getElementById('instancesList');
    const instancesContent = document.getElementById('instancesContent');
    const instancesHeader = document.getElementById('instancesHeader');

    // Modal elements
    const createInstanceModal = document.getElementById('createInstanceModal');
    const qrCodeModal = document.getElementById('qrCodeModal');
    const webhookModal = document.getElementById('webhookModal');
    const createInstanceBtn = document.getElementById('createInstanceBtn');
    const createInstanceForm = document.getElementById('createInstanceForm');
    const qrCodeImage = document.getElementById('qrCodeImage');

    // Debug modal elements
    console.log('Modal elements found:');
    console.log('createInstanceModal:', createInstanceModal);
    console.log('qrCodeModal:', qrCodeModal);
    console.log('webhookModal:', webhookModal);
    console.log('createInstanceBtn:', createInstanceBtn);
    console.log('createInstanceForm:', createInstanceForm);
    console.log('qrCodeImage:', qrCodeImage);

    // Add event listeners to QR code image for debugging
    if (qrCodeImage) {
        qrCodeImage.addEventListener('load', () => {
            console.log('QR code image loaded successfully');
            console.log('Image dimensions:', qrCodeImage.naturalWidth, 'x', qrCodeImage.naturalHeight);
        });
        
        qrCodeImage.addEventListener('error', (e) => {
            console.error('QR code image failed to load:', e);
        });
    }

    // Test function to manually show QR modal
    window.testQRModal = function() {
        console.log('Testing QR modal...');
        if (qrCodeModal) {
            qrCodeModal.style.display = 'flex';
            console.log('QR modal display set to:', qrCodeModal.style.display);
            console.log('QR modal computed style:', window.getComputedStyle(qrCodeModal).display);
        } else {
            console.error('QR modal not found!');
        }
    };

    // Create instance button
    if (createInstanceBtn) {
        createInstanceBtn.addEventListener('click', () => {
            createInstanceModal.style.display = 'flex';
        });
    }

    // Close modals when clicking outside
    [createInstanceModal, qrCodeModal, webhookModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    });

    // Close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            createInstanceModal.style.display = 'none';
            qrCodeModal.style.display = 'none';
            webhookModal.style.display = 'none';
        });
    });

    // Cancel buttons
    const cancelCreate = document.getElementById('cancelCreate');
    const cancelWebhook = document.getElementById('cancelWebhook');
    const closeQrModal = document.getElementById('closeQrModal');

    if (cancelCreate) {
        cancelCreate.addEventListener('click', () => {
            createInstanceModal.style.display = 'none';
        });
    }

    if (cancelWebhook) {
        cancelWebhook.addEventListener('click', () => {
            webhookModal.style.display = 'none';
        });
    }

    if (closeQrModal) {
        closeQrModal.addEventListener('click', () => {
            qrCodeModal.style.display = 'none';
        });
    }

    // Create instance form
    if (createInstanceForm) {
        createInstanceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(createInstanceForm);
            const data = {
                instanceId: formData.get('instanceId'),
                instanceName: formData.get('instanceName'),
                instanceType: formData.get('instanceType'),
                webhookUrl: formData.get('webhookUrl') || '',
                proxyUrl: formData.get('proxyUrl') || '',
                accessToken: formData.get('accessToken') || '',
                wabaId: formData.get('wabaId') || ''
            };

            // Show loading state
            const submitBtn = createInstanceForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';
            submitBtn.disabled = true;

            fetch('/api/instances/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(response => {
                console.log('Create instance response:', response);
                console.log('Response type:', typeof response);
                console.log('Response keys:', Object.keys(response));
                
                // Close the create instance modal first
                createInstanceModal.style.display = 'none';
                createInstanceForm.reset();
                
                // Check if response contains QR code and show it
                if (response.qrcode && response.qrcode.base64) {
                    console.log('Found QR code in response.qrcode.base64');
                    console.log('QR code length:', response.qrcode.base64.length);
                    console.log('QR code starts with data:', response.qrcode.base64.startsWith('data:'));
                    
                    // Show QR code modal with the base64 image
                    // Check if the base64 already includes the data URL prefix
                    const base64Data = response.qrcode.base64.startsWith('data:') 
                        ? response.qrcode.base64 
                        : `data:image/png;base64,${response.qrcode.base64}`;
                    
                    console.log('Final base64Data length:', base64Data.length);
                    console.log('Setting QR code image src...');
                    
                    qrCodeImage.src = base64Data;
                    console.log('QR code image src set to:', qrCodeImage.src.substring(0, 100) + '...');
                    
                    console.log('Showing QR modal...');
                    qrCodeModal.style.display = 'flex';
                    console.log('QR modal display style:', qrCodeModal.style.display);
                    
                    showNotification('Instância criada com sucesso! Escaneie o QR Code para conectar.', 'success');
                } else if (response.status_string && response.status_string.qrcode && response.status_string.qrcode.base64) {
                    console.log('Found QR code in response.status_string.qrcode.base64');
                    console.log('QR code length:', response.status_string.qrcode.base64.length);
                    console.log('QR code starts with data:', response.status_string.qrcode.base64.startsWith('data:'));
                    
                    // Show QR code modal with the base64 image
                    const base64Data = response.status_string.qrcode.base64.startsWith('data:') 
                        ? response.status_string.qrcode.base64 
                        : `data:image/png;base64,${response.status_string.qrcode.base64}`;
                    
                    console.log('Final base64Data length:', base64Data.length);
                    console.log('Setting QR code image src...');
                    
                    qrCodeImage.src = base64Data;
                    console.log('QR code image src set to:', qrCodeImage.src.substring(0, 100) + '...');
                    
                    console.log('Showing QR modal...');
                    qrCodeModal.style.display = 'flex';
                    console.log('QR modal display style:', qrCodeModal.style.display);
                    
                    showNotification('Instância criada com sucesso! Escaneie o QR Code para conectar.', 'success');
                } else if (response.data && response.data.QRCode) {
                    console.log('Found QR code in response.data.QRCode');
                    // Alternative QR code format
                    const base64Data = response.data.QRCode.startsWith('data:') 
                        ? response.data.QRCode 
                        : `data:image/png;base64,${response.data.QRCode}`;
                    qrCodeImage.src = base64Data;
                    qrCodeModal.style.display = 'flex';
                    showNotification('Instância criada com sucesso! Escaneie o QR Code para conectar.', 'success');
                } else {
                    console.log('No QR code found in response');
                    console.log('Available keys in response:', Object.keys(response));
                    if (response.status_string) {
                        console.log('Available keys in status_string:', Object.keys(response.status_string));
                    }
                    // No QR code in response, just show success message
                    showNotification('Instância criada com sucesso!', 'success');
                }
                
                loadInstances(); // Refresh instances list
            })
            .catch(error => {
                console.error('Error creating instance:', error);
                showNotification('Erro ao criar instância', 'error');
            })
            .finally(() => {
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });
    }

    // Webhook form
    const webhookForm = document.getElementById('webhookForm');
    if (webhookForm) {
        webhookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(webhookForm);
            const data = {
                instanceId: formData.get('instanceId'),
                webhookUrl: formData.get('webhookUrl')
            };

            // Show loading state
            const submitBtn = webhookForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Configurando...';
            submitBtn.disabled = true;

            fetch('/api/instances/webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(response => {
                console.log('Webhook config response:', response);
                webhookModal.style.display = 'none';
                webhookForm.reset();
                loadInstances(); // Refresh instances list
                
                if (response.success) {
                    showNotification('Webhook configurado com sucesso!', 'success');
                } else {
                    showNotification('Erro ao configurar webhook: ' + (response.error || 'Erro desconhecido'), 'error');
                }
            })
            .catch(error => {
                console.error('Error configuring webhook:', error);
                showNotification('Erro ao configurar webhook', 'error');
            })
            .finally(() => {
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });
    }

    function loadInstances() {
        const instancesList = document.getElementById('instancesList');
        if (!instancesList) return;

        instancesList.innerHTML = '<li style="text-align:center; padding:2rem; color:var(--text-light);">Carregando...</li>';

        fetch('/api/instances', { credentials: 'include' })
            .then(res => {
                console.log('Instances API response status:', res.status);
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('Instances data received:', data);
                if (!data || !data.instances || data.instances.length === 0) {
                    instances = [];
                } else {
                    instances = data.instances;
                }
                renderInstancesList();
            })
            .catch(error => {
                console.error('Error loading instances:', error);
                instancesList.innerHTML = '<li style="color:red; text-align:center; padding:2rem;">Erro ao carregar instâncias: ' + error.message + '</li>';
            });
    }

    function renderInstancesList() {
        const instancesList = document.getElementById('instancesList');
        if (!instancesList) return;

        if (!instances || instances.length === 0) {
            instancesList.innerHTML = '<li style="text-align:center; padding:2rem; color:var(--text-light);">Nenhuma instância encontrada</li>';
            return;
        }

        instancesList.innerHTML = '';
        instances.forEach(instance => {
            if (!instance) return;
            
            const instanceId = instance.instance_id || 'Unknown';
            const instanceName = instance.instance_name || instanceId;
            const isActive = instance.is_active || false;
            const instanceType = instance.instance_type || 'N/A';
            
            const li = document.createElement('li');
            li.className = (instanceId === selectedInstanceId) ? 'active' : '';
            
            let avatarColor = isActive ? '#51cf66' : '#ffd43b';
            let avatarIcon = isActive ? 'fas fa-check' : 'fas fa-clock';
            
            li.innerHTML = `
                <div class="instance-avatar" style="background: ${avatarColor};">
                    <i class="${avatarIcon}"></i>
                </div>
                <div class="instance-info">
                    <div class="instance-name">${instanceName}</div>
                    <div class="instance-status">${instanceType} • ${isActive ? 'Ativo' : 'Inativo'}</div>
                </div>
            `;
            li.addEventListener('click', () => {
                if (selectedInstanceId !== instanceId) {
                    selectedInstanceId = instanceId;
                    renderInstancesList();
                    loadInstanceDetails(instanceId, instanceName);
                }
            });
            instancesList.appendChild(li);
        });
    }

    function loadInstanceDetails(instanceId, instanceName) {
        console.log('Loading details for instance:', instanceId);
        
        // Update header
        const instanceTitle = instancesHeader.querySelector('.instance-title');
        if (instanceTitle) {
            instanceTitle.textContent = instanceName || instanceId;
        }
        
        // Find the selected instance
        const selectedInstance = instances.find(instance => instance.instance_id === instanceId);
        if (!selectedInstance) {
            instancesContent.innerHTML = '<div class="empty-state">Instância não encontrada</div>';
            return;
        }
        
        // Render instance details
        const isActive = selectedInstance.is_active || false;
        const instanceType = selectedInstance.instance_type || 'N/A';
        const webhookUrl = selectedInstance.webhook_url || 'Não configurado';
        
        instancesContent.innerHTML = `
            <div class="instance-details">
                <div class="detail-item">
                    <span class="detail-label">ID da Instância:</span>
                    <span class="detail-value">${selectedInstance.instance_id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Nome:</span>
                    <span class="detail-value">${selectedInstance.instance_name || selectedInstance.instance_id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Tipo:</span>
                    <span class="detail-value">${instanceType}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">${isActive ? 'Ativo' : 'Inativo'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Webhook:</span>
                    <span class="detail-value">${webhookUrl}</span>
                </div>
            </div>
            <div class="instance-actions">
                ${!isActive ? `
                <button class="btn btn-success btn-small" onclick="connectInstance('${selectedInstance.instance_id}')">
                    <i class="fas fa-link"></i> Conectar
                </button>
                ` : ''}
                <button class="btn btn-warning btn-small" onclick="configWebhook('${selectedInstance.instance_id}')">
                    <i class="fas fa-cog"></i> Webhook
                </button>
                ${isActive ? `
                <button class="btn btn-secondary btn-small" onclick="logoutInstance('${selectedInstance.instance_id}')">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
                ` : ''}
                <button class="btn btn-danger btn-small" onclick="deleteInstance('${selectedInstance.instance_id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
    }

    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add styles if not already present
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 12px;
                    padding: 1rem 1.5rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                    z-index: 3000;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    min-width: 300px;
                    animation: slideInRight 0.3s ease;
                }
                .notification-success {
                    border-left: 4px solid #22c55e;
                }
                .notification-error {
                    border-left: 4px solid #ef4444;
                }
                .notification-info {
                    border-left: 4px solid #3b82f6;
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex: 1;
                }
                .notification-content i {
                    font-size: 1.25rem;
                }
                .notification-success .notification-content i {
                    color: #22c55e;
                }
                .notification-error .notification-content i {
                    color: #ef4444;
                }
                .notification-info .notification-content i {
                    color: #3b82f6;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }
                .notification-close:hover {
                    background: #f3f4f6;
                    color: #374151;
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        });
    }

    // Global functions for instance actions
    window.connectInstance = function(instanceId) {
        fetch('/api/instances/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ instanceId: instanceId })
        })
        .then(res => res.json())
        .then(response => {
            console.log('Connect instance response:', response);
            
            // Check if response contains QR code and show it
            if (response.base64) {
                // Direct base64 response
                const base64Data = response.base64.startsWith('data:') 
                    ? response.base64 
                    : `data:image/png;base64,${response.base64}`;
                qrCodeImage.src = base64Data;
                qrCodeModal.style.display = 'flex';
                showNotification('QR Code gerado! Escaneie para conectar a instância.', 'success');
            } else if (response.data && response.data.QRCode) {
                // QR code in data.QRCode field
                const base64Data = response.data.QRCode.startsWith('data:') 
                    ? response.data.QRCode 
                    : `data:image/png;base64,${response.data.QRCode}`;
                qrCodeImage.src = base64Data;
                qrCodeModal.style.display = 'flex';
                showNotification('QR Code gerado! Escaneie para conectar a instância.', 'success');
            } else if (response.qrcode && response.qrcode.base64) {
                // QR code in qrcode.base64 field (same as create instance)
                const base64Data = response.qrcode.base64.startsWith('data:') 
                    ? response.qrcode.base64 
                    : `data:image/png;base64,${response.qrcode.base64}`;
                qrCodeImage.src = base64Data;
                qrCodeModal.style.display = 'flex';
                showNotification('QR Code gerado! Escaneie para conectar a instância.', 'success');
            } else {
                // No QR code in response
                showNotification('Solicitação de conexão enviada!', 'success');
            }
            
            loadInstances(); // Refresh instances list
        })
        .catch(error => {
            console.error('Error connecting instance:', error);
            showNotification('Erro ao conectar instância', 'error');
        });
    };

    window.configWebhook = function(instanceId) {
        document.getElementById('webhookInstanceId').value = instanceId;
        webhookModal.style.display = 'flex';
    };

    window.logoutInstance = function(instanceId) {
        if (confirm('Tem certeza que deseja fazer logout desta instância?')) {
            fetch('/api/instances/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ instanceId: instanceId })
            })
            .then(res => res.json())
            .then(response => {
                console.log('Logout instance response:', response);
                loadInstances(); // Refresh instances list
                
                if (response.success) {
                    showNotification('Logout solicitado com sucesso!', 'success');
                } else {
                    showNotification('Erro ao fazer logout: ' + (response.error || 'Erro desconhecido'), 'error');
                }
            })
            .catch(error => {
                console.error('Error logging out instance:', error);
                showNotification('Erro ao fazer logout', 'error');
            });
        }
    };

    window.deleteInstance = function(instanceId) {
        if (confirm('Tem certeza que deseja excluir esta instância? Esta ação não pode ser desfeita.')) {
            fetch('/api/instances/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ instanceId: instanceId })
            })
            .then(res => res.json())
            .then(response => {
                console.log('Delete instance response:', response);
                loadInstances(); // Refresh instances list
                
                if (response.success) {
                    showNotification('Instância excluída com sucesso!', 'success');
                } else {
                    showNotification('Erro ao excluir instância: ' + (response.error || 'Erro desconhecido'), 'error');
                }
            })
            .catch(error => {
                console.error('Error deleting instance:', error);
                showNotification('Erro ao excluir instância', 'error');
            });
        }
    };

    // Auto-refresh instances every 30 seconds
    setInterval(loadInstances, 30000);
}); 