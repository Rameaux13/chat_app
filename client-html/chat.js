import { getCurrentChatUserId, setCurrentChatUserId } from './state.js';

let currentUser = null;
let allUsers = [];
let stickers = [];

try {
    const userData = localStorage.getItem('currentUser');
    if (userData && userData !== 'undefined') {
        currentUser = JSON.parse(userData);
    }
} catch (error) {
    console.error('Erreur lors du parsing de currentUser:', error);
    localStorage.removeItem('currentUser');
}

function displayWelcomeMessage() {
    const chatMessages = document.querySelector('#chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <h3>Bienvenue dans le chat !</h3>
                <p>Sélectionnez une conversation pour commencer à discuter.</p>
            </div>
        `;
    }
    const chatHeading = document.querySelector('#chat-heading');
    if (chatHeading) chatHeading.textContent = 'Chat';
    const chatHeaderPic = document.querySelector('#chatHeaderPic');
    if (chatHeaderPic) {
        chatHeaderPic.style.backgroundImage = 'none';
        chatHeaderPic.classList.remove('has-image');
        chatHeaderPic.textContent = '💬';
    }
    const chatInput = document.querySelector('#chat-input');
    if (chatInput) chatInput.disabled = true;
    const chatForm = document.querySelector('#chat-form');
    if (chatForm) chatForm.style.display = 'none';
    const openProfileSidebar = document.querySelector('#openProfileSidebar');
    if (openProfileSidebar) openProfileSidebar.disabled = true;
}

export async function populateUsersList(socket, user) {
    try {
        const blockedResponse = await fetch(`http://localhost:400/blocked-users/${user.id}`);
        if (!blockedResponse.ok) throw new Error('Erreur lors de la récupération des utilisateurs bloqués');
        const blockedUsers = await blockedResponse.json();
        const blockedUserIds = blockedUsers.map(b => b.blocked_user_id);

        const response = await fetch('http://localhost:400/users');
        if (!response.ok) throw new Error('Erreur réseau');
        allUsers = await response.json();

        const usersList = document.querySelector('#users-list');
        if (!usersList) return;

        usersList.innerHTML = '';

        const displayUsers = (filteredUsers) => {
            usersList.innerHTML = '';
            filteredUsers.forEach(u => {
                if (u.id !== user.id) {
                    const isBlocked = blockedUserIds.includes(u.id);
                    const userItem = document.createElement('div');
                    userItem.classList.add('user-item');
                    if (isBlocked) userItem.classList.add('blocked');
                    userItem.dataset.userId = u.id;
                    const profilePicUrl = u.profile_pic ? encodeURI(u.profile_pic) : '';
                    userItem.innerHTML = `
                        <div class="user-item-pic${profilePicUrl ? ' has-image' : ''}" style="background-image: ${profilePicUrl ? `url(${profilePicUrl})` : 'none'}">
                            ${profilePicUrl ? '' : (u.prenom?.charAt(0) || '') + (u.nom?.charAt(0) || '')}
                        </div>
                        <div class="user-item-name">${u.prenom || 'Inconnu'} ${u.nom || ''}${isBlocked ? ' (Bloqué)' : ''}</div>
                    `;
                    userItem.addEventListener('click', () => {
                        if (!isBlocked) {
                            setCurrentChatUserId(u.id);
                            console.log(`Conversation ouverte avec user:${u.id}`);
                            loadChat(u, user, socket);
                        } else {
                            showCustomAlert('Cet utilisateur est bloqué.', 'error');
                        }
                    });
                    usersList.appendChild(userItem);
                }
            });
        };

        displayUsers(allUsers);

        const usersSearch = document.querySelector('#usersSearch');
        if (usersSearch) {
            usersSearch.addEventListener('input', () => {
                const searchTerm = usersSearch.value.trim().toLowerCase();
                const filteredUsers = allUsers.filter(u =>
                    `${u.prenom || ''} ${u.nom || ''}`.toLowerCase().includes(searchTerm)
                );
                displayUsers(filteredUsers);
            });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        showCustomAlert('Erreur lors du chargement des utilisateurs.', 'error');
    }
}

async function loadChat(user, currentUser, socket) {
    setCurrentChatUserId(user.id);
    console.log(`Chargement du chat pour user:${user.id}`);

    const chatSidebar = document.querySelector('#chatSidebar');
    const chatHeaderPic = document.querySelector('#chatHeaderPic');
    const chatHeading = document.querySelector('#chat-heading');
    const chatMessages = document.querySelector('#chat-messages');
    const chatForm = document.querySelector('#chat-form');
    const chatInput = document.querySelector('#chat-input');
    const openProfileSidebar = document.querySelector('#openProfileSidebar');
    const stickerBtn = document.querySelector('#stickerBtn');
    const stickerPicker = document.querySelector('#stickerPicker');
    const stickerList = document.querySelector('#stickerList');

    if (chatSidebar) {
        chatSidebar.classList.remove('hidden');
        chatSidebar.classList.add('active');
    }
    if (chatHeaderPic) {
        const profilePicUrl = user.profile_pic ? encodeURI(user.profile_pic) : '';
        chatHeaderPic.style.backgroundImage = profilePicUrl ? `url(${profilePicUrl})` : 'none';
        chatHeaderPic.classList.toggle('has-image', !!profilePicUrl);
        chatHeaderPic.textContent = profilePicUrl ? '' : (user.prenom?.charAt(0) || '') + (user.nom?.charAt(0) || '');
    }
    if (chatHeading) chatHeading.textContent = `${user.prenom || 'Inconnu'} ${user.nom || ''}`;
    if (chatMessages) chatMessages.innerHTML = '<p>Chargement...</p>';
    if (chatInput) chatInput.disabled = false;
    if (chatForm) chatForm.style.display = 'flex';
    if (openProfileSidebar) {
        openProfileSidebar.disabled = false;
        openProfileSidebar.onclick = () => loadChatUserProfile(socket, user.id);
    }

    if (stickerBtn) {
        const newStickerBtn = stickerBtn.cloneNode(true);
        stickerBtn.parentNode.replaceChild(newStickerBtn, stickerBtn);
        const newDocumentClickHandler = (e) => {
            if (!stickerPicker.contains(e.target) && !newStickerBtn.contains(e.target)) {
                stickerPicker.classList.remove('active');
            }
        };
        document.removeEventListener('click', window.documentClickHandler);
        window.documentClickHandler = newDocumentClickHandler;
        document.addEventListener('click', newDocumentClickHandler);

        newStickerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stickerPicker.classList.toggle('active');
            if (stickerPicker.classList.contains('active') && !stickers.length) {
                loadStickers();
            }
        });
    }

    async function loadStickers() {
        try {
            const response = await fetch('http://localhost:400/stickers');
            if (!response.ok) throw new Error('Erreur lors du chargement des stickers');
            stickers = await response.json();
            if (stickerList) {
                stickerList.innerHTML = stickers.length ? '' : '<p>Aucun sticker disponible.</p>';
                stickers.forEach(sticker => {
                    const stickerItem = document.createElement('div');
                    stickerItem.classList.add('sticker-item');
                    stickerItem.style.backgroundImage = `url(${sticker.image_url})`;
                    stickerItem.addEventListener('click', () => {
                        socket.emit('private message', {
                            senderId: currentUser.id,
                            receiverId: user.id,
                            content: sticker.image_url,
                            is_sticker: true,
                        });
                        stickerPicker.classList.remove('active');
                    });
                    stickerList.appendChild(stickerItem);
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement des stickers:', error);
            showCustomAlert('Erreur lors du chargement des stickers.', 'error');
        }
    }

    try {
        const blockedResponse = await fetch(`http://localhost:400/blocked-users/${currentUser.id}`);
        if (!blockedResponse.ok) throw new Error('Erreur lors de la vérification des blocages');
        const blockedUsers = await blockedResponse.json();
        const isBlocked = blockedUsers.some(b => b.blocked_user_id === user.id);
        if (isBlocked) {
            if (chatInput) chatInput.disabled = true;
            if (stickerBtn) stickerBtn.disabled = true;
            if (chatMessages) chatMessages.innerHTML = '<p>Conversation bloquée.</p>';
            return;
        }
    } catch (error) {
        console.error('Erreur lors de la vérification des blocages:', error);
        showCustomAlert('Erreur lors de la vérification des blocages.', 'error');
    }

    try {
        const response = await fetch(`http://localhost:400/private-messages/${currentUser.id}/${user.id}`);
        if (!response.ok) throw new Error('Erreur lors du chargement des messages');
        const messages = await response.json();
        console.log('Messages récupérés:', messages);
        if (chatMessages) {
            chatMessages.innerHTML = '';
            if (messages.length === 0) {
                chatMessages.innerHTML = '<p>Aucun message dans cette conversation.</p>';
            } else {
                messages.forEach(msg => {
                    console.log('Message à afficher:', msg);
                    displayMessage(msg, currentUser.id);
                });
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        if (chatMessages) chatMessages.innerHTML = '<p>Erreur lors du chargement des messages.</p>';
    }

    if (chatForm) {
        chatForm.onsubmit = (e) => {
            e.preventDefault();
            const content = chatInput.value.trim();
            if (content) {
                console.log(`Envoi de message à user:${user.id}: ${content}`);
                socket.emit('private message', {
                    senderId: currentUser.id,
                    receiverId: user.id,
                    content,
                    is_sticker: false,
                });
                chatInput.value = '';
            }
        };
    }
}

function displayMessage(msg, currentUserId) {
    const chatMessages = document.querySelector('#chat-messages');
    if (!chatMessages) {
        console.warn('Conteneur #chat-messages non trouvé');
        return;
    }

    if (!msg.user || typeof msg.user !== 'object') {
        console.error('Données utilisateur invalides pour le message:', msg);
        return;
    }

    const isSent = msg.user.id === currentUserId;
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', isSent ? 'sent' : 'received');
    if (msg.is_sticker) messageElement.classList.add('sticker');
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container');
    const profilePic = document.createElement('div');
    profilePic.classList.add('message-profile-pic');
    const profilePicUrl = msg.user.profile_pic ? encodeURI(msg.user.profile_pic) : '';
    if (profilePicUrl && !msg.is_sticker) {
        profilePic.style.backgroundImage = `url(${profilePicUrl})`;
        profilePic.classList.add('has-image');
    } else {
        const prenomInitial = msg.user.prenom?.charAt(0) || 'U';
        const nomInitial = msg.user.nom?.charAt(0) || '';
        profilePic.textContent = prenomInitial + nomInitial;
    }
    const contentElement = document.createElement(msg.is_sticker ? 'img' : 'p');
    if (msg.is_sticker) {
        contentElement.src = msg.content;
        contentElement.alt = 'Sticker';
    } else {
        contentElement.textContent = msg.content || '[Contenu vide]';
    }
    const timestampElement = document.createElement('div');
    timestampElement.classList.add('message-timestamp');
    const messageDate = new Date(msg.created_at);
    const formattedDate = `${messageDate.getDate().toString().padStart(2, '0')}/${(messageDate.getMonth() + 1).toString().padStart(2, '0')}/${messageDate.getFullYear()}`;
    const formattedTime = `${messageDate.getHours().toString().padStart(2, '0')}:${messageDate.getMinutes().toString().padStart(2, '0')}`;
    timestampElement.textContent = `${formattedDate} ${formattedTime}`;
    messageContainer.appendChild(profilePic);
    messageContainer.appendChild(contentElement);
    messageElement.appendChild(messageContainer);
    messageElement.appendChild(timestampElement);
    chatMessages.appendChild(messageElement);
}

export async function loadChatUserProfile(socket, userId) {
    if (!userId) {
        showCustomAlert('Erreur : aucun chat sélectionné.', 'error');
        return;
    }
    const profileSidebar = document.querySelector('#profileSidebar');
    const profileDetailsPic = document.querySelector('#profileDetailsPic');
    const profileDetailsName = document.querySelector('#profileDetailsName');
    const profileDetailsEmail = document.querySelector('#profileDetailsEmail');
    const profileDetailsInfo = document.querySelector('#profileDetailsInfo');
    const blockUserBtn = document.querySelector('#blockUserBtn');
    const unblockUserBtn = document.querySelector('#unblockUserBtn');
    const reportUserBtn = document.querySelector('#reportUserBtn');
    const reportForm = document.querySelector('#reportForm');
    const reportReason = document.querySelector('#reportReason');
    const submitReportBtn = document.querySelector('#submitReportBtn');
    const cancelReportBtn = document.querySelector('#cancelReportBtn');
    const deleteConversationBtn = document.querySelector('#deleteConversationBtn');

    try {
        const user = allUsers.find(u => u.id === userId);
        if (!user) throw new Error('Utilisateur non trouvé');

        if (profileSidebar) profileSidebar.dataset.userId = userId;
        if (profileSidebar) {
            profileSidebar.classList.remove('hidden');
            profileSidebar.classList.add('active');
        }
        const profilePicUrl = user.profile_pic ? encodeURI(user.profile_pic) : '';
        if (profileDetailsPic) {
            profileDetailsPic.style.backgroundImage = profilePicUrl ? `url(${profilePicUrl})` : 'none';
            profileDetailsPic.classList.toggle('has-image', !!profilePicUrl);
            profileDetailsPic.textContent = profilePicUrl ? '' : (user.prenom?.charAt(0) || '') + (user.nom?.charAt(0) || '');
        }
        if (profileDetailsName) profileDetailsName.textContent = `${user.prenom || 'Inconnu'} ${user.nom || ''}`;
        if (profileDetailsEmail) profileDetailsEmail.textContent = user.email || 'Non spécifié';
        if (profileDetailsInfo) profileDetailsInfo.textContent = user.telephone || 'Non spécifié';

        const blockedResponse = await fetch(`http://localhost:400/blocked-users/${currentUser.id}`);
        if (!blockedResponse.ok) throw new Error('Erreur lors de la vérification des blocages');
        const blockedUsers = await blockedResponse.json();
        const isBlocked = blockedUsers.some(b => b.blocked_user_id === userId);
        if (blockUserBtn) blockUserBtn.style.display = isBlocked ? 'none' : 'block';
        if (unblockUserBtn) unblockUserBtn.style.display = isBlocked ? 'block' : 'none';

        if (blockUserBtn) {
            blockUserBtn.onclick = async () => {
                try {
                    const response = await fetch(`http://localhost:400/block-user/${currentUser.id}/${userId}`, {
                        method: 'POST',
                    });
                    if (!response.ok) throw new Error((await response.json()).message || 'Erreur réseau');
                    socket.emit('user blocked', { userId: currentUser.id, blockedUserId: userId });
                    showCustomAlert('Utilisateur bloqué avec succès.', 'success');
                    blockUserBtn.style.display = 'none';
                    unblockUserBtn.style.display = 'block';
                    if (getCurrentChatUserId() === userId) {
                        document.querySelector('#chat-input').disabled = true;
                        document.querySelector('#stickerBtn').disabled = true;
                        document.querySelector('#chat-messages').innerHTML = '<p>Conversation bloquée.</p>';
                    }
                    await populateUsersList(socket, currentUser);
                } catch (error) {
                    console.error('Erreur lors du blocage:', error);
                    showCustomAlert('Erreur lors du blocage.', 'error');
                }
            };
        }

        if (unblockUserBtn) {
            unblockUserBtn.onclick = async () => {
                try {
                    const response = await fetch(`http://localhost:400/unblock-user/${currentUser.id}/${userId}`, {
                        method: 'POST',
                    });
                    if (!response.ok) throw new Error((await response.json()).message || 'Erreur réseau');
                    socket.emit('user unblocked', { userId: currentUser.id, blockedUserId: userId });
                    showCustomAlert('Utilisateur débloqué avec succès.', 'success');
                    blockUserBtn.style.display = 'block';
                    unblockUserBtn.style.display = 'none';
                    if (getCurrentChatUserId() === userId) {
                        document.querySelector('#chat-input').disabled = false;
                        document.querySelector('#stickerBtn').disabled = false;
                        await loadChat(user, currentUser, socket);
                    }
                    await populateUsersList(socket, currentUser);
                } catch (error) {
                    console.error('Erreur lors du déblocage:', error);
                    showCustomAlert('Erreur lors du déblocage.', 'error');
                }
            };
        }
if (reportUserBtn) {
    reportUserBtn.onclick = () => {
        console.log('Clic sur Signaler l\'utilisateur');
        reportForm.classList.toggle('active');
        console.log('État de reportForm:', reportForm.classList.contains('active'));
        if (reportForm.classList.contains('active')) reportReason.focus();
    };
} else {
    console.warn('Bouton #reportUserBtn non trouvé dans le DOM');
}

if (submitReportBtn) {
    console.log('Bouton #submitReportBtn trouvé dans le DOM'); // Log de débogage
    submitReportBtn.onclick = async () => {
        const reason = reportReason.value.trim();
        if (!reason) {
            console.log('Raison vide, affichage de l\'alerte');
            showCustomAlert('Veuillez entrer une raison pour le signalement.', 'error');
            return;
        }
        try {
            console.log(`Envoi du signalement: userId=${currentUser.id}, reportedUserId=${userId}, raison=${reason}`);
            const response = await fetch(`http://localhost:400/report-user/${currentUser.id}/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });
            console.log('Réponse serveur:', response.status, response.statusText);
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur serveur:', errorData);
                throw new Error(errorData.message || 'Erreur lors du signalement');
            }
            showCustomAlert('Utilisateur signalé avec succès.', 'success');
            reportForm.classList.remove('active');
            reportReason.value = '';
        } catch (error) {
            console.error('Erreur lors du signalement:', error);
            showCustomAlert(`Erreur lors du signalement: ${error.message}`, 'error');
        }
    };
} else {
    console.warn('Bouton #submitReportBtn non trouvé dans le DOM'); // Log si le bouton n'existe pas
}

if (!reportForm) {
    console.warn('Formulaire #reportForm non trouvé dans le DOM');
}

if (!reportReason) {
    console.warn('Textarea #reportReason non trouvé dans le DOM');
}

if (cancelReportBtn) {
    console.log('Bouton #cancelReportBtn trouvé dans le DOM');
    cancelReportBtn.onclick = () => {
        console.log('Clic sur Annuler');
        reportForm.classList.remove('active');
        reportReason.value = '';
    };
} else {
    console.warn('Bouton #cancelReportBtn non trouvé dans le DOM');
}
        if (deleteConversationBtn) {
            deleteConversationBtn.onclick = async () => {
                try {
                    const response = await fetch(`http://localhost:400/private-messages/${currentUser.id}/${userId}`, {
                        method: 'DELETE',
                    });
                    if (!response.ok) throw new Error('Erreur lors de la suppression');
                    showCustomAlert('Conversation supprimée avec succès.', 'success');
                    displayWelcomeMessage();
                    setCurrentChatUserId(null);
                    profileSidebar.classList.add('hidden');
                    profileSidebar.classList.remove('active');
                    chatSidebar.classList.remove('active');
                    chatSidebar.classList.add('hidden');
                    await populateUsersList(socket, currentUser);
                } catch (error) {
                    console.error('Erreur lors de la suppression:', error);
                    showCustomAlert('Erreur lors de la suppression.', 'error');
                }
            };
        }
    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        showCustomAlert('Erreur lors du chargement du profil.', 'error');
    }
}

function showCustomAlert(message, type = 'success') {
    const alertElement = document.createElement('div');
    alertElement.classList.add('custom-alert', type);
    alertElement.innerHTML = `
        <span class="alert-message">${message}</span>
        <button class="alert-close" aria-label="Fermer">✖</button>
    `;
    document.body.appendChild(alertElement);
    setTimeout(() => alertElement.classList.add('show'), 100);
    const closeButton = setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => alertElement.remove(), 300);
    }, 3000);
    alertElement.querySelector('.alert-close').addEventListener('click', () => {
        clearTimeout(closeButton);
        alertElement.classList.remove('show');
        setTimeout(() => alertElement.remove(), 300);
    });
}

export function initializeChat(socket) {
    if (!currentUser) {
        console.warn('Utilisateur non connecté. Redirection vers la page de connexion.');
        window.location.href = 'login.html';
        return;
    }

    displayWelcomeMessage();
    populateUsersList(socket, currentUser);

    socket.on('user blocked', ({ userId, blockedUserId }) => {
        if (userId === currentUser.id || blockedUserId === currentUser.id) {
            populateUsersList(socket, currentUser);
            if (getCurrentChatUserId() === blockedUserId) {
                document.querySelector('#chat-input').disabled = true;
                document.querySelector('#stickerBtn').disabled = true;
                document.querySelector('#chat-messages').innerHTML = '<p>Conversation bloquée.</p>';
            }
        }
    });

    socket.on('user unblocked', ({ userId, blockedUserId }) => {
        if (userId === currentUser.id || blockedUserId === currentUser.id) {
            populateUsersList(socket, currentUser);
            if (getCurrentChatUserId() === blockedUserId) {
                const user = allUsers.find(u => u.id === blockedUserId);
                if (user) loadChat(user, currentUser, socket);
            }
        }
    });

    socket.on('conversation deleted', ({ senderId, receiverId }) => {
        if (
            (senderId === currentUser.id && receiverId === getCurrentChatUserId()) ||
            (receiverId === currentUser.id && senderId === getCurrentChatUserId())
        ) {
            displayWelcomeMessage();
            setCurrentChatUserId(null);
            const chatSidebar = document.querySelector('#chatSidebar');
            if (chatSidebar) {
                chatSidebar.classList.remove('active');
                chatSidebar.classList.add('hidden');
            }
            populateUsersList(socket, currentUser);
        }
    });

    socket.on('error', ({ message }) => {
        console.error('Erreur Socket.IO:', message);
        showCustomAlert(`Erreur : ${message}`, 'error');
    });
}