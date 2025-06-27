// Wait for DOM to be fully loaded

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and user role
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
            
            // Show queue tab for admins
            if (userData && userData.isAdmin) {
                const queueTab = document.getElementById('queueTab');
                if (queueTab) {
                    queueTab.style.display = 'inline-block';
                }
                
                // Load all chats for admin users
                fetchChats();
            } else {
                // For non-admin users, hide the "Todos" tab and switch to "Meus chats"
                const allTab = document.querySelector('[data-tab="all"]');
                if (allTab) {
                    allTab.style.display = 'none';
                }
                
                // Switch to "Meus chats" tab by default for non-admin users
                const myTab = document.querySelector('[data-tab="my"]');
                if (myTab) {
                    // Remove active class from all tabs
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    // Add active class to "Meus chats" tab
                    myTab.classList.add('active');
                    currentTab = 'my';
                    
                    // Load my chats instead of all chats
                    fetchMyChats();
                }
            }
        })
        .catch(error => {
            console.error('Authentication error:', error);
            // Don't redirect here as it might cause loops
        });

    // Mobile menu toggle (reuse from landing.js)
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    let chats = [];
    let queuedChats = [];
    let selectedChatId = null;
    let currentTab = 'all';
    let instances = []; // Add instances array
    let contacts = [];

    const chatList = document.getElementById('chatList');
    const chatMessages = document.getElementById('chatMessages');
    const chatHeader = document.getElementById('chatHeader');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const queueTab = document.getElementById('queueTab');
    const takeChatBtn = document.getElementById('takeChatBtn');
    const transferBtn = document.getElementById('transferBtn');
    const startChatBtn = document.getElementById('startChatBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatInputBox = document.getElementById('chatInputBox');
    const chatInput = document.querySelector('.chat-input');
    const chatSendBtn = document.querySelector('.chat-send-btn');

    const takeCallBtn = document.getElementById('takeCallBtn');
    const transferCallBtn = document.getElementById('transferCallBtn');
    const chatDetailsBtn = document.getElementById('chatDetailsBtn');
    const chatDetailsSidebar = document.getElementById('chatDetailsSidebar');
    const chatDetailsContent = document.getElementById('chatDetailsContent');
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');

    // Debug: Check if buttons are found
    console.log('Button elements found:', {
        takeChatBtn: !!takeChatBtn,
        transferBtn: !!transferBtn,
        startChatBtn: !!startChatBtn
    });

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab === currentTab) return;
            
            // Update active tab
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = tab;
            
            // Clear selection and hide buttons
            selectedChatId = null;
            hideAllActionButtons();
            
            // Reset chat title
            const chatTitle = chatHeader.querySelector('.chat-title');
            if (chatTitle) {
                chatTitle.textContent = 'Selecione um chat';
            }
            
            // Hide message input
            showMessageInput(false);
            enableMessageInput(false); // Disable message input
            
            // Clear messages
            chatMessages.innerHTML = `
                <div class="empty-state">
                    <i class="fab fa-whatsapp"></i>
                    <p>Selecione uma conversa para ver as mensagens</p>
                </div>
            `;
            
            if (tab === 'all') {
                fetchChats();
            } else if (tab === 'queue') {
                fetchQueuedChats();
            } else if (tab === 'my') {
                currentTab = 'my';
                fetchMyChats();
            }
        });
    });

    // Take Chat functionality
    if (takeChatBtn) {
        takeChatBtn.addEventListener('click', function() {
            if (!selectedChatId) return;
            
            fetch('/api/chats/take', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    chatId: selectedChatId
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Chat assumido com sucesso!');
                    // Refresh the current tab
                    if (currentTab === 'all') {
                        fetchChats();
                    } else if (currentTab === 'queue') {
                        fetchQueuedChats();
                    } else if (currentTab === 'my') {
                        fetchMyChats();
                    }
                } else {
                    alert('Erro ao assumir chat: ' + (data.error || 'Erro desconhecido'));
                }
            })
            .catch(error => {
                console.error('Error taking chat:', error);
                alert('Erro ao assumir chat');
            });
        });
    }

    // Transfer Chat functionality
    if (transferBtn) {
        transferBtn.addEventListener('click', function() {
            if (!selectedChatId) return;
            
            // Show transfer modal
            const transferModal = document.getElementById('transferModal');
            if (transferModal) {
                transferModal.style.display = 'flex';
                
                // Load users for transfer
                fetch('/api/users', { credentials: 'include' })
                    .then(res => res.json())
                    .then(users => {
                        const select = document.getElementById('transferAgent');
                        if (select) {
                            select.innerHTML = '<option value="">Selecione um usuário...</option>';
                            users.forEach(user => {
                                const option = document.createElement('option');
                                option.value = user.username;
                                option.textContent = user.username;
                                select.appendChild(option);
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error loading users:', error);
                        alert('Erro ao carregar usuários');
                    });
            }
        });
    }

    // Start Chat functionality

    // Close Chat functionality
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', function() {
            if (!selectedChatId) return;
            
            // Show close chat modal
            const closeChatModal = document.getElementById('closeChatModal');
            if (closeChatModal) {
                closeChatModal.style.display = 'flex';
                
                // Load tabulations
                fetch('/api/tabulations', { credentials: 'include' })
                    .then(res => res.json())
                    .then(tabulations => {
                        const select = document.getElementById('closeChatTabulation');
                        if (select) {
                            select.innerHTML = '<option value="">Selecione uma tabulação...</option>';
                            tabulations.forEach(tabulation => {
                                const option = document.createElement('option');
                                option.value = tabulation;
                                option.textContent = tabulation;
                                select.appendChild(option);
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error loading tabulations:', error);
                        alert('Erro ao carregar tabulações');
                    });
            }
        });
    }

    // Take Call functionality
    if (takeCallBtn) {
        takeCallBtn.addEventListener('click', function() {
            if (!selectedChatId) return;
            
            fetch('/api/user-info', { credentials: 'include' })
                .then(res => res.json())
                .then(userData => {
                    if (!userData || !userData.username) {
                        throw new Error('User info not available');
                    }
                    
                    return fetch('/api/chats/take', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            chatId: selectedChatId,
                            agentId: userData.username
                        })
                    });
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert('Chamado assumido com sucesso!');
                        // Refresh the current tab
                        if (currentTab === 'all') {
                            fetchChats();
                        } else if (currentTab === 'queue') {
                            fetchQueuedChats();
                        } else if (currentTab === 'my') {
                            fetchMyChats();
                        }
                    } else {
                        alert('Erro ao assumir chamado: ' + (data.error || 'Erro desconhecido'));
                    }
                })
                .catch(error => {
                    console.error('Error taking call:', error);
                    alert('Erro ao assumir chamado');
                });
        });
    }

    // Chat Details functionality
    if (chatDetailsBtn) {
        chatDetailsBtn.addEventListener('click', function() {
            if (!selectedChatId) return;
            loadChatDetails(selectedChatId);
            chatDetailsSidebar.style.display = 'flex';
        });
    }

    // Close Details functionality
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', function() {
            chatDetailsSidebar.style.display = 'none';
        });
    }

    // Transfer modal functionality
    const transferModal = document.getElementById('transferModal');
    const transferModalClose = document.getElementById('transferModalClose');
    const transferCancel = document.getElementById('transferCancel');
    const transferConfirm = document.getElementById('transferConfirm');

    if (transferModalClose) {
        transferModalClose.addEventListener('click', () => {
            transferModal.style.display = 'none';
        });
    }

    if (transferCancel) {
        transferCancel.addEventListener('click', () => {
            transferModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    if (transferModal) {
        transferModal.addEventListener('click', (e) => {
            if (e.target === transferModal) {
                transferModal.style.display = 'none';
            }
        });
    }

    // Close Chat modal functionality
    const closeChatModal = document.getElementById('closeChatModal');
    const closeChatModalClose = document.getElementById('closeChatModalClose');
    const closeChatCancel = document.getElementById('closeChatCancel');
    const closeChatConfirm = document.getElementById('closeChatConfirm');

    if (closeChatModalClose) {
        closeChatModalClose.addEventListener('click', () => {
            closeChatModal.style.display = 'none';
        });
    }

    if (closeChatCancel) {
        closeChatCancel.addEventListener('click', () => {
            closeChatModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    if (closeChatModal) {
        closeChatModal.addEventListener('click', (e) => {
            if (e.target === closeChatModal) {
                closeChatModal.style.display = 'none';
            }
        });
    }

    if (transferConfirm) {
        transferConfirm.addEventListener('click', () => {
            const select = document.getElementById('transferAgent');
            const selectedUser = select ? select.value : '';
            
            if (!selectedUser) {
                alert('Por favor, selecione um usuário');
                return;
            }
            
            fetch('/api/chats/transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    chatId: selectedChatId,
                    agentId: selectedUser
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Chat transferido com sucesso!');
                    transferModal.style.display = 'none';
                    // Refresh the current tab
                    if (currentTab === 'all') {
                        fetchChats();
                    } else if (currentTab === 'queue') {
                        fetchQueuedChats();
                    } else if (currentTab === 'my') {
                        fetchMyChats();
                    }
                } else {
                    alert('Erro ao transferir chat: ' + (data.error || 'Erro desconhecido'));
                }
            })
            .catch(error => {
                console.error('Error transferring chat:', error);
                alert('Erro ao transferir chat');
            });
        });
    }

    if (closeChatConfirm) {
        closeChatConfirm.addEventListener('click', () => {
            const select = document.getElementById('closeChatTabulation');
            const selectedTabulation = select ? select.value : '';
            
            if (!selectedTabulation) {
                alert('Por favor, selecione uma tabulação');
                return;
            }
            
            fetch('/api/chats/close', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    chatId: selectedChatId,
                    tabulation: selectedTabulation
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Chat fechado com sucesso!');
                    closeChatModal.style.display = 'none';
                    
                    // Clear selection and hide buttons
                    selectedChatId = null;
                    hideAllActionButtons();
                    
                    // Reset chat title
                    const chatTitle = chatHeader.querySelector('.chat-title');
                    if (chatTitle) {
                        chatTitle.textContent = 'Selecione um chat';
                    }
                    
                    // Hide message input
                    showMessageInput(false);
                    enableMessageInput(false);
                    
                    // Clear messages
                    chatMessages.innerHTML = `
                        <div class="empty-state">
                            <i class="fab fa-whatsapp"></i>
                            <p>Selecione uma conversa para ver as mensagens</p>
                        </div>
                    `;
                    
                    // Refresh the current tab
                    if (currentTab === 'all') {
                        fetchChats();
                    } else if (currentTab === 'queue') {
                        fetchQueuedChats();
                    } else if (currentTab === 'my') {
                        fetchMyChats();
                    }
                } else {
                    alert('Erro ao fechar chat: ' + (data.error || 'Erro desconhecido'));
                }
            })
            .catch(error => {
                console.error('Error closing chat:', error);
                alert('Erro ao fechar chat');
            });
        });
    }

    // Function to hide all action buttons
    function hideAllActionButtons() {
        if (takeChatBtn) takeChatBtn.style.display = 'none';
        if (transferBtn) transferBtn.style.display = 'none';
        if (startChatBtn) startChatBtn.style.display = 'none';
        if (closeChatBtn) closeChatBtn.style.display = 'none';
        if (takeCallBtn) takeCallBtn.style.display = 'none';
        if (transferCallBtn) transferCallBtn.style.display = 'none';
    }

    function fetchChats() {
        chatList.innerHTML = '<li style="text-align:center; padding:2rem; color:var(--text-light);">Carregando...</li>';
        fetch('/api/chats', { credentials: 'include' })
            .then(res => {
                console.log('Chats API response status:', res.status);
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('Chats data received:', data);
                if (!data || data === null) {
                    chats = [];
                } else if (Array.isArray(data)) {
                    chats = data;
                } else {
                    console.warn('Unexpected data format:', data);
                    chats = [];
                }
                renderChatList();
            })
            .catch(error => {
                console.error('Error fetching chats:', error);
                chatList.innerHTML = '<li style="color:red; text-align:center; padding:2rem;">Erro ao carregar conversas: ' + error.message + '</li>';
            });
    }

    function fetchQueuedChats() {
        chatList.innerHTML = '<li style="text-align:center; padding:2rem; color:var(--text-light);">Carregando fila...</li>';
        fetch('/api/queue', { credentials: 'include' })
            .then(res => {
                console.log('Queue API response status:', res.status);
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('Queue data received:', data);
                if (!data || data === null) {
                    queuedChats = [];
                } else if (Array.isArray(data)) {
                    queuedChats = data;
                } else {
                    console.warn('Unexpected data format:', data);
                    queuedChats = [];
                }
                renderQueueList();
            })
            .catch(error => {
                console.error('Error fetching queue:', error);
                chatList.innerHTML = '<li style="color:red; text-align:center; padding:2rem;">Erro ao carregar fila: ' + error.message + '</li>';
            });
    }

    function fetchMyChats() {
        chatList.innerHTML = '<li style="text-align:center; padding:2rem; color:var(--text-light);">Carregando meus chats...</li>';
        fetch('/api/user-info', { credentials: 'include' })
            .then(res => res.json())
            .then(userData => {
                if (!userData || !userData.username) {
                    throw new Error('User info not available');
                }
                return fetch(`/api/chats/my/${encodeURIComponent(userData.username)}`, { credentials: 'include' });
            })
            .then(res => {
                console.log('My chats API response status:', res.status);
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('My chats data received:', data);
                if (!data || data === null) {
                    chats = [];
                } else if (Array.isArray(data)) {
                    chats = data;
                } else {
                    console.warn('Unexpected data format:', data);
                    chats = [];
                }
                renderMyChatsList();
            })
            .catch(error => {
                console.error('Error fetching my chats:', error);
                chatList.innerHTML = '<li style="color:red; text-align:center; padding:2rem;">Erro ao carregar meus chats: ' + error.message + '</li>';
            });
    }

    function renderChatList() {
        if (!chats || !Array.isArray(chats) || chats.length === 0) {
            chatList.innerHTML = '<li style="text-align:center; padding:2rem; color:var(--text-light);">Nenhuma conversa encontrada</li>';
            return;
        }
        chatList.innerHTML = chats.map(chat => {
            const lastMsg = chat.last_message || {};
            const isSelected = chat.id === selectedChatId ? 'selected' : '';
            const statusClass = chat.situation === 'active' ? 'active' : 'inactive';
            const agentText = chat.agent_id ? `Agente: ${chat.agent_id}` : 'Sem agente';
            
            return `
                <li class="${isSelected} ${statusClass}" data-chat-id="${chat.id}">
                    <div class="chat-avatar">
                        <i class="fab fa-whatsapp"></i>
                    </div>
                    <div class="chat-info">
                        <div class="chat-name">${getChatDisplayName(chat)}</div>
                        <div class="chat-last">${lastMsg.text || ''}</div>
                        <div class="chat-status" style="font-size: 0.8rem; color: var(--text-light);">
                            ${agentText}
                        </div>
                    </div>
                </li>
            `;
        }).join('');

        // Add click handlers
        chatList.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', function() {
                const chatId = this.dataset.chatId;
                const chat = chats.find(c => c.id === chatId);
                selectedChatId = chatId;
                
                // Update selected state
                chatList.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
                this.classList.add('selected');
                
                // Load messages with display name
                const displayName = chat ? getChatDisplayName(chat) : chatId;
                loadMessages(chatId, displayName);
            });
        });
    }

    function renderQueueList() {
        if (!queuedChats || !Array.isArray(queuedChats) || queuedChats.length === 0) {
            chatList.innerHTML = '<li style="text-align:center; padding:2rem; color:var(--text-light);">Nenhum chat na fila</li>';
            return;
        }
        chatList.innerHTML = queuedChats.map(chat => {
            const lastMsg = chat.last_message || {};
            const isSelected = chat.id === selectedChatId ? 'selected' : '';
            const statusClass = chat.situation === 'active' ? 'active' : 'inactive';
            const agentText = chat.agent_id ? `Agente: ${chat.agent_id}` : 'Sem agente';
            
            return `
                <li class="${isSelected} ${statusClass}" data-chat-id="${chat.id}">
                    <div class="chat-avatar">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="chat-info">
                        <div class="chat-name">${getChatDisplayName(chat)}</div>
                        <div class="chat-last">${lastMsg.text || 'Aguardando atendimento...'}</div>
                        <div class="chat-status" style="font-size: 0.8rem; color: var(--text-light);">
                            ${agentText}
                        </div>
                    </div>
                </li>
            `;
        }).join('');

        // Add click handlers
        chatList.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', function() {
                const chatId = this.dataset.chatId;
                const chat = queuedChats.find(c => c.id === chatId);
                selectedChatId = chatId;
                
                // Update selected state
                chatList.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
                this.classList.add('selected');
                
                // Load messages with display name
                const displayName = chat ? getChatDisplayName(chat) : chatId;
                loadMessages(chatId, displayName);
            });
        });
    }

    function renderMyChatsList() {
        if (!chatList) return;
        
        if (!chats || chats.length === 0) {
            chatList.innerHTML = '<li class="empty-state">Nenhum chat encontrado</li>';
            return;
        }
        
        chatList.innerHTML = chats.map(chat => {
            const lastMsg = chat.last_message || {};
            const isSelected = chat.id === selectedChatId ? 'selected' : '';
            const statusClass = chat.situation === 'active' ? 'active' : 'inactive';
            const agentText = chat.agent_id ? `Agente: ${chat.agent_id}` : 'Sem agente';
            
            return `
                <li class="${isSelected} ${statusClass}" data-chat-id="${chat.id}">
                    <div class="chat-avatar">
                        <i class="fab fa-whatsapp"></i>
                    </div>
                    <div class="chat-info">
                        <div class="chat-name">${getChatDisplayName(chat)}</div>
                        <div class="chat-last">${lastMsg.text || ''}</div>
                        <div class="chat-status" style="font-size: 0.8rem; color: var(--text-light);">
                            ${agentText}
                        </div>
                    </div>
                </li>
            `;
        }).join('');

        // Add click handlers
        chatList.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', function() {
                const chatId = this.dataset.chatId;
                const chat = chats.find(c => c.id === chatId);
                selectedChatId = chatId;
                
                // Update selected state
                chatList.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
                this.classList.add('selected');
                
                // Load messages with display name
                const displayName = chat ? getChatDisplayName(chat) : chatId;
                loadMessages(chatId, displayName);
            });
        });
    }

    function loadMessages(chatId, chatName) {
        console.log('Loading messages for chat:', chatId, 'in tab:', currentTab);
        chatMessages.innerHTML = '<div class="empty-state">Carregando mensagens...</div>';
        
        // Find the selected chat to get its display name
        let selectedChat = null;
        if (currentTab === 'all') {
            selectedChat = chats.find(chat => chat.id === chatId);
        } else if (currentTab === 'queue') {
            selectedChat = queuedChats.find(chat => chat.id === chatId);
        } else if (currentTab === 'my') {
            selectedChat = chats.find(chat => chat.id === chatId);
        }
        
        // Use contact name if available, otherwise use provided name or chat ID
        let displayName = chatId;
        if (selectedChat) {
            displayName = getChatDisplayName(selectedChat);
        } else if (chatName) {
            displayName = chatName;
        }
        
        // Update only the chat title, not the entire header
        const chatTitle = chatHeader.querySelector('.chat-title');
        if (chatTitle) {
            chatTitle.textContent = displayName;
        }
        
        showMessageInput(true);
        enableMessageInput(true); // Enable message input
        
        // Show/hide buttons based on chat situation
        if (selectedChat) {
            const situation = selectedChat.situation || 'unknown';
            const agentId = selectedChat.agent_id;
            
            console.log('Chat situation:', situation, 'Agent ID:', agentId);
            
            // Show "Take Chat" button only for queued chats (no agent assigned)
            if (takeChatBtn) {
                if (situation === 'queued' && !agentId) {
                    takeChatBtn.style.display = 'inline-block';
                    console.log('Showing Take Chat button');
                } else {
                    takeChatBtn.style.display = 'none';
                    console.log('Hiding Take Chat button');
                }
            }
            
            // Show "Start Chat" button for active chats without agent
            if (startChatBtn) {
                if (situation === 'active' && !agentId) {
                    startChatBtn.style.display = 'inline-block';
                    console.log('Showing Start Chat button');
                } else {
                    startChatBtn.style.display = 'none';
                    console.log('Hiding Start Chat button');
                }
            }
            
            // Show "Transfer" button for active chats with agent
            if (transferBtn) {
                if (situation === 'active' && agentId) {
                    transferBtn.style.display = 'inline-block';
                    console.log('Showing Transfer button');
                } else {
                    transferBtn.style.display = 'none';
                    console.log('Hiding Transfer button');
                }
            }
            
            // Show "Close Chat" button for active chats with agent
            if (closeChatBtn) {
                if (situation === 'active' && agentId) {
                    closeChatBtn.style.display = 'inline-block';
                    console.log('Showing Close Chat button');
                } else {
                    closeChatBtn.style.display = 'none';
                    console.log('Hiding Close Chat button');
                }
            }
            
            // Show "Pegar chamado" button for queued chats or chats without agent
            if (takeCallBtn) {
                if (situation === 'queued' || !agentId) {
                    takeCallBtn.style.display = 'inline-block';
                    console.log('Showing Take Call button');
                } else {
                    takeCallBtn.style.display = 'none';
                    console.log('Hiding Take Call button');
                }
            }

            // Show "Chat Details" button for all chats
            if (chatDetailsBtn) {
                chatDetailsBtn.style.display = 'inline-block';
            }
        }
        
        fetch(`/api/chats/${encodeURIComponent(chatId)}/messages`, { credentials: 'include' })
            .then(res => {
                console.log('Messages API response status:', res.status);
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('Messages data received:', data);
                renderMessages(data);
            })
            .catch(error => {
                console.error('Error loading messages:', error);
                chatMessages.innerHTML = '<div class="empty-state" style="color:red;">Erro ao carregar mensagens: ' + error.message + '</div>';
            });
    }

    function showMessageInput(show) {
        const inputBox = document.getElementById('chatInputBox');
        if (inputBox) {
            inputBox.style.display = show ? 'flex' : 'none';
        }
    }

    function renderMessages(messages) {
        if (!messages.length) {
            chatMessages.innerHTML = '<div class="empty-state">Nenhuma mensagem nesta conversa</div>';
            return;
        }
        chatMessages.innerHTML = '';
        messages.forEach(msg => {
            const div = document.createElement('div');
            // Treat 'system' as sent (right side)
            const isSent = msg.fromMe || msg.from_me || msg.from === 'me' || msg.from === 'system';
            const isSystem = msg.from === 'system';
            div.className = 'message-bubble ' + (isSent ? 'sent' : 'received') + (isSystem ? ' system-message' : '');
            div.innerHTML = `
                <div>${msg.text || msg.body || ''}</div>
                <div class="message-meta">${msg.timestamp ? msg.timestamp : ''}</div>
            `;
            chatMessages.appendChild(div);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Hide input box when no chat is selected
    showMessageInput(false);
    enableMessageInput(false); // Disable message input initially
    
    // Hide all action buttons initially
    hideAllActionButtons();
    
    // Set initial chat title
    const chatTitle = chatHeader.querySelector('.chat-title');
    if (chatTitle) {
        chatTitle.textContent = 'Selecione um chat';
    }

    // Initial load will be handled by the authentication check
    // fetchChats() is called only for admin users, fetchMyChats() for regular users

    // Auto-refresh based on current tab
    setInterval(() => {
        if (currentTab === 'all') {
            fetchChats();
        } else if (currentTab === 'queue') {
            fetchQueuedChats();
        } else if (currentTab === 'my') {
            fetchMyChats();
        }
    }, 30000);

    // Load instances for message sending
    function loadInstances() {
        fetch('/api/instances', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data && data.instances) {
                    instances = data.instances.filter(instance => instance.is_active);
                    console.log('Loaded instances:', instances);
                }
            })
            .catch(error => {
                console.error('Error loading instances:', error);
            });
    }

    // Load instances on page load
    loadInstances();

    // Load contacts on page load
    loadContacts();

    // Message sending functionality
    if (chatInputBox) {
        chatInputBox.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const message = chatInput.value.trim();
            if (!message || !selectedChatId) return;

            // Get the first active instance (you might want to add instance selection UI)
            const activeInstance = instances.find(instance => instance.is_active);
            if (!activeInstance) {
                alert('Nenhuma instância ativa encontrada. Por favor, conecte uma instância primeiro.');
                return;
            }

            // Send message
            fetch('/api/chats/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    chatId: selectedChatId,
                    message: message,
                    instanceId: activeInstance.instance_id
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Clear input
                    chatInput.value = '';
                    
                    // Reload messages to show the new message
                    loadMessages(selectedChatId, selectedChatId);
                    
                    // Refresh the current tab
                    if (currentTab === 'all') {
                        fetchChats();
                    } else if (currentTab === 'queue') {
                        fetchQueuedChats();
                    } else if (currentTab === 'my') {
                        fetchMyChats();
                    }
                } else {
                    alert('Erro ao enviar mensagem: ' + (data.error || 'Erro desconhecido'));
                }
            })
            .catch(error => {
                console.error('Error sending message:', error);
                alert('Erro ao enviar mensagem');
            });
        });
    }

    // Enable/disable input based on chat selection
    function enableMessageInput(enable) {
        if (chatInput) {
            chatInput.disabled = !enable;
            chatInput.placeholder = enable ? 'Digite uma mensagem ou envie mídia...' : 'Selecione um chat para enviar mensagens';
        }
        if (chatSendBtn) {
            chatSendBtn.disabled = !enable;
        }
    }

    // Load chat details
    function loadChatDetails(chatId) {
        if (!chatDetailsContent) return;

        chatDetailsContent.innerHTML = '<div class="loading">Carregando detalhes...</div>';

        fetch(`/api/chats/${encodeURIComponent(chatId)}/details`, { credentials: 'include' })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('Chat details received:', data);
                renderChatDetails(data);
            })
            .catch(error => {
                console.error('Error loading chat details:', error);
                chatDetailsContent.innerHTML = '<div class="error">Erro ao carregar detalhes do chat</div>';
            });
    }

    // Render chat details
    function renderChatDetails(data) {
        if (!chatDetailsContent) return;

        let contactHtml = '';
        if (data.contact) {
            contactHtml = `
                <div class="chat-detail-contact">
                    <div class="chat-detail-contact-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="chat-detail-contact-info">
                        <h4>${escapeHtml(data.contact.name)}</h4>
                        <p>${escapeHtml(data.contact.number)}</p>
                    </div>
                </div>
            `;
        }

        chatDetailsContent.innerHTML = `
            ${contactHtml}
            <div class="chat-detail-item">
                <div class="chat-detail-label">ID do Chat</div>
                <div class="chat-detail-value">${escapeHtml(data.chatId)}</div>
            </div>
            <div class="chat-detail-item">
                <div class="chat-detail-label">Número</div>
                <div class="chat-detail-value">${escapeHtml(data.number || 'N/A')}</div>
            </div>
            <div class="chat-detail-item">
                <div class="chat-detail-label">Situação</div>
                <div class="chat-detail-value">${escapeHtml(data.situation || 'N/A')}</div>
            </div>
            <div class="chat-detail-item">
                <div class="chat-detail-label">Status</div>
                <div class="chat-detail-value">${data.isActive ? 'Ativo' : 'Inativo'}</div>
            </div>
            <div class="chat-detail-item">
                <div class="chat-detail-label">Agente</div>
                <div class="chat-detail-value">${data.agentId ? escapeHtml(data.agentId) : 'Não atribuído'}</div>
            </div>
            <div class="chat-detail-item">
                <div class="chat-detail-label">Instância</div>
                <div class="chat-detail-value">${data.instanceId ? escapeHtml(data.instanceId) : 'N/A'}</div>
            </div>
            <div class="chat-detail-item">
                <div class="chat-detail-label">Tabulação</div>
                <div class="chat-detail-value">${data.tabulation ? escapeHtml(data.tabulation) : 'N/A'}</div>
            </div>
        `;
    }

    // Utility function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Load contacts for display names
    function loadContacts() {
        fetch('/api/contacts', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data && data.success && data.contacts) {
                    contacts = data.contacts;
                    console.log('Loaded contacts:', contacts);
                }
            })
            .catch(error => {
                console.error('Error loading contacts:', error);
            });
    }

    // Get contact name by phone number
    function getContactName(phoneNumber) {
        if (!contacts || !phoneNumber) return null;
        const contact = contacts.find(c => c.number === phoneNumber);
        return contact ? contact.name : null;
    }

    // Get display name for chat
    function getChatDisplayName(chat) {
        // First try to get contact name by phone number
        if (chat.number) {
            const contactName = getContactName(chat.number);
            if (contactName) {
                return contactName;
            }
        }
        
        // Fallback to chat ID
        return chat.id;
    }
}); 