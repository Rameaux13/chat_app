export async function populateArchivesList(socket, currentUser) {
  console.log('Chargement des archives pour', currentUser);
  const archivesList = document.getElementById('archives-list');
  archivesList.innerHTML = '<p>Chargement...</p>';

  try {
    const privateResponse = await fetch(`http://localhost:400/private-messages/archived/${currentUser.id}`);
    if (!privateResponse.ok) throw new Error('Erreur lors de la récupération des conversations archivées');
    const privateConversations = await privateResponse.json();

    const roomsResponse = await fetch(`http://localhost:400/rooms/archived/${currentUser.id}`);
    if (!roomsResponse.ok) throw new Error('Erreur lors de la récupération des salles archivées');
    const archivedRooms = await roomsResponse.json();

    archivesList.innerHTML = '';

    if (privateConversations.length === 0 && archivedRooms.length === 0) {
      archivesList.innerHTML = '<p>Aucune conversation ou salle archivée.</p>';
      return;
    }

    privateConversations.forEach(conversation => {
      const archiveItem = document.createElement('div');
      archiveItem.classList.add('archive-item');
      archiveItem.dataset.type = 'private';
      archiveItem.dataset.userId = conversation.userId;
      const profilePicUrl = conversation.profile_pic && !conversation.profile_pic.startsWith('http')
        ? `http://localhost:400${conversation.profile_pic}`
        : conversation.profile_pic || '';
      archiveItem.innerHTML = `
        <div class="archive-pic${profilePicUrl ? ' has-image' : ''}" style="background-image: ${profilePicUrl ? `url(${profilePicUrl})` : 'none'}">
          ${profilePicUrl ? '' : conversation.userName.charAt(0)}
        </div>
        <span class="archive-title">${conversation.userName}</span>
      `;
      archiveItem.addEventListener('click', () => loadArchivedConversation(currentUser, conversation.userId, socket));
      archivesList.appendChild(archiveItem);
    });

    archivedRooms.forEach(room => {
      const archiveItem = document.createElement('div');
      archiveItem.classList.add('archive-item');
      archiveItem.dataset.type = 'room';
      archiveItem.dataset.roomId = room.id;
      archiveItem.innerHTML = `
        <div class="archive-pic">${room.name.charAt(0)}</div>
        <span class="archive-title">${room.name}</span>
      `;
      archiveItem.addEventListener('click', () => loadArchivedRoom(currentUser, room.id, socket));
      archivesList.appendChild(archiveItem);
    });
  } catch (error) {
    console.error('Erreur lors du chargement des archives:', error);
    archivesList.innerHTML = '<p>Erreur lors du chargement des archives.</p>';
  }
}

async function loadArchivedConversation(currentUser, otherUserId, socket) {
  const archivesContainer = document.querySelector('.archives-container');
  let chatSidebar = document.querySelector('#archiveChatSidebar');
  if (!chatSidebar) {
    chatSidebar = document.createElement('aside');
    chatSidebar.id = 'archiveChatSidebar';
    chatSidebar.classList.add('chat-sidebar', 'active');
    chatSidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="chat-header-left">
          <div id="archiveChatHeaderPic" class="archive-pic"></div>
          <h2 id="archiveChatHeading">Conversation archivée</h2>
        </div>
        <div class="chat-header-actions">
          <button id="restoreConversationBtn" class="action-btn restore-btn">Restaurer</button>
          <button id="deleteConversationBtn" class="action-btn delete-btn">Supprimer</button>
        </div>
      </div>
      <div id="archiveChatMessages" class="chat-messages"></div>
      <div class="chat-input-container">
        <form id="archiveChatForm" style="display: none;">
          <span class="sticker-icon" id="archiveStickerBtn" role="button" aria-label="Ouvrir les stickers">😊</span>
          <input type="text" id="archiveChatInput" placeholder="Votre message..." aria-label="Message" disabled>
          <button type="submit">➤</button>
        </form>
      </div>
    `;
    archivesContainer.appendChild(chatSidebar);
  } else {
    chatSidebar.classList.remove('hidden');
    chatSidebar.classList.add('active');
  }

  const chatMessages = chatSidebar.querySelector('#archiveChatMessages');
  const chatHeaderPic = chatSidebar.querySelector('#archiveChatHeaderPic');
  const chatHeading = chatSidebar.querySelector('#archiveChatHeading');
  const restoreBtn = chatSidebar.querySelector('#restoreConversationBtn');
  const deleteBtn = chatSidebar.querySelector('#deleteConversationBtn');

  chatMessages.innerHTML = '<p>Chargement des messages...</p>';

  try {
    const userResponse = await fetch(`http://localhost:400/users/${otherUserId}`);
    if (!userResponse.ok) throw new Error('Utilisateur non trouvé');
    const user = await userResponse.json();

    chatHeading.textContent = `${user.prenom} ${user.nom}`;
    const profilePicUrl = user.profile_pic && !user.profile_pic.startsWith('http')
      ? `http://localhost:400${user.profile_pic}`
      : user.profile_pic || '';
    chatHeaderPic.style.backgroundImage = profilePicUrl ? `url(${profilePicUrl})` : 'none';
    chatHeaderPic.classList.toggle('has-image', !!profilePicUrl);
    chatHeaderPic.textContent = profilePicUrl ? '' : user.prenom.charAt(0) + user.nom.charAt(0);

    const messagesResponse = await fetch(`http://localhost:400/private-messages/archived/messages/${currentUser.id}/${otherUserId}`);
    if (!messagesResponse.ok) throw new Error('Erreur lors de la récupération des messages');
    const messages = await messagesResponse.json();

    chatMessages.innerHTML = '';
    messages.forEach(message => {
      const isSent = message.user.id === currentUser.id;
      const messageElement = document.createElement('div');
      messageElement.classList.add('message', isSent ? 'sent' : 'received');
      const messageContainer = document.createElement('div');
      messageContainer.classList.add('message-container');
      const profilePic = document.createElement('div');
      profilePic.classList.add('message-profile-pic');
      const msgProfilePicUrl = message.user.profile_pic && !message.user.profile_pic.startsWith('http')
        ? `http://localhost:400${message.user.profile_pic}`
        : message.user.profile_pic || '';
      if (msgProfilePicUrl) {
        profilePic.style.backgroundImage = `url(${msgProfilePicUrl})`;
        profilePic.classList.add('has-image');
      } else {
        profilePic.textContent = message.user.prenom.charAt(0) + message.user.nom.charAt(0);
      }
      const contentElement = document.createElement('p');
      contentElement.textContent = message.content;
      const timestampElement = document.createElement('div');
      timestampElement.classList.add('message-timestamp');
      timestampElement.textContent = new Date(message.created_at).toLocaleTimeString();
      messageContainer.appendChild(profilePic);
      messageContainer.appendChild(contentElement);
      messageElement.appendChild(messageContainer);
      messageElement.appendChild(timestampElement);
      chatMessages.appendChild(messageElement);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;

    restoreBtn.onclick = async () => {
      try {
        const response = await fetch(`http://localhost:400/private-messages/archive/${currentUser.id}/${otherUserId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_archived: false }),
        });
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        alert(data.message);
        const archiveItem = document.querySelector(`.archive-item[data-user-id="${otherUserId}"]`);
        if (archiveItem) archiveItem.remove();
        chatSidebar.classList.add('hidden');
        chatSidebar.classList.remove('active');
      } catch (error) {
        console.error('Erreur lors de la restauration de la conversation:', error);
        alert('Erreur lors de la restauration.');
      }
    };

    deleteBtn.onclick = async () => {
      if (!confirm('Voulez-vous vraiment supprimer cette conversation ?')) return;
      try {
        const response = await fetch(`http://localhost:400/private-messages/${currentUser.id}/${otherUserId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        alert(data.message);
        const archiveItem = document.querySelector(`.archive-item[data-user-id="${otherUserId}"]`);
        if (archiveItem) archiveItem.remove();
        chatSidebar.classList.add('hidden');
        chatSidebar.classList.remove('active');
      } catch (error) {
        console.error('Erreur lors de la suppression de la conversation:', error);
        alert('Erreur lors de la suppression.');
      }
    };
  } catch (error) {
    console.error('Erreur lors du chargement de la conversation archivée:', error);
    chatMessages.innerHTML = '<p>Erreur lors du chargement des messages.</p>';
  }
}

async function loadArchivedRoom(currentUser, roomId, socket) {
  const archivesContainer = document.querySelector('.archives-container');
  let chatSidebar = document.querySelector('#archiveChatSidebar');
  if (!chatSidebar) {
    chatSidebar = document.createElement('aside');
    chatSidebar.id = 'archiveChatSidebar';
    chatSidebar.classList.add('chat-sidebar', 'active');
    chatSidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="chat-header-left">
          <div id="archiveChatHeaderPic" class="archive-pic"></div>
          <h2 id="archiveChatHeading">Salle archivée</h2>
        </div>
        <div class="chat-header-actions">
          <button id="restoreRoomBtn" class="action-btn restore-btn">Restaurer</button>
          <button id="deleteRoomBtn" class="action-btn delete-btn">Supprimer</button>
        </div>
      </div>
      <div id="archiveChatMessages" class="chat-messages"></div>
      <div class="chat-input-container">
        <form id="archiveChatForm" style="display: none;">
          <span class="sticker-icon" id="archiveStickerBtn" role="button" aria-label="Ouvrir les stickers">😊</span>
          <input type="text" id="archiveChatInput" placeholder="Votre message..." aria-label="Message" disabled>
          <button type="submit">➤</button>
        </form>
      </div>
    `;
    archivesContainer.appendChild(chatSidebar);
  } else {
    chatSidebar.classList.remove('hidden');
    chatSidebar.classList.add('active');
  }

  const chatMessages = chatSidebar.querySelector('#archiveChatMessages');
  const chatHeaderPic = chatSidebar.querySelector('#archiveChatHeaderPic');
  const chatHeading = chatSidebar.querySelector('#archiveChatHeading');
  const restoreBtn = chatSidebar.querySelector('#restoreRoomBtn');
  const deleteBtn = chatSidebar.querySelector('#deleteRoomBtn');

  chatMessages.innerHTML = '<p>Chargement des messages...</p>';

  try {
    const roomsResponse = await fetch(`http://localhost:400/rooms/archived/${currentUser.id}`);
    if (!roomsResponse.ok) throw new Error('Erreur réseau');
    const rooms = await roomsResponse.json();
    const room = rooms.find(r => r.id === parseInt(roomId));
    if (!room) throw new Error('Salle non trouvée');

    chatHeading.textContent = room.name;
    chatHeaderPic.textContent = room.name.charAt(0);
    chatHeaderPic.classList.remove('has-image');

    const messagesResponse = await fetch(`http://localhost:400/room-messages/${roomId}`);
    if (!messagesResponse.ok) {
      const errorData = await messagesResponse.json();
      throw new Error(errorData.error || 'Erreur réseau');
    }
    const messages = await messagesResponse.json();
    if (!Array.isArray(messages)) {
      console.error('Les messages ne sont pas un tableau:', messages);
      throw new Error('Format de données invalide');
    }

    chatMessages.innerHTML = '';
    if (messages.length === 0) {
      chatMessages.innerHTML = '<p>Aucun message dans cette salle archivée.</p>';
    } else {
      messages.forEach(message => {
        const isSent = message.user.id === currentUser.id;
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', isSent ? 'sent' : 'received');
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container');
        const profilePic = document.createElement('div');
        profilePic.classList.add('message-profile-pic');
        const msgProfilePicUrl = message.user.profile_pic && !message.user.profile_pic.startsWith('http')
          ? `http://localhost:400${message.user.profile_pic}`
          : message.user.profile_pic || '';
        if (msgProfilePicUrl) {
          profilePic.style.backgroundImage = `url(${msgProfilePicUrl})`;
          profilePic.classList.add('has-image');
        } else {
          profilePic.textContent = message.user.prenom.charAt(0) + message.user.nom.charAt(0);
        }
        const contentElement = document.createElement('p');
        contentElement.textContent = message.content;
        const timestampElement = document.createElement('div');
        timestampElement.classList.add('message-timestamp');
        timestampElement.textContent = new Date(message.created_at).toLocaleTimeString();
        messageContainer.appendChild(profilePic);
        messageContainer.appendChild(contentElement);
        messageElement.appendChild(messageContainer);
        messageElement.appendChild(timestampElement);
        chatMessages.appendChild(messageElement);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    restoreBtn.onclick = async () => {
      try {
        const response = await fetch(`http://localhost:400/rooms/archive/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_archived: false }),
        });
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        alert(data.message);
        const archiveItem = document.querySelector(`.archive-item[data-room-id="${roomId}"]`);
        if (archiveItem) archiveItem.remove();
        chatSidebar.classList.add('hidden');
        chatSidebar.classList.remove('active');
      } catch (error) {
        console.error('Erreur lors de la restauration de la salle:', error);
        alert('Erreur lors de la restauration.');
      }
    };

    deleteBtn.onclick = async () => {
      if (!confirm('Voulez-vous vraiment supprimer cette salle ?')) return;
      try {
        const response = await fetch(`http://localhost:400/rooms/${roomId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        alert(data.message);
        const archiveItem = document.querySelector(`.archive-item[data-room-id="${roomId}"]`);
        if (archiveItem) archiveItem.remove();
        chatSidebar.classList.add('hidden');
        chatSidebar.classList.remove('active');
      } catch (error) {
        console.error('Erreur lors de la suppression de la salle:', error);
        alert('Erreur lors de la suppression.');
      }
    };
  } catch (error) {
    console.error('Erreur lors du chargement de la salle archivée:', error);
    chatMessages.innerHTML = `<p>Erreur lors du chargement des messages: ${error.message}</p>`;
  }
}