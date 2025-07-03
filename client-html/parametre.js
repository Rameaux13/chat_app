export async function initializeUI(currentUser) {
    console.log('Initialisation de l\'UI pour', currentUser);
    
    const settingsContent = document.querySelector('.settings-content');
    settingsContent.innerHTML = `
        <h2 id="settings-heading">Paramètres</h2>
        <div class="settings-grid">
            <div class="info-section">
                <h3>Informations personnelles</h3>
                <form id="profileForm" class="settings-form">
                    <div class="form-group">
                        <label for="prenom">Prénom :</label>
                        <input type="text" id="prenom" value="${currentUser.prenom}" required aria-describedby="prenom-error">
                        <span id="prenom-error" class="error hidden">Le prénom doit contenir au moins 2 caractères.</span>
                    </div>
                    <div class="form-group">
                        <label for="nom">Nom :</label>
                        <input type="text" id="nom" value="${currentUser.nom}" required aria-describedby="nom-error">
                        <span id="nom-error" class="error hidden">Le nom doit contenir au moins 2 caractères.</span>
                    </div>
                    <div class="form-group">
                        <label for="telephone">Numéro de téléphone :</label>
                        <input type="tel" id="telephone" value="${currentUser.telephone || ''}" aria-describedby="telephone-error">
                        <span id="telephone-error" class="error hidden">Le numéro de téléphone n'est pas valide.</span>
                    </div>
                    <button type="submit" class="save-btn">Mettre à jour</button>
                </form>
            </div>
            <div class="profile-pic-section">
                <h3>Photo de profil</h3>
                <div class="profile-pic-container" id="userProfilePicSettings" role="img" aria-label="Photo de profil de ${currentUser.prenom} ${currentUser.nom}"></div>
                <form id="profilePicForm" class="profile-pic-form">
                    <label for="profilePicInput" class="file-input-label" aria-label="Choisir une nouvelle photo de profil">Choisir une photo</label>
                    <input type="file" id="profilePicInput" class="custom-file-input" accept="image/*" aria-describedby="profilePic-error">
                    <span id="profilePic-error" class="error hidden">Veuillez sélectionner une image valide.</span>
                    <button type="submit" class="update-pic-btn">Mettre à jour la photo</button>
                </form>
            </div>
        </div>
        <div class="cta-section">
            <button id="logoutBtn" class="cta-button">Se déconnecter</button>
        </div>
    `;

    // Fonction pour vérifier si une image est valide
    async function isImageValid(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok && response.headers.get('content-type').startsWith('image/');
        } catch {
            return false;
        }
    }

    // Fonction pour mettre à jour la photo de profil
   async function updateProfilePic(user) {
    const profilePicNav = document.getElementById('userProfilePic');
    const profilePicSettings = document.getElementById('userProfilePicSettings');
    const defaultInitials = user.prenom.charAt(0) + user.nom.charAt(0);

    console.log('Mise à jour de la photo de profil pour:', user.id, 'URL:', user.profile_pic);

    for (const profilePic of [profilePicNav, profilePicSettings]) {
        if (!profilePic) continue;

        if (user.profile_pic) {
            // Encoder l'URL pour gérer les espaces et caractères spéciaux
            const encodedUrl = encodeURI(user.profile_pic);
            console.log('URL encodée:', encodedUrl);

            if (await isImageValid(encodedUrl)) {
                console.log('Image valide détectée:', encodedUrl);
                profilePic.style.backgroundImage = `url(${encodedUrl}?v=${Date.now()})`;
                profilePic.classList.add('has-image');
                profilePic.textContent = '';
                profilePic.setAttribute('aria-label', `Photo de profil de ${user.prenom} ${user.nom}`);
            } else {
                console.warn('Image invalide ou absente, affichage des initiales pour:', user.id);
                profilePic.style.backgroundImage = '';
                profilePic.classList.remove('has-image');
                profilePic.textContent = defaultInitials;
                profilePic.setAttribute('aria-label', `Initiales ${defaultInitials} pour ${user.prenom} ${user.nom}`);
            }
        } else {
            console.warn('Aucune photo de profil, affichage des initiales pour:', user.id);
            profilePic.style.backgroundImage = '';
            profilePic.classList.remove('has-image');
            profilePic.textContent = defaultInitials;
            profilePic.setAttribute('aria-label', `Initiales ${defaultInitials} pour ${user.prenom} ${user.nom}`);
        }
    }
}

    // Initialiser la photo de profil
    await updateProfilePic(currentUser);

    // Afficher un message de confirmation
    const showConfirmation = (message) => {
        const confirmation = document.createElement('div');
        confirmation.className = 'confirmation-message';
        confirmation.textContent = message;
        settingsContent.prepend(confirmation);
        setTimeout(() => confirmation.remove(), 3000);
    };

    // Gestion du formulaire de mise à jour de la photo de profil
    const profilePicForm = document.getElementById('profilePicForm');
    profilePicForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const profilePicFile = document.getElementById('profilePicInput').files[0];
        const profilePicError = document.getElementById('profilePic-error');
        const submitBtn = profilePicForm.querySelector('.update-pic-btn');

        if (!profilePicFile) {
            profilePicError.textContent = 'Veuillez sélectionner une image.';
            profilePicError.classList.remove('hidden');
            return;
        }

        // Vérifier la taille du fichier (max 5 Mo)
        if (profilePicFile.size > 5 * 1024 * 1024) {
            profilePicError.textContent = 'L\'image ne doit pas dépasser 5 Mo.';
            profilePicError.classList.remove('hidden');
            return;
        }

        profilePicError.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Chargement...';

        const formData = new FormData();
        formData.append('profilePic', profilePicFile);

        try {
            const response = await fetch(`http://localhost:400/upload-profile-pic/${currentUser.id}`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (response.ok) {
                console.log('Photo de profil uploadée:', result.profilePic);
                currentUser.profile_pic = result.profilePic;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                await updateProfilePic(currentUser);
                showConfirmation('Photo de profil mise à jour avec succès');
            } else {
                showConfirmation('Erreur : ' + result.message);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la photo:', error);
            showConfirmation('Erreur serveur lors de la mise à jour de la photo');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Mettre à jour la photo';
        }
    });

    // Gestion du formulaire de mise à jour des informations personnelles
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prenom = document.getElementById('prenom').value.trim();
        const nom = document.getElementById('nom').value.trim();
        const telephone = document.getElementById('telephone').value.trim();
        const prenomError = document.getElementById('prenom-error');
        const nomError = document.getElementById('nom-error');
        const telephoneError = document.getElementById('telephone-error');

        let hasError = false;

        // Validation du prénom
        if (prenom.length < 2) {
            prenomError.classList.remove('hidden');
            hasError = true;
        } else {
            prenomError.classList.add('hidden');
        }

        // Validation du nom
        if (nom.length < 2) {
            nomError.classList.remove('hidden');
            hasError = true;
        } else {
            nomError.classList.add('hidden');
        }

        // Validation du téléphone (optionnel, mais doit être valide si fourni)
        if (telephone && !/^\+?\d{10,15}$/.test(telephone)) {
            telephoneError.classList.remove('hidden');
            hasError = true;
        } else {
            telephoneError.classList.add('hidden');
        }

        if (hasError) return;

        try {
            const response = await fetch(`http://localhost:400/update-profile/${currentUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prenom,
                    nom,
                    email: currentUser.email,
                    telephone,
                }),
            });
            const result = await response.json();
            if (response.ok) {
                currentUser = {
                    ...currentUser,
                    prenom,
                    nom,
                    telephone,
                };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                await updateProfilePic(currentUser);
                showConfirmation('Profil mis à jour avec succès');
            } else {
                showConfirmation('Erreur : ' + result.message);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            showConfirmation('Erreur serveur lors de la mise à jour du profil');
        }
    });

    // Gestion de la déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
}