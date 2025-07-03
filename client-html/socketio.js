
export function initializeSocket(currentUser) {
    // Initialize Socket.IO client with the server URL
    const socket = io('http://localhost:400', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    // Handle connection event
    socket.on('connect', () => {
        console.log('Connecté à Socket.IO:', socket.id);
        
        // Register the user with the server
        socket.emit('register user', {
            id: currentUser.id,
            prenom: currentUser.prenom,
            nom: currentUser.nom,
            email: currentUser.email,
            profile_pic: currentUser.profile_pic
        });

        // Update socket status indicator
        updateSocketStatus(true);
    });

    // Handle disconnection event
    socket.on('disconnect', () => {
        console.log('Déconnecté de Socket.IO:', socket.id);
        updateSocketStatus(false);
    });

    // Handle connected users update
    socket.on('connected users', (users) => {
        console.log('Utilisateurs connectés reçus:', users);
        // This event can be used to update the users list in chat.js
    });

    // Update socket status indicator in the UI
    function updateSocketStatus(isConnected) {
        const socketStatus = document.querySelector('.socket-status');
        if (socketStatus) {
            socketStatus.classList.toggle('online', isConnected);
        }
    }

    return socket;
}