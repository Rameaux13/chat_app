let currentRoom = null;
let allRooms = [];

export async function populateRoomsList(socket, currentUser) {
  try {
    const response = await fetch('http://localhost:400/rooms');
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    const rooms = await response.json();
    allRooms = rooms;
    const roomsList = document.querySelector('#rooms-list');
    const roomsSearch = document.querySelector('#roomsSearch');
    roomsList.innerHTML = '';

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

    const displayRooms = (filteredRooms) => {
      roomsList.innerHTML = '';
      filteredRooms.forEach(room => {
        const roomItem = document.createElement('div');
        roomItem.classList.add('room-item');
        roomItem.dataset.roomId = room.id;
        roomItem.innerHTML = `
          <div class="room-item-name">${room.name}</div>
        `;
        roomItem.addEventListener('click', () => loadRoomChat(room, currentUser, socket));
        roomsList.appendChild(roomItem);
      });
    };

    displayRooms(rooms);

    roomsSearch.addEventListener('input', () => {
      const searchTerm = roomsSearch.value.trim().toLowerCase();
      const filteredRooms = allRooms.filter(room => room.name.toLowerCase().includes(searchTerm));
      displayRooms(filteredRooms);
    });

    const createRoomBtn = document.querySelector('#createRoomBtn');
    createRoomBtn.removeEventListener('click', handleCreateRoomClick);
    createRoomBtn.addEventListener('click', handleCreateRoomClick);

    function handleCreateRoomClick() {
      const modal = document.querySelector('#createRoomModal');
      modal.classList.add('active');
    }

    const createRoomForm = document.querySelector('#createRoomForm');
    createRoomForm.removeEventListener('submit', handleCreateRoomSubmit);
    createRoomForm.addEventListener('submit', handleCreateRoomSubmit);

    async function handleCreateRoomSubmit(e) {
      e.preventDefault();
      const roomName = document.querySelector('#roomNameInput').value.trim();
      const roomDescription = document.querySelector('#roomDescriptionInput').value.trim();
      if (roomName) {
        try {
          const response = await fetch('http://localhost:400/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: roomName,
              description: roomDescription || '',
              user_id: currentUser.id,
            }),
          });
          if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
          const result = await response.json();
          document.querySelector('#createRoomModal').classList.remove('active');
          document.querySelector('#createRoomForm').reset();
          console.log('Salle créée avec ID:', result.roomId);
          
          // ✅ CORRECTION : Recharger la liste des salles après création
          await populateRoomsList(socket, currentUser);
          
        } catch (error) {
          console.error('Erreur lors de la création de la salle:', error);
          alert('Erreur lors de la création de la salle.');
        }
      }
    }

    const cancelRoomBtn = document.querySelector('#cancelRoomBtn');
    cancelRoomBtn.removeEventListener('click', handleCancelRoomClick);
    cancelRoomBtn.addEventListener('click', handleCancelRoomClick);

    function handleCancelRoomClick() {
      document.querySelector('#createRoomModal').classList.remove('active');
      document.querySelector('#createRoomForm').reset();
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des salles:', error);
    document.querySelector('#rooms-list').innerHTML = '<p>Erreur lors du chargement.</p>';
  }
}

async function loadRoomChat(room, currentUser, socket) {
  if (currentRoom && currentRoom.id !== room.id) {
    socket.emit('leave room', { user_id: currentUser.id, room_id: currentRoom.id });
    console.log(`Utilisateur ${currentUser.id} a quitté la salle room:${currentRoom.id}`);
  }

  currentRoom = { ...room, currentUser, socket };
  const roomChatSidebar = document.querySelector('#roomChatSidebar');
  const roomChatHeading = document.querySelector('#room-chat-heading');
  const roomChatMessages = document.querySelector('#room-chat-messages');
  const roomChatForm = document.querySelector('#room-chat-form');
  const roomChatInput = document.querySelector('#room-chat-input');
  const openRoomProfileSidebar = document.querySelector('#openRoomProfileSidebar');
  const stickerBtn = document.querySelector('#roomStickerBtn');
  const stickerPicker = document.querySelector('#roomStickerPicker');
  const stickerList = document.querySelector('#roomStickerList');

  roomChatSidebar.classList.remove('hidden');
  roomChatSidebar.classList.add('active');
  roomChatHeading.textContent = room.name;
  roomChatMessages.innerHTML = '<p>Chargement...</p>';
  openRoomProfileSidebar.disabled = false;

  let isMember = false;
  try {
    const response = await fetch(`http://localhost:400/room-membership/${currentUser.id}/${room.id}`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    isMember = await response.json();
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'appartenance à la salle:', error);
    alert('Erreur lors de la vérification de votre appartenance à la salle.');
  }

  currentRoom.isMember = isMember;

  const configureForm = async () => {
    if (currentRoom.isMember) {
      roomChatInput.disabled = false;
      roomChatForm.style.display = 'flex';
      stickerBtn.style.display = 'inline-block';
      try {
        const response = await fetch(`http://localhost:400/room-messages/${room.id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur réseau');
        }
        const messages = await response.json();
        if (!Array.isArray(messages)) {
          console.error('Les messages ne sont pas un tableau:', messages);
          throw new Error('Format de données invalide');
        }
        roomChatMessages.innerHTML = '';
        if (messages.length === 0) {
          roomChatMessages.innerHTML = '<p class="no-messages">Aucun message dans cette salle.</p>';
        } else {
          messages.forEach(msg => {
            const isSent = msg.user.id === currentUser.id;
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', isSent ? 'sent' : 'received');
            if (msg.is_sticker) {
              messageElement.classList.add('sticker');
            }
            // ✅ CORRECTION : Erreur de syntaxe corrigée
            const messageContainer = document.createElement('div');
            messageContainer.classList.add('message-container');
            const profilePic = document.createElement('div');
            profilePic.classList.add('message-profile-pic');
            const msgProfilePicUrl = msg.user.profile_pic && !msg.user.profile_pic.startsWith('http')
              ? `http://localhost:400${msg.user.profile_pic}`
              : msg.user.profile_pic || '';
            if (msgProfilePicUrl) {
              profilePic.style.backgroundImage = `url(${msgProfilePicUrl})`;
              profilePic.classList.add('has-image');
            } else {
              profilePic.textContent = msg.user.prenom.charAt(0) + msg.user.nom.charAt(0);
            }
            const contentElement = document.createElement(msg.is_sticker ? 'img' : 'p');
            if (msg.is_sticker) {
              contentElement.src = msg.content;
              contentElement.alt = 'Sticker';
            } else {
              contentElement.textContent = msg.content;
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
            roomChatMessages.appendChild(messageElement);
          });
          roomChatMessages.scrollTop = roomChatMessages.scrollHeight;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des messages de la salle:', error);
        roomChatMessages.innerHTML = `<p>Erreur lors du chargement: ${error.message}</p>`;
      }
    } else {
      roomChatInput.disabled = true;
      roomChatForm.style.display = 'none';
      stickerBtn.style.display = 'none';
      roomChatMessages.innerHTML = `
        <div class="welcome-message">
          <p>Vous devez rejoindre la salle "${room.name}" pour envoyer des messages.</p>
        </div>
      `;
    }
    console.log(`Configuration du formulaire pour room:${room.id}, isMember:${currentRoom.isMember}`);
  };
  await configureForm();

  socket.emit('join room', { user_id: currentUser.id, room_id: room.id });
  console.log(`Utilisateur ${currentUser.id} a rejoint la salle room:${room.id}`);

  socket.off('error');
  socket.on('error', (data) => {
    console.error('Erreur Socket.IO:', data.message);
    alert(data.message);
  });

  socket.off('room membership update');
  socket.on('room membership update', async ({ userId, roomId, joined }) => {
    if (userId === currentUser.id && roomId === currentRoom.id) {
      console.log(`Mise à jour de l'adhésion: user:${userId} ${joined ? 'a rejoint' : 'a quitté'} room:${roomId}`);
      currentRoom.isMember = joined;
      await configureForm();
      const joinRoomBtn = document.querySelector('#joinRoomBtn');
      const leaveRoomBtn = document.querySelector('#leaveRoomBtn');
      if (joinRoomBtn && leaveRoomBtn) {
        joinRoomBtn.style.display = joined ? 'none' : 'block';
        leaveRoomBtn.style.display = joined ? 'block' : 'none';
      }
    }
  });

  if (isMember) {
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
      console.log(`Bouton sticker cliqué pour la salle ${room.id}`);
      stickerPicker.classList.toggle('active');
      if (stickerPicker.classList.contains('active')) {
        console.log('Chargement des stickers...');
        loadStickers();
      } else {
        console.log('Sélecteur de stickers fermé');
      }
    });
  }

  openRoomProfileSidebar.onclick = () => {
    console.log(`Ouverture du profil de la salle ${room.id}`);
    loadRoomProfile();
    const roomProfileSidebar = document.querySelector('#roomProfileSidebar');
    roomProfileSidebar.classList.remove('hidden');
    roomProfileSidebar.classList.add('active');
    document.querySelector('.room-chat-sidebar').classList.add('with-profile');
  };

  async function loadStickers() {
    try {
      console.log(`Chargement des stickers pour la salle ${room.id}`);
      const response = await fetch('http://localhost:400/stickers');
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const stickers = await response.json();
      stickerList.innerHTML = '';
      if (stickers.length === 0) {
        stickerList.innerHTML = '<p>Aucun sticker disponible.</p>';
        console.log('Aucun sticker trouvé');
        return;
      }
      stickers.forEach(sticker => {
        const imageUrl = sticker.image_url;
        if (!imageUrl) {
          console.warn(`Sticker ${sticker.id} n'a pas d'image_url`);
          return;
        }
        const stickerItem = document.createElement('div');
        stickerItem.classList.add('sticker-item');
        stickerItem.style.backgroundImage = `url(${imageUrl})`;
        stickerItem.dataset.stickerUrl = imageUrl;
        stickerItem.addEventListener('click', () => {
          console.log(`Envoi du sticker ${imageUrl} à la salle ${room.id}`);
          socket.emit('room message', {
            user: currentUser,
            room_id: room.id,
            content: imageUrl,
            is_sticker: true,
          });
          stickerPicker.classList.remove('active');
        });
        stickerList.appendChild(stickerItem);
      });
      console.log(`Chargé ${stickers.length} stickers`);
    } catch (error) {
      console.error(`Erreur lors du chargement des stickers pour la salle ${room.id}:`, error);
      stickerList.innerHTML = '<p>Impossible de charger les stickers.</p>';
    }
  }

  // ✅ CORRECTION : Suppression du code dupliqué de chargement des messages
  // (Le chargement des messages se fait déjà dans configureForm())

  if (currentRoom.isMember) {
    roomChatForm.onsubmit = (e) => {
      e.preventDefault();
      const content = roomChatInput.value.trim();
      if (content) {
        console.log(`Envoi du message à la salle ${room.id}: ${content}`);
        socket.emit('room message', {
          user: currentUser,
          room_id: room.id,
          content,
          is_sticker: false,
        });
        roomChatInput.value = '';
      }
    };
  }

  socket.off('room message');
  socket.on('room message', (messageData) => {
    console.log('Message de salle reçu:', messageData);
    if (messageData.roomId === currentRoom.id) {
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
      const msgProfilePicUrl = messageData.user.profile_pic && !messageData.user.profile_pic.startsWith('http')
        ? `http://localhost:400${messageData.user.profile_pic}`
        : messageData.user.profile_pic || '';
      if (msgProfilePicUrl) {
        profilePic.style.backgroundImage = `url(${msgProfilePicUrl})`;
        profilePic.classList.add('has-image');
      } else {
        profilePic.textContent = messageData.user.prenom.charAt(0) + messageData.user.nom.charAt(0);
      }
      const contentElement = document.createElement(messageData.is_sticker ? 'img' : 'p');
      if (messageData.is_sticker) {
        contentElement.src = messageData.content;
        contentElement.alt = 'Sticker';
      } else {
        contentElement.textContent = messageData.content;
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
      roomChatMessages.appendChild(messageElement);
      roomChatMessages.scrollTop = roomChatMessages.scrollHeight;
    }
  });
}

export function loadRoomProfile() {
  if (!currentRoom) {
    console.error('Aucune salle sélectionnée.');
    alert('Aucune salle sélectionnée.');
    return;
  }

  const roomProfileSidebar = document.querySelector('#roomProfileSidebar');
  const roomDetailsName = document.querySelector('#roomDetailsName');
  const roomDetailsDescription = document.querySelector('#roomDetailsDescription');
  const roomDetailsCreator = document.querySelector('#roomDetailsCreator');
  const roomDetailsMembers = document.querySelector('#roomDetailsMembers');
  const joinRoomBtn = document.querySelector('#joinRoomBtn');
  const leaveRoomBtn = document.querySelector('#leaveRoomBtn');
  const reportRoomBtn = document.querySelector('#reportRoomBtn');
  const reportForm = document.querySelector('#reportRoomForm');
  const reportReasonInput = document.querySelector('#reportReasonRoom');
  const submitReportBtn = document.querySelector('#submitReportRoomBtn');
  const cancelReportBtn = document.querySelector('#cancelReportBtn');
  const deleteRoomBtn = document.querySelector('#deleteRoomBtn');

  if (!roomProfileSidebar || !roomDetailsName || !roomDetailsDescription || !roomDetailsCreator || !roomDetailsMembers) {
    console.error('Un ou plusieurs éléments du profil de la salle sont manquants dans le DOM.');
    alert('Erreur : Impossible de charger le profil de la salle.');
    return;
  }

  if (!joinRoomBtn || !leaveRoomBtn || !reportRoomBtn || !reportForm || !reportReasonInput || !submitReportBtn || !cancelReportBtn || !deleteRoomBtn) {
    console.error('Un ou plusieurs éléments des actions de la salle sont manquants dans le DOM.');
    alert('Erreur : Impossible de configurer les actions de la salle.');
    return;
  }

  roomProfileSidebar.classList.remove('hidden');
  roomProfileSidebar.classList.add('active');

  roomDetailsName.textContent = currentRoom.name;
  roomDetailsDescription.textContent = currentRoom.description || 'Aucune description';
  roomDetailsCreator.textContent = `Créateur: ${currentRoom.creatorName || 'Inconnu'}`;

  deleteRoomBtn.style.display = currentRoom.currentUser.id === currentRoom.user_id ? 'block' : 'none';

  const updateButtons = (isMember) => {
    joinRoomBtn.style.display = isMember ? 'none' : 'block';
    leaveRoomBtn.style.display = isMember ? 'block' : 'none';
  };

  fetch(`http://localhost:400/room-members/${currentRoom.id}`)
    .then(response => {
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      return response.json();
    })
    .then(members => {
      roomDetailsMembers.textContent = `Membres: ${members.map(m => `${m.prenom} ${m.nom}`).join(', ') || 'Aucun'}`;
    })
    .catch(error => {
      console.error('Erreur lors de la récupération des membres:', error);
      roomDetailsMembers.textContent = 'Erreur lors du chargement des membres';
      alert('Erreur lors du chargement des membres de la salle.');
    });

  fetch(`http://localhost:400/room-membership/${currentRoom.currentUser.id}/${currentRoom.id}`)
    .then(response => {
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      return response.json();
    })
    .then(isMember => {
      currentRoom.isMember = isMember;
      updateButtons(isMember);
    })
    .catch(error => {
      console.error('Erreur lors de la vérification de l\'appartenance à la salle:', error);
      alert('Erreur lors de la vérification de votre appartenance à la salle.');
    });

  joinRoomBtn.onclick = async () => {
    try {
      const response = await fetch(`http://localhost:400/rooms/join/${currentRoom.id}/${currentRoom.currentUser.id}`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }
      currentRoom.isMember = true;
      updateButtons(true);
      loadRoomChat(currentRoom, currentRoom.currentUser, currentRoom.socket);
    } catch (error) {
      console.error('Erreur lors de l\'adhésion à la salle:', error);
      alert(error.message || 'Erreur lors de l\'adhésion à la salle.');
    }
  };

  leaveRoomBtn.onclick = async () => {
    try {
      const response = await fetch(`http://localhost:400/rooms/leave/${currentRoom.id}/${currentRoom.currentUser.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }
      currentRoom.isMember = false;
      updateButtons(false);
      loadRoomChat(currentRoom, currentRoom.currentUser, currentRoom.socket);
    } catch (error) {
      console.error('Erreur lors de la sortie de la salle:', error);
      alert(error.message || 'Erreur lors de la sortie de la salle.');
    }
  };

  reportRoomBtn.onclick = () => {
    reportForm.classList.toggle('hidden');
    if (!reportForm.classList.contains('hidden')) {
      reportReasonInput.focus();
    }
  };

 submitReportBtn.onclick = async () => {
  const reason = reportReasonInput.value.trim();
  if (!reason) {
    alert('Veuillez entrer une raison pour le signalement.');
    return;
  }
  const roomId = parseInt(currentRoom.id, 10);
  const userId = parseInt(currentRoom.currentUser.id, 10);
  if (isNaN(roomId) || isNaN(userId)) {
    console.error('Invalid roomId or userId:', { roomId: currentRoom.id, userId: currentRoom.currentUser.id });
    alert('Erreur : ID de salle ou d\'utilisateur invalide.');
    return;
  }
  console.log('Reporting room:', roomId, 'by user:', userId, 'with reason:', reason);
  console.log('Request URL:', `http://localhost:400/rooms/report/${roomId}/${userId}`);
  try {
    const response = await fetch(`http://localhost:400/rooms/report/${roomId}/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }
    alert('Salle signalée avec succès.');
    reportForm.classList.add('hidden');
    reportReasonInput.value = '';
  } catch (error) {
    console.error('Erreur lors du signalement de la salle:', error);
    alert(error.message || 'Erreur lors du signalement de la salle.');
  }
};
  deleteRoomBtn.onclick = async () => {
    try {
      const response = await fetch(`http://localhost:400/rooms/${currentRoom.id}/${currentRoom.currentUser.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }
      await populateRoomsList(currentRoom.socket, currentRoom.currentUser);
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
      roomProfileSidebar.classList.remove('active');
      roomProfileSidebar.classList.add('hidden');
      document.querySelector('.room-chat-sidebar').classList.remove('with-profile');
    } catch (error) {
      console.error('Erreur lors de la suppression de la salle:', error);
      alert(error.message || 'Erreur lors de la suppression de la salle.');
    }
  };

  currentRoom.socket.off('room membership update');
  currentRoom.socket.on('room membership update', ({ userId, roomId, joined }) => {
    if (userId === currentRoom.currentUser.id && roomId === currentRoom.id) {
      console.log(`Mise à jour de l'adhésion: user:${userId} ${joined ? 'a rejoint' : 'a quitté'} room:${roomId}`);
      currentRoom.isMember = joined;
      updateButtons(joined);
      loadRoomChat(currentRoom, currentRoom.currentUser, currentRoom.socket);
    }
  });
}