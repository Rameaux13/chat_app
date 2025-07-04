import { populateUsersList, loadChatUserProfile } from './chat.js';
import { initializeUI } from './parametre.js';
import { populateRoomsList, loadRoomProfile } from './salle.js';
import { getCurrentChatUserId, setCurrentChatUserId } from './state.js';
import io from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('main.js loaded');

    const socket = io('http://localhost:400', {
        withCredentials: true,
        transports: ['websocket'],
    });

    const themeToggleButton = document.querySelector('.theme-toggle');
    const htmlElement = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleButton.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        themeToggleButton.textContent = theme === 'light' ? '☀️' : '🌙';
    }

    let currentUser = null;
    const userData = localStorage.getItem('currentUser');
    if (userData && userData !== 'undefined') {
        try {
            currentUser = JSON.parse(userData);
        } catch (error) {
            console.error('Erreur lors du parsing de currentUser:', error);
            localStorage.removeItem('currentUser');
        }
    }

    if (!currentUser || !currentUser.id) {
        console.warn('Utilisateur non connecté ou données invalides.');
        const welcomeSection = document.querySelector('#welcome-section');
        welcomeSection.innerHTML = `
            <div class="welcome-content">
                <h1>Erreur</h1>
                <p>Veuillez vous reconnecter pour accéder à l'application.</p>
                <a href="login.html" class="cta-button">Se connecter</a>
            </div>
        `;
        return;
    }

    initializeUI(currentUser);

    socket.on('connect', () => {
        console.log('Connecté à Socket.IO');
        socket.emit('register user', currentUser);
    });

    socket.on('connect_error', (error) => {
        console.error('Erreur de connexion Socket.IO:', error);
        showCustomAlert('Erreur de connexion au serveur.', 'error');
    });

    socket.on('room delete', async ({ roomId }) => {
        console.log(`Salle ${roomId} supprimée`);
        if (document.querySelector('.rooms-container.active')) {
            await populateRoomsList(socket, currentUser);
            if (currentRoom && currentRoom.id === roomId) {
                currentRoom = null;
                const roomChatMessages = document.querySelector('#room-chat-messages');
                roomChatMessages.innerHTML = `
                    <div class="welcome-message">
                        <h3>Bienvenue dans les salles !</h3>
                        <p>Sélectionnez une salle pour commencer à discuter.</p>
                    </div>
                `;
                document.querySelector('#room-chat-heading').textContent = 'Salle';
                document.querySelector('#room-chat-input').disabled = true;
                document.querySelector('#room-chat-form').style.display = 'none';
                document.querySelector('#openRoomProfileSidebar').disabled = true;
                const roomProfileSidebar = document.querySelector('#roomProfileSidebar');
                roomProfileSidebar.classList.remove('active');
                roomProfileSidebar.classList.add('hidden');
                document.querySelector('.room-chat-sidebar').classList.remove('with-profile');
            }
        }
    });

    socket.on('room created', async (roomData) => {
        console.log('Nouvelle salle créée:', roomData);
        if (document.querySelector('.rooms-container.active')) {
            await populateRoomsList(socket, currentUser);
            const roomItem = document.querySelector(`.room-item[data-room-id="${roomData.id}"]`);
            if (roomItem) {
                roomItem.click();
                console.log(`Salle ${roomData.id} sélectionnée automatiquement`);
            } else {
                console.warn(`Salle ${roomData.id} non trouvée dans la liste`);
            }
        }
    });

    socket.on('private message', (messageData) => {
        console.log('Message privé reçu:', messageData);
        const currentChatId = getCurrentChatUserId();
        console.log('Conversation active (currentChatUserId):', currentChatId);

        const chatMessages = document.querySelector('#chat-messages');
        if (!chatMessages) {
            console.warn('Conteneur #chat-messages non trouvé');
            return;
        }

        if (!messageData.user || !messageData.receiver) {
            console.error('Données utilisateur ou destinataire manquantes:', messageData);
            return;
        }

        // Afficher le message si la conversation est active
        if (
            (messageData.user.id === currentUser.id && messageData.receiver.id === currentChatId) ||
            (messageData.user.id === currentChatId && messageData.receiver.id === currentUser.id)
        ) {
            const isSent = messageData.user.id === currentUser.id;
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', isSent ? 'sent' : 'received');
            if (messageData.is_sticker) {
                messageElement.classList.add('sticker');
            }
            const messageContainer = document.createElement('div');
            messageContainer.classList.add('message-container');
            const profilePic = document.createElement('div');
            profilePic.classList.add('message-profile-pic');
            const profilePicUrl = messageData.user.profile_pic ? encodeURI(messageData.user.profile_pic) : '';
            if (profilePicUrl && !messageData.is_sticker) {
                profilePic.style.backgroundImage = `url(${profilePicUrl})`;
                profilePic.classList.add('has-image');
            } else {
                const prenomInitial = messageData.user.prenom?.charAt(0) || 'U';
                const nomInitial = messageData.user.nom?.charAt(0) || '';
                profilePic.textContent = prenomInitial + nomInitial;
            }
            const contentElement = document.createElement(messageData.is_sticker ? 'img' : 'p');
            if (messageData.is_sticker) {
                contentElement.src = messageData.content;
                contentElement.alt = 'Sticker';
            } else {
                contentElement.textContent = messageData.content || '[Contenu vide]';
            }
            const timestampElement = document.createElement('div');
            timestampElement.classList.add('message-timestamp');
            const messageDate = new Date(messageData.created_at);
            const formattedDate = `${messageDate.getDate().toString().padStart(2, '0')}/${(messageDate.getMonth() + 1).toString().padStart(2, '0')}/${messageDate.getFullYear()}`;
            const formattedTime = `${messageDate.getHours().toString().padStart(2, '0')}:${messageDate.getMinutes().toString().padStart(2, '0')}`;
            timestampElement.textContent = `${formattedDate} ${formattedTime}`;
            messageContainer.appendChild(profilePic);
            messageContainer.appendChild(contentElement);
            messageElement.appendChild(messageContainer);
            messageElement.appendChild(timestampElement);
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            console.log(`Message affiché pour user:${currentChatId}`);
        } else {
            // Notifier pour les messages d'autres conversations
            const otherUser = messageData.user.id === currentUser.id ? messageData.receiver : messageData.user;
            showCustomAlert(`Nouveau message de ${otherUser.prenom || 'Inconnu'} ${otherUser.nom || ''}`, 'info');
            console.log('Message reçu mais conversation non active:', messageData);
        }
    });

    socket.on('room archive', () => {
        if (document.querySelector('.rooms-container.active')) {
            populateRoomsList(socket, currentUser);
        }
    });

    const navItems = document.querySelectorAll('.nav-item');
    const containers = document.querySelectorAll(
        '.discussions-container, .rooms-container, .settings-container'
    );
    const sections = document.querySelectorAll('.section');

    function showSection(sectionId) {
        console.log(`Affichage de la section: ${sectionId}`);
        containers.forEach(container => container.classList.remove('active'));
        sections.forEach(section => section.classList.remove('active'));

        const sidebars = [
            'usersSidebar',
            'chatSidebar',
            'profileSidebar',
            'roomsSidebar',
            'roomChatSidebar',
            'roomProfileSidebar',
        ];
        sidebars.forEach(id => {
            const sidebar = document.querySelector(`#${id}`);
            if (sidebar) {
                sidebar.classList.remove('active');
                sidebar.classList.add('hidden');
            }
        });

        const targetSection = document.querySelector(`#${sectionId}-section`);
        const targetContainer = document.querySelector(`.${sectionId}-container`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        if (targetContainer) {
            targetContainer.classList.add('active');
        }

        if (sectionId === 'discussions') {
            document.querySelector('#usersSidebar').classList.add('active');
            document.querySelector('#usersSidebar').classList.remove('hidden');
            document.querySelector('#chatSidebar').classList.add('active');
            document.querySelector('#chatSidebar').classList.remove('hidden');
            populateUsersList(socket, currentUser);
        } else if (sectionId === 'rooms') {
            document.querySelector('#roomsSidebar').classList.add('active');
            document.querySelector('#roomsSidebar').classList.remove('hidden');
            document.querySelector('#roomChatSidebar').classList.add('active');
            document.querySelector('#roomChatSidebar').classList.remove('hidden');
            populateRoomsList(socket, currentUser);
        } else if (sectionId === 'settings') {
            // Recharger les données utilisateur depuis le serveur
            fetch(`http://localhost:400/users/${currentUser.id}`)
                .then(response => response.json())
                .then(user => {
                    currentUser = {
                        ...currentUser,
                        ...user,
                        profile_pic: user.profile_pic,
                    };
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    initializeUI(currentUser);
                })
                .catch(error => {
                    console.error('Erreur lors du chargement des données utilisateur:', error);
                    initializeUI(currentUser); // Fallback sur les données locales
                });
        }

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionId) {
                item.classList.add('active');
            }
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            showSection(section);
        });
    });

    document.querySelector('.user-profile').addEventListener('click', () => {
        showSection('settings');
    });

    const openProfileSidebar = document.querySelector('#openProfileSidebar');
    if (openProfileSidebar) {
        openProfileSidebar.addEventListener('click', () => {
            const profileSidebar = document.querySelector('#profileSidebar');
            profileSidebar.classList.remove('hidden');
            profileSidebar.classList.add('active');
            document.querySelector('.chat-sidebar').classList.add('with-profile');
            loadChatUserProfile(socket);
        });
    } else {
        console.warn('Element #openProfileSidebar not found in DOM');
    }

    document.querySelector('#closeProfileSidebar').addEventListener('click', () => {
        const profileSidebar = document.querySelector('#profileSidebar');
        profileSidebar.classList.remove('active');
        profileSidebar.classList.add('hidden');
        document.querySelector('.chat-sidebar').classList.remove('with-profile');
    });

    document.querySelector('#closeRoomProfileSidebar').addEventListener('click', () => {
        const roomProfileSidebar = document.querySelector('#roomProfileSidebar');
        roomProfileSidebar.classList.remove('active');
        roomProfileSidebar.classList.add('hidden');
        document.querySelector('.room-chat-sidebar').classList.remove('with-profile');
    });

    showSection('welcome');
});

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