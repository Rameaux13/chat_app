let currentChatUserId = null;

export function getCurrentChatUserId() {
    return currentChatUserId;
}

export function setCurrentChatUserId(userId) {
    console.log(`Mise à jour de currentChatUserId: ${userId}`);
    currentChatUserId = userId;
}