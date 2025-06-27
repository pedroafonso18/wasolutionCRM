// Global variables
let contacts = [];
let instances = [];
let selectedContactId = null;

// DOM elements
const contactsList = document.getElementById('contactsList');
const addContactBtn = document.getElementById('addContactBtn');
const addContactModal = document.getElementById('addContactModal');
const addContactForm = document.getElementById('addContactForm');
const startChatModal = document.getElementById('startChatModal');
const startChatForm = document.getElementById('startChatForm');
const chatInstanceSelect = document.getElementById('chatInstance');
const chatContactSelect = document.getElementById('chatContact');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and user role first
    fetch('/api/user-info', { credentials: 'include' })
        .then(res => {
            if (!res.ok) {
                // If not authenticated, redirect to login
                window.location.href = '/login';
                throw new Error('Not authenticated');
            }
            return res.json();
        })
        .then(userData => {
            console.log('User data:', userData);
            
            // Only show start chat functionality for admins
            if (userData && userData.isAdmin) {
                // Show start chat buttons for admins
                const startChatButtons = document.querySelectorAll('.btn-success');
                startChatButtons.forEach(btn => {
                    if (btn.textContent.includes('Chat')) {
                        btn.style.display = 'inline-block';
                    }
                });
            } else {
                // Hide start chat buttons for non-admin users
                const startChatButtons = document.querySelectorAll('.btn-success');
                startChatButtons.forEach(btn => {
                    if (btn.textContent.includes('Chat')) {
                        btn.style.display = 'none';
                    }
                });
            }
            
            // Load data
            loadContacts();
            loadInstances();
            setupEventListeners();
        })
        .catch(error => {
            console.error('Authentication error:', error);
            // Don't redirect here as it might cause loops
        });
});

// Setup event listeners
function setupEventListeners() {
    // Add contact button
    if (addContactBtn) {
        addContactBtn.addEventListener('click', () => {
            addContactModal.style.display = 'flex';
        });
    }

    // Add contact form
    if (addContactForm) {
        addContactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addContact();
        });
    }

    // Start chat form
    if (startChatForm) {
        startChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            startChat();
        });
    }

    // Modal close buttons
    const addContactModalClose = document.getElementById('addContactModalClose');
    const startChatModalClose = document.getElementById('startChatModalClose');
    const addContactCancel = document.getElementById('addContactCancel');
    const startChatCancel = document.getElementById('startChatCancel');
    const addContactConfirm = document.getElementById('addContactConfirm');
    const startChatConfirm = document.getElementById('startChatConfirm');

    // Close modals when clicking outside
    [addContactModal, startChatModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    });

    // Close buttons
    if (addContactModalClose) {
        addContactModalClose.addEventListener('click', () => {
            addContactModal.style.display = 'none';
        });
    }

    if (startChatModalClose) {
        startChatModalClose.addEventListener('click', () => {
            startChatModal.style.display = 'none';
        });
    }

    // Cancel buttons
    if (addContactCancel) {
        addContactCancel.addEventListener('click', () => {
            addContactModal.style.display = 'none';
            addContactForm.reset();
        });
    }

    if (startChatCancel) {
        startChatCancel.addEventListener('click', () => {
            startChatModal.style.display = 'none';
            startChatForm.reset();
        });
    }

    // Confirm buttons
    if (addContactConfirm) {
        addContactConfirm.addEventListener('click', () => {
            addContact();
        });
    }

    if (startChatConfirm) {
        startChatConfirm.addEventListener('click', () => {
            startChat();
        });
    }
}

// Load contacts from API
async function loadContacts() {
    try {
        const response = await fetch('/api/contacts', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            contacts = data.contacts || [];
            renderContacts();
        } else {
            showNotification('Erro ao carregar contatos', 'error');
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
        showNotification('Erro ao carregar contatos', 'error');
    }
}

// Load instances from API
async function loadInstances() {
    console.log('loadInstances called');
    try {
        const response = await fetch('/api/instances', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        console.log('Instances API response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Instances API response data:', data);
        
        // Fix: Handle the correct response structure
        if (data && data.instances) {
            instances = data.instances;
            console.log('Using data.instances:', instances);
        } else if (Array.isArray(data)) {
            instances = data;
            console.log('Using data as array:', instances);
        } else {
            instances = [];
            console.log('No instances found, setting empty array');
        }
        
        console.log('Final instances array:', instances);
        populateInstanceSelect();
    } catch (error) {
        console.error('Error loading instances:', error);
        showNotification('Erro ao carregar instâncias', 'error');
        instances = []; // Set empty array on error
    }
}

// Render contacts list
async function renderContacts() {
    if (!contactsList) return;

    // Check if user is admin
    let isAdmin = false;
    try {
        const userResponse = await fetch('/api/user-info', { credentials: 'include' });
        if (userResponse.ok) {
            const userData = await userResponse.json();
            isAdmin = userData && userData.isAdmin;
        }
    } catch (error) {
        console.error('Error checking user privileges:', error);
    }

    if (contacts.length === 0) {
        contactsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-address-book"></i>
                <h3>Nenhum contato encontrado</h3>
                <p>Adicione seu primeiro contato para começar a usar o sistema.</p>
                <button class="btn btn-primary" onclick="addContactModal.style.display='flex'">
                    Adicionar Contato
                </button>
            </div>
        `;
        return;
    }

    contactsList.innerHTML = contacts.map(contact => `
        <div class="contact-item ${selectedContactId === contact.id ? 'active' : ''}" onclick="selectContact('${contact.id}')">
            <div class="contact-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="contact-info">
                <div class="contact-name">${escapeHtml(contact.name)}</div>
                <div class="contact-number">${escapeHtml(contact.number)}</div>
                <div class="contact-date">Criado em: ${formatDate(contact.created_at)}</div>
            </div>
            <div class="contact-actions">
                ${isAdmin ? `
                    <button class="btn btn-success" onclick="event.stopPropagation(); console.log('Chat button clicked for contact:', '${contact.id}'); openStartChatModal('${contact.id}')">
                        <i class="fas fa-comments"></i> Chat
                    </button>
                ` : ''}
                <button class="btn btn-danger" onclick="event.stopPropagation(); deleteContact('${contact.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Select contact
async function selectContact(contactId) {
    selectedContactId = contactId;
    await renderContacts();
    
    // Check if user is admin
    let isAdmin = false;
    try {
        const userResponse = await fetch('/api/user-info', { credentials: 'include' });
        if (userResponse.ok) {
            const userData = await userResponse.json();
            isAdmin = userData && userData.isAdmin;
        }
    } catch (error) {
        console.error('Error checking user privileges:', error);
    }
    
    // Update the main content area
    const contactsContent = document.querySelector('.contacts-content');
    if (contactsContent) {
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
            contactsContent.innerHTML = `
                <div class="contact-details">
                    <div class="contact-detail-card">
                        <div class="contact-detail-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="contact-detail-info">
                            <h3>${escapeHtml(contact.name)}</h3>
                            <p class="contact-detail-number">${escapeHtml(contact.number)}</p>
                            <p class="contact-detail-date">Criado em: ${formatDate(contact.created_at)}</p>
                        </div>
                        <div class="contact-detail-actions">
                            ${isAdmin ? `
                                <button class="btn btn-success" onclick="openStartChatModal('${contact.id}')">
                                    <i class="fas fa-comments"></i> Iniciar Chat
                                </button>
                            ` : ''}
                            <button class="btn btn-danger" onclick="deleteContact('${contact.id}')">
                                <i class="fas fa-trash"></i> Excluir Contato
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

// Add new contact
async function addContact() {
    const formData = new FormData(addContactForm);
    const data = {
        name: formData.get('name'),
        number: formData.get('number')
    };

    if (!data.name || !data.number) {
        showNotification('Por favor, preencha todos os campos', 'error');
        return;
    }

    try {
        const response = await fetch('/api/contacts/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            showNotification('Contato adicionado com sucesso!', 'success');
            addContactModal.style.display = 'none';
            addContactForm.reset();
            loadContacts(); // Reload contacts
        } else {
            showNotification(result.message || 'Erro ao adicionar contato', 'error');
        }
    } catch (error) {
        console.error('Error adding contact:', error);
        showNotification('Erro ao adicionar contato', 'error');
    }
}

// Delete contact
async function deleteContact(contactId) {
    if (!confirm('Tem certeza que deseja excluir este contato?')) {
        return;
    }

    try {
        const response = await fetch('/api/contacts/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ contactId: contactId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            showNotification('Contato excluído com sucesso!', 'success');
            if (selectedContactId === contactId) {
                selectedContactId = null;
                // Reset main content
                const contactsContent = document.querySelector('.contacts-content');
                if (contactsContent) {
                    contactsContent.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-address-book"></i>
                            <h3>Selecione um contato</h3>
                            <p>Escolha um contato da lista para ver detalhes e ações disponíveis</p>
                        </div>
                    `;
                }
            }
            loadContacts(); // Reload contacts
        } else {
            showNotification(result.message || 'Erro ao excluir contato', 'error');
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        showNotification('Erro ao excluir contato', 'error');
    }
}

// Open start chat modal
async function openStartChatModal(contactId = null) {
    console.log('openStartChatModal called with contactId:', contactId);
    
    // Check if user is admin
    let isAdmin = false;
    try {
        const userResponse = await fetch('/api/user-info', { credentials: 'include' });
        if (userResponse.ok) {
            const userData = await userResponse.json();
            isAdmin = userData && userData.isAdmin;
            console.log('User is admin:', isAdmin);
        }
    } catch (error) {
        console.error('Error checking user privileges:', error);
    }

    if (!isAdmin) {
        showNotification('Apenas administradores podem iniciar chats', 'error');
        return;
    }

    console.log('Instances length:', instances.length);
    console.log('Contacts length:', contacts.length);

    if (instances.length === 0) {
        showNotification('Nenhuma instância disponível. Crie uma instância primeiro.', 'error');
        return;
    }

    if (contacts.length === 0) {
        showNotification('Nenhum contato disponível. Adicione um contato primeiro.', 'error');
        return;
    }

    console.log('Opening start chat modal...');
    populateInstanceSelect();
    populateContactSelect(contactId);
    startChatModal.style.display = 'flex';
    console.log('Modal display set to:', startChatModal.style.display);
}

// Populate instance select
function populateInstanceSelect() {
    console.log('populateInstanceSelect called');
    console.log('chatInstanceSelect element:', chatInstanceSelect);
    console.log('instances array:', instances);
    
    if (!chatInstanceSelect) {
        console.error('chatInstanceSelect element not found!');
        return;
    }

    chatInstanceSelect.innerHTML = '<option value="">Selecione uma instância</option>';
    
    if (!instances || instances.length === 0) {
        console.log('No instances available');
        chatInstanceSelect.innerHTML = '<option value="">Nenhuma instância disponível</option>';
        return;
    }
    
    instances.forEach(instance => {
        console.log('Processing instance:', instance);
        const option = document.createElement('option');
        option.value = instance.instance_id;
        option.textContent = `${instance.instance_name || instance.instance_id} (${instance.instance_id})`;
        chatInstanceSelect.appendChild(option);
    });
    
    console.log('Instance select populated with', instances.length, 'options');
}

// Populate contact select
function populateContactSelect(selectedContactId = null) {
    console.log('populateContactSelect called with selectedContactId:', selectedContactId);
    console.log('chatContactSelect element:', chatContactSelect);
    console.log('contacts array:', contacts);
    
    if (!chatContactSelect) {
        console.error('chatContactSelect element not found!');
        return;
    }

    chatContactSelect.innerHTML = '<option value="">Selecione um contato</option>';
    
    if (!contacts || contacts.length === 0) {
        console.log('No contacts available');
        chatContactSelect.innerHTML = '<option value="">Nenhum contato disponível</option>';
        return;
    }
    
    contacts.forEach(contact => {
        console.log('Processing contact:', contact);
        const option = document.createElement('option');
        option.value = contact.id;
        option.textContent = `${contact.name} (${contact.number})`;
        if (selectedContactId && contact.id === selectedContactId) {
            option.selected = true;
            console.log('Selected contact:', contact.name);
        }
        chatContactSelect.appendChild(option);
    });
    
    console.log('Contact select populated with', contacts.length, 'options');
}

// Start chat with contact
async function startChat() {
    // Check if user is admin
    let isAdmin = false;
    try {
        const userResponse = await fetch('/api/user-info', { credentials: 'include' });
        if (userResponse.ok) {
            const userData = await userResponse.json();
            isAdmin = userData && userData.isAdmin;
        }
    } catch (error) {
        console.error('Error checking user privileges:', error);
    }

    if (!isAdmin) {
        showNotification('Apenas administradores podem iniciar chats', 'error');
        return;
    }

    const formData = new FormData(startChatForm);
    const data = {
        instanceId: formData.get('instanceId'),
        contactId: formData.get('contactId')
    };

    if (!data.instanceId || !data.contactId) {
        showNotification('Por favor, selecione uma instância e um contato', 'error');
        return;
    }

    try {
        const response = await fetch('/api/chats/start-with-contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            showNotification('Chat iniciado com sucesso!', 'success');
            startChatModal.style.display = 'none';
            startChatForm.reset();
            
            // Redirect to chats page after a short delay
            setTimeout(() => {
                window.location.href = '/chats';
            }, 1500);
        } else {
            showNotification(result.message || 'Erro ao iniciar chat', 'error');
        }
    } catch (error) {
        console.error('Error starting chat:', error);
        showNotification('Erro ao iniciar chat', 'error');
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'Data não disponível';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

// Global functions for external access
window.selectContact = selectContact;
window.openStartChatModal = openStartChatModal;
window.deleteContact = deleteContact;

// Test function to manually show modal
window.testModal = function() {
    console.log('Testing modal...');
    if (startChatModal) {
        startChatModal.style.display = 'flex';
        console.log('Modal display set to:', startChatModal.style.display);
        console.log('Modal computed style:', window.getComputedStyle(startChatModal).display);
    } else {
        console.error('Modal not found!');
    }
}; 