// Wait for DOM to be fully loaded

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle (reuse from landing.js)
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // State
    let chats = [];
    let selectedChatId = null;

    // Elements
    const chatList = document.getElementById('chatList');
    const chatMessages = document.getElementById('chatMessages');
    const chatHeader = document.getElementById('chatHeader');

    // Fetch and render chats
    function fetchChats() {
        chatList.innerHTML = '<li style="text-align:center; padding:2rem; color:var(--text-light);">Carregando...</li>';
        fetch('/api/chats')
            .then(res => res.json())
            .then(data => {
                chats = data;
                renderChatList();
            })
            .catch(() => {
                chatList.innerHTML = '<li style="color:red; text-align:center; padding:2rem;">Erro ao carregar conversas</li>';
            });
    }

    function renderChatList() {
        if (!chats.length) {
            chatList.innerHTML = '<li style="text-align:center; padding:2rem; color:var(--text-light);">Nenhuma conversa encontrada</li>';
            return;
        }
        chatList.innerHTML = '';
        chats.forEach(chat => {
            const chatId = chat.chat_id || chat.id || chat.ChatID;
            const lastMsg = chat.last_message || chat.lastMessage || {};
            const li = document.createElement('li');
            li.className = (chatId === selectedChatId) ? 'active' : '';
            li.innerHTML = `
                <div class="chat-avatar"><i class="fab fa-whatsapp"></i></div>
                <div class="chat-info">
                    <div class="chat-name">${chatId}</div>
                    <div class="chat-last">${lastMsg.text || ''}</div>
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

    // Fetch and render messages for a chat
    function loadMessages(chatId, chatName) {
        chatMessages.innerHTML = '<div class="empty-state">Carregando mensagens...</div>';
        chatHeader.innerHTML = `<span class="chat-title">${chatName || chatId}</span>`;
        // Show message input box
        showMessageInput(true);
        fetch(`/api/chats/${encodeURIComponent(chatId)}/messages`)
            .then(res => res.json())
            .then(data => {
                renderMessages(data);
            })
            .catch(() => {
                chatMessages.innerHTML = '<div class="empty-state" style="color:red;">Erro ao carregar mensagens</div>';
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
}); 