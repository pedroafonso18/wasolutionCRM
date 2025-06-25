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

    const chatList = document.getElementById('chatList');
    const chatMessages = document.getElementById('chatMessages');
    const chatHeader = document.getElementById('chatHeader');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const queueTab = document.getElementById('queueTab');
    const takeChatBtn = document.getElementById('takeChatBtn');
    const transferBtn = document.getElementById('transferBtn');
    const startChatBtn = document.getElementById('startChatBtn');

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
            
            // Clear selection and load appropriate data
            selectedChatId = null;
            if (tab === 'all') {
                fetchChats();
            } else if (tab === 'queue') {
                fetchQueuedChats();
            } else if (tab === 'my') {
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
                renderChatList();
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
        chatList.innerHTML = '';
        chats.forEach(chat => {
            if (!chat) return;
            
            const chatId = chat.id || 'Unknown';
            const lastMsg = chat.last_message || {};
            const situation = chat.situation || 'unknown';
            const isActive = chat.is_active || false;
            const agentId = chat.agent_id || null;
            
            const li = document.createElement('li');
            li.className = (chatId === selectedChatId) ? 'active' : '';
            
            let avatarColor = 'var(--primary-color)';
            let avatarIcon = 'fab fa-whatsapp';
            
            if (situation === 'queued') {
                avatarColor = '#ff6b6b';
                avatarIcon = 'fas fa-clock';
            } else if (situation === 'active') {
                avatarColor = '#51cf66';
                avatarIcon = 'fas fa-user-check';
            } else if (situation === 'closed') {
                avatarColor = '#868e96';
                avatarIcon = 'fas fa-times';
            }
            
            li.innerHTML = `
                <div class="chat-avatar" style="background: ${avatarColor};">
                    <i class="${avatarIcon}"></i>
                </div>
                <div class="chat-info">
                    <div class="chat-name">${chatId}</div>
                    <div class="chat-last">${lastMsg.text || ''}</div>
                    <div class="chat-status" style="font-size: 0.8rem; color: var(--text-light);">
                        ${situation} ${isActive ? '• Ativo' : '• Inativo'} ${agentId ? `• Agente: ${agentId}` : ''}
                    </div>
                </div>
            `;
            li.addEventListener('click', () => {
                if (selectedChatId !== chatId) {
                    selectedChatId = chatId;
                    renderChatList();
                    loadMessages(chatId, chatId);
                }
            });
            chatList.appendChild(li);
        });
    }

    function renderQueueList() {
        if (!queuedChats || !Array.isArray(queuedChats) || queuedChats.length === 0) {
            chatList.innerHTML = '<li style="text-align:center; padding:2rem; color:var(--text-light);">Nenhum chat na fila</li>';
            return;
        }
        chatList.innerHTML = '';
        queuedChats.forEach(chat => {
            if (!chat) return;
            
            const chatId = chat.id || 'Unknown';
            const lastMsg = chat.last_message || {};
            const situation = chat.situation || 'unknown';
            const isActive = chat.is_active || false;
            const agentId = chat.agent_id || null;
            
            const li = document.createElement('li');
            li.className = (chatId === selectedChatId) ? 'active' : '';
            li.innerHTML = `
                <div class="chat-avatar" style="background: #ff6b6b;">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="chat-info">
                    <div class="chat-name">${chatId}</div>
                    <div class="chat-last">${lastMsg.text || 'Aguardando atendimento...'}</div>
                    <div class="chat-status" style="font-size: 0.8rem; color: var(--text-light);">
                        ${situation} ${isActive ? '• Ativo' : '• Inativo'} ${agentId ? `• Agente: ${agentId}` : ''}
                    </div>
                </div>
            `;
            li.addEventListener('click', () => {
                if (selectedChatId !== chatId) {
                    selectedChatId = chatId;
                    renderQueueList();
                    loadMessages(chatId, chatId);
                }
            });
            chatList.appendChild(li);
        });
    }

    function loadMessages(chatId, chatName) {
        console.log('Loading messages for chat:', chatId, 'in tab:', currentTab);
        chatMessages.innerHTML = '<div class="empty-state">Carregando mensagens...</div>';
        chatHeader.innerHTML = `<span class="chat-title">${chatName || chatId}</span>`;
        showMessageInput(true);
        
        // Show chat actions
        const chatActions = document.getElementById('chatActions');
        if (chatActions) {
            chatActions.style.display = 'flex';
        }
        
        // Find the selected chat to determine its situation
        let selectedChat = null;
        if (currentTab === 'all') {
            selectedChat = chats.find(chat => chat.id === chatId);
        } else if (currentTab === 'queue') {
            selectedChat = queuedChats.find(chat => chat.id === chatId);
        } else if (currentTab === 'my') {
            selectedChat = chats.find(chat => chat.id === chatId);
        }
        
        console.log('Selected chat:', selectedChat);
        
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

    // Initial load
    fetchChats();

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
}); 