-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : ven. 04 juil. 2025 à 16:40
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `chat_app`
--

-- --------------------------------------------------------

--
-- Structure de la table `bans`
--

CREATE TABLE `bans` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `banned_until` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `blocked_rooms`
--

CREATE TABLE `blocked_rooms` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `blocked_users`
--

CREATE TABLE `blocked_users` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `blocked_user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_sticker` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `messages`
--

INSERT INTO `messages` (`id`, `user_id`, `room_id`, `content`, `created_at`, `is_sticker`) VALUES
(36, 4, 17, 'SQLUT', '2025-06-17 22:00:51', 0),
(37, 4, 17, 'http://localhost:400/Uploads/stickers/heart.png', '2025-06-17 22:00:56', 1),
(38, 3, 17, 'bien', '2025-06-17 22:02:49', 0),
(39, 3, 17, 'http://localhost:400/Uploads/stickers/heart.png', '2025-06-17 22:02:52', 1),
(40, 4, 17, 'http://localhost:400/Uploads/stickers/smile.png', '2025-06-17 22:03:11', 1),
(58, 3, 20, 'salut', '2025-06-18 16:35:32', 0),
(62, 3, 23, 'bien', '2025-06-18 16:58:35', 0),
(64, 3, 23, 'salle', '2025-06-18 17:54:55', 0),
(65, 3, 23, 'bien', '2025-06-18 17:54:57', 0),
(66, 3, 23, 'http://localhost:400/Uploads/stickers/heart.png', '2025-06-18 17:55:00', 1),
(67, 3, 24, 'sallut', '2025-06-18 17:55:14', 0),
(68, 3, 17, 'bb', '2025-06-18 18:00:47', 0),
(69, 3, 25, 'salut', '2025-06-18 18:00:59', 0),
(70, 3, 17, 'bien', '2025-06-18 18:03:45', 0),
(71, 3, 26, 'http://localhost:400/Uploads/stickers/smile.png', '2025-06-18 18:08:37', 1),
(73, 3, 28, 'salut', '2025-06-18 19:03:15', 0),
(84, 3, 17, 'bien', '2025-06-22 18:18:13', 0),
(86, 3, 17, 'salut', '2025-06-22 20:19:06', 0),
(88, 3, 17, 'SALUT', '2025-06-23 06:13:19', 0),
(89, 3, 25, 'bien', '2025-06-23 09:53:28', 0),
(90, 3, 25, 'http://localhost:400/Uploads/stickers/heart.png', '2025-06-23 09:53:31', 1),
(93, 6, 17, 'salut', '2025-06-23 10:42:30', 0),
(94, 6, 17, 'http://localhost:400/Uploads/stickers/heart.png', '2025-06-23 10:42:34', 1),
(97, 8, 17, 'sava', '2025-06-24 07:00:44', 0),
(98, 3, 17, 'sava', '2025-06-25 06:47:29', 0),
(99, 3, 23, 'salut', '2025-06-25 07:26:49', 0),
(100, 3, 23, 'bien', '2025-06-25 07:30:51', 0),
(101, 3, 23, 'http://localhost:400/Uploads/stickers/Pleure.png', '2025-06-25 07:30:54', 1),
(102, 3, 17, 'sava', '2025-06-28 20:57:21', 0);

-- --------------------------------------------------------

--
-- Structure de la table `private_messages`
--

CREATE TABLE `private_messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_archived` tinyint(1) DEFAULT 0,
  `is_sticker` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `private_messages`
--

INSERT INTO `private_messages` (`id`, `sender_id`, `receiver_id`, `content`, `created_at`, `is_archived`, `is_sticker`) VALUES
(27, 4, 2, 'salut', '2025-06-09 21:02:38', 0, 0),
(44, 4, 2, 'http://localhost:400/Uploads/stickers/smile.png', '2025-06-15 00:17:37', 0, 1),
(47, 4, 2, 'http://localhost:400/Uploads/stickers/heart.png', '2025-06-15 00:19:49', 0, 1),
(49, 4, 2, 'SALUT', '2025-06-15 00:25:49', 0, 0),
(50, 4, 2, 'http://localhost:400/Uploads/stickers/heart.png', '2025-06-15 00:27:27', 0, 1),
(53, 4, 1, 'http://localhost:400/Uploads/stickers/heart.png', '2025-06-15 00:36:49', 0, 1),
(54, 4, 2, 'http://localhost:400/Uploads/stickers/thumbs_up.png', '2025-06-15 00:36:52', 0, 1),
(96, 4, 2, 'http://localhost:400/Uploads/stickers/heart.png', '2025-06-22 17:00:19', 0, 1),
(97, 4, 2, 'bb', '2025-06-22 17:00:22', 0, 0),
(98, 4, 2, 'bien', '2025-06-22 17:00:48', 0, 0),
(118, 4, 1, 'http://localhost:400/Uploads/stickers/Pleure.png', '2025-06-23 09:50:41', 0, 1),
(126, 3, 6, 'salut', '2025-06-23 20:09:45', 0, 0),
(128, 3, 6, 'salut', '2025-06-24 06:09:19', 0, 0),
(129, 3, 6, 'sava', '2025-06-24 06:09:48', 0, 0),
(131, 3, 6, 'http://localhost:400/Uploads/stickers/Pleure.png', '2025-06-24 06:34:33', 0, 1),
(133, 7, 2, 'salut', '2025-06-24 06:38:56', 0, 0),
(134, 7, 4, 'lola', '2025-06-24 06:39:01', 0, 0),
(135, 7, 6, 'http://localhost:400/Uploads/stickers/Pleure.png', '2025-06-24 06:39:06', 0, 1),
(136, 7, 3, 'http://localhost:400/Uploads/stickers/heart.png', '2025-06-24 06:39:41', 0, 1),
(137, 7, 3, 'sava', '2025-06-24 06:41:53', 0, 0),
(138, 7, 4, 'he toi', '2025-06-24 06:41:59', 0, 0),
(139, 3, 7, 'bien', '2025-06-24 06:42:38', 0, 0),
(143, 3, 7, 'choupi', '2025-06-24 06:52:40', 0, 0),
(144, 7, 1, 'salut', '2025-06-24 06:54:40', 0, 0),
(145, 7, 6, 'sava', '2025-06-24 06:54:47', 0, 0),
(146, 3, 7, 'sava', '2025-06-24 06:55:29', 0, 0),
(147, 8, 1, 'salut', '2025-06-24 06:57:28', 0, 0),
(148, 8, 1, 'http://localhost:400/Uploads/stickers/heart.png', '2025-06-24 06:57:32', 0, 1),
(155, 3, 6, 'salut', '2025-06-25 10:11:23', 0, 0),
(158, 3, 6, 'http://localhost:400/Uploads/stickers/Pleure.png', '2025-06-28 20:55:16', 0, 1),
(159, 3, 8, 'salut', '2025-06-28 20:58:12', 0, 0);

-- --------------------------------------------------------

--
-- Structure de la table `reported_rooms`
--

CREATE TABLE `reported_rooms` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `reported_rooms`
--

INSERT INTO `reported_rooms` (`id`, `user_id`, `room_id`, `reason`, `created_at`) VALUES
(18, 3, 17, 'VV', '2025-06-18 16:04:57'),
(22, 6, 17, 'sallut', '2025-06-23 10:42:42');

-- --------------------------------------------------------

--
-- Structure de la table `reported_users`
--

CREATE TABLE `reported_users` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reported_user_id` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `reported_users`
--

INSERT INTO `reported_users` (`id`, `user_id`, `reported_user_id`, `reason`, `created_at`) VALUES
(1, 3, 2, 'IL ME FATIGUE', '2025-06-14 22:49:38'),
(2, 3, 1, 'la faim', '2025-06-14 23:01:42'),
(3, 3, 4, 'ff', '2025-06-14 23:10:03'),
(4, 3, 6, 'sava', '2025-06-28 20:55:24'),
(5, 3, 4, 'ange', '2025-06-28 21:34:57'),
(6, 3, 2, 'kk', '2025-06-28 22:01:26'),
(7, 3, 4, 'nn', '2025-06-28 22:11:52');

-- --------------------------------------------------------

--
-- Structure de la table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_archived` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `rooms`
--

INSERT INTO `rooms` (`id`, `name`, `description`, `user_id`, `created_at`, `is_archived`) VALUES
(17, 'JJJ', 'VACHE', 4, '2025-06-17 21:49:11', 0),
(20, 'jj', 's', 3, '2025-06-18 16:35:23', 0),
(23, 'nnnmm', 'mmm', 3, '2025-06-18 16:58:30', 0),
(24, 'yo', 'bb', 3, '2025-06-18 17:55:09', 0),
(25, 'jjddvv', 'cc', 3, '2025-06-18 18:00:56', 0),
(26, 'lll', 'rr', 3, '2025-06-18 18:08:33', 0),
(28, 'kek', 'vv', 3, '2025-06-18 19:03:06', 0);

-- --------------------------------------------------------

--
-- Structure de la table `room_members`
--

CREATE TABLE `room_members` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `room_members`
--

INSERT INTO `room_members` (`id`, `room_id`, `user_id`, `joined_at`) VALUES
(64, 17, 4, '2025-06-17 22:03:26'),
(69, 20, 3, '2025-06-18 16:35:23'),
(72, 23, 3, '2025-06-18 16:58:30'),
(73, 24, 3, '2025-06-18 17:55:09'),
(74, 25, 3, '2025-06-18 18:00:56'),
(75, 26, 3, '2025-06-18 18:08:33'),
(77, 28, 3, '2025-06-18 19:03:06'),
(87, 17, 6, '2025-06-23 10:42:24'),
(89, 25, 6, '2025-06-23 10:43:22'),
(90, 17, 8, '2025-06-24 07:00:35'),
(91, 17, 3, '2025-06-25 06:59:43');

-- --------------------------------------------------------

--
-- Structure de la table `stickers`
--

CREATE TABLE `stickers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `stickers`
--

INSERT INTO `stickers` (`id`, `name`, `image_url`, `created_at`) VALUES
(1, 'Smile', '/Uploads/stickers/smile.png', '2025-06-14 14:27:34'),
(2, 'Heart', '/Uploads/stickers/heart.png', '2025-06-14 14:27:34'),
(3, 'Thumbs Up', '/Uploads/stickers/thumbs_up.png', '2025-06-14 14:27:34'),
(4, 'Dance', '/Uploads/stickers/Danse.png', '2025-06-14 14:27:45'),
(5, 'Bisous', '/Uploads/stickers/bisous.png', '2025-06-14 15:00:00'),
(6, 'Pleure', '/Uploads/stickers/Pleure.png', '2025-06-14 16:00:00');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `prenom` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telephone` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `gender` enum('Homme','Femme','Autre') DEFAULT 'Autre',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `profile_pic` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `nom`, `prenom`, `email`, `telephone`, `password`, `gender`, `created_at`, `profile_pic`) VALUES
(1, 'Ali', 'Kouyaté', 'ali@exemple.com', '0654123456', '$2b$10$BOaVyEmT2MJIQZy7GINk5.Ef/NUEUqtpyvLTby/bG3ie7l3Mv4xL.', 'Homme', '2025-05-22 14:14:16', NULL),
(2, 'Ange', 'Kouyaté', 'ange@exemple.com', '0654123456', '$2b$10$GnYBtjvgoetPfBW3t0mkgug99u2TwSbBeStk0uYe3aXDcgXYnX/5S', 'Homme', '2025-05-22 14:14:50', NULL),
(3, 'Keke', 'Axelle Rameaux', 'ramoskeke16@gmail.com', '0700133695', '$2b$10$BjKrAisOK3/W8HFi3AHYu.Lf4DTYq5OOyJbeSHwGnTQ8EY0nlS2Nm', 'Homme', '2025-05-22 14:41:17', '/Uploads/1750672657658-noir-afro-femme-ma-canicien-automobile-dans-les-salles-de-ra-paration-des-instruments-l-auto-service-hardworking-african-woman-221246094-removebg-preview.png'),
(4, 'Samoa', 'Kouadio', 'toto@gmail.com', '0778006394', '$2b$10$/oU9MGiyNylBxtJs.cDM..XRFMD//6nnPTjylNp1G1XCDKsfskcei', 'Homme', '2025-05-25 20:12:01', '/Uploads/1749247198258-5-mini-bouton-poussoir-600x600.jpg'),
(6, 'keke', 'nancy', 'pepe@gmail.com', '0505287639', '$2b$10$pNKQVz02ssiVXvA4Ke5opungAJy2Tho3pk/pOhonp1FiY52504neG', 'Homme', '2025-06-23 10:40:40', '/Uploads/1750675280571-17-42-image.png'),
(7, 'ff', 'lola', 'lola@gmail.com', '+2250505287639', '$2b$10$z4l9SpqrtK/L1bBQcMorSOPK7ppfywDCMckz2jg2dF/aQyyegl8oO', 'Femme', '2025-06-24 06:38:27', NULL),
(8, 'tabo', 'aicha', 'aicha@gmail.com', '+2250700133695', '$2b$10$XFktvvkTMcqm/wH2wQaB7Ox.gn1Ma/TqgrTHXd4h.i.eNWhX20sFq', 'Autre', '2025-06-24 06:57:03', NULL);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `bans`
--
ALTER TABLE `bans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `blocked_rooms`
--
ALTER TABLE `blocked_rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_block` (`user_id`,`room_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Index pour la table `blocked_users`
--
ALTER TABLE `blocked_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_block_user` (`user_id`,`blocked_user_id`),
  ADD KEY `blocked_user_id` (`blocked_user_id`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Index pour la table `private_messages`
--
ALTER TABLE `private_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Index pour la table `reported_rooms`
--
ALTER TABLE `reported_rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Index pour la table `reported_users`
--
ALTER TABLE `reported_users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `reported_user_id` (`reported_user_id`);

--
-- Index pour la table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `fk_rooms_user` (`user_id`);

--
-- Index pour la table `room_members`
--
ALTER TABLE `room_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_room_user` (`room_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `stickers`
--
ALTER TABLE `stickers`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `bans`
--
ALTER TABLE `bans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `blocked_rooms`
--
ALTER TABLE `blocked_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `blocked_users`
--
ALTER TABLE `blocked_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT pour la table `private_messages`
--
ALTER TABLE `private_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=160;

--
-- AUTO_INCREMENT pour la table `reported_rooms`
--
ALTER TABLE `reported_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT pour la table `reported_users`
--
ALTER TABLE `reported_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT pour la table `room_members`
--
ALTER TABLE `room_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- AUTO_INCREMENT pour la table `stickers`
--
ALTER TABLE `stickers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `bans`
--
ALTER TABLE `bans`
  ADD CONSTRAINT `bans_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `blocked_rooms`
--
ALTER TABLE `blocked_rooms`
  ADD CONSTRAINT `blocked_rooms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `blocked_rooms_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `blocked_users`
--
ALTER TABLE `blocked_users`
  ADD CONSTRAINT `blocked_users_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `blocked_users_ibfk_2` FOREIGN KEY (`blocked_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `private_messages`
--
ALTER TABLE `private_messages`
  ADD CONSTRAINT `private_messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `private_messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reported_rooms`
--
ALTER TABLE `reported_rooms`
  ADD CONSTRAINT `reported_rooms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reported_rooms_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reported_users`
--
ALTER TABLE `reported_users`
  ADD CONSTRAINT `reported_users_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reported_users_ibfk_2` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `fk_rooms_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `room_members`
--
ALTER TABLE `room_members`
  ADD CONSTRAINT `room_members_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `room_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
