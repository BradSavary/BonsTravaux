# Documentation Système de Gestion des Bons de Travaux

Ce document décrit les fonctionnalités et l'utilisation du système de Gestion des Bons de Travaux, destiné aux administrateurs du système.

## Table des matières

1. [Présentation générale](#présentation-générale)
2. [Architecture du système](#architecture-du-système)
3. [Fonctionnalités principales](#fonctionnalités-principales)
4. [Rôles et permissions](#rôles-et-permissions)
5. [Module d'administration](#module-dadministration)
6. [Gestion des tickets](#gestion-des-tickets)
7. [Transfert de tickets](#transfert-de-tickets)
8. [Historique des modifications](#historique-des-modifications)
9. [Communication par messages](#communication-par-messages)
10. [Authentification et sécurité](#authentification-et-sécurité)
11. [Dépannage et maintenance](#dépannage-et-maintenance)

## Présentation générale

L'application "Bons de Travaux" est une solution de gestion de tickets permettant de suivre et gérer les demandes d'interventions (informatiques, techniques ou economat). Elle permet aux utilisateurs de créer des bons de travaux, de les attribuer aux services concernés, de suivre leur état d'avancement et de communiquer entre les différents intervenants.

## Architecture du système

Le système est construit selon une architecture client-serveur:

- **Frontend**: Interface utilisateur développée en React.js avec Tailwind CSS pour les styles
- **Backend**: API PHP RESTful qui communique avec une base de données MySQL
- **Authentification**: Intégration LDAP pour l'authentification des utilisateurs

## Fonctionnalités principales

- **Création de bons**: Les utilisateurs peuvent créer des demandes d'intervention en spécifiant le service demandeur, le service intervenant, les détails de l'intervention et le lieu
- **Suivi des bons**: Visualisation de l'état d'avancement des bons (Ouvert, En cours, Résolu, Fermé)
- **Communication intégrée**: Système de messagerie intégré à chaque bon pour faciliter les échanges
- **Transfert de bons**: Possibilité de transférer un bon vers un autre service intervenant
- **Gestion des services**: Administration des services demandeurs et intervenants
- **Gestion des utilisateurs**: Attribution des droits et permissions
- **Historique complet**: Suivi des changements de statut et des transferts
- **Reconnaissance automatique du site**: Détection du site basée sur l'adresse IP du client

## Rôles et permissions

Le système utilise un modèle de permissions granulaires pour contrôler l'accès aux différentes fonctionnalités:

### Permissions principales

- **AdminAccess**: Accès au module d'administration (gestion des utilisateurs et des services)
- **InformatiqueTicket**: Accès à la gestion des tickets du service Informatique
- **TechniqueTicket**: Accès à la gestion des tickets du service Technique
- **EconomatTicket**: Accès à la gestion des tickets du service Économat

Chaque utilisateur peut avoir plusieurs permissions selon son rôle dans l'organisation.

## Module d'administration

Le module d'administration est accessible uniquement aux utilisateurs disposant de la permission `AdminAccess`. Il se divise en trois sections principales:

### Gestion des utilisateurs

- Liste des utilisateurs avec filtre et recherche
- Attribution/retrait des permissions
- Visualisation des droits actuels de chaque utilisateur

Pour ajouter une permission à un utilisateur:
1. Accédez à "Administration" > "Utilisateurs"
2. Sélectionnez l'utilisateur concerné
3. Cliquez sur "Ajouter une permission"
4. Sélectionnez la ou les permissions à ajouter
5. Confirmez l'ajout

Pour retirer une permission:
1. Dans la liste des permissions de l'utilisateur, cliquez sur l'icône de suppression à côté de la permission concernée

### Gestion des services intervenants

- Ajout, modification et suppression des services pouvant intervenir sur les bons
- Les services intervenants standards sont: Informatique, Technique, Économat
- Chaque service intervenant peut avoir un code couleur associé pour une meilleure visualisation

Pour ajouter un service intervenant:
1. Accédez à "Administration" > "Services Intervenants"
2. Cliquez sur "Ajouter un service"
3. Saisissez le nom du service
4. Confirmez l'ajout

### Gestion des services demandeurs

- Ajout, modification et suppression des services pouvant créer des bons
- Interface de pagination et recherche pour retrouver facilement un service

Pour gérer les services demandeurs:
1. Accédez à "Administration" > "Services Demandeurs"
2. Utilisez la barre de recherche pour filtrer la liste
3. Cliquez sur "Modifier" pour changer un nom de service ou "Supprimer" pour retirer un service
4. Pour ajouter un service, cliquez sur "Ajouter un service demandeur"

## Gestion des tickets

Les utilisateurs ayant des permissions de gestion de tickets (`InformatiqueTicket`, `TechniqueTicket`, `EconomatTicket`) ont accès à des fonctionnalités avancées:

### Tableau de bord de gestion

- Visualisation filtrée des tickets concernant leurs services
- Recherche par mots-clés
- Filtrage par statut
- Tri par différentes colonnes

Pour accéder au tableau de bord:
1. Cliquez sur "Gestion des Bons" dans le menu principal
2. Utilisez les filtres en haut de la page pour affiner les résultats

### Mise à jour de statut

Les statuts disponibles pour les tickets sont:
- **Ouvert**: État initial d'un nouveau bon
- **En cours**: Intervention démarrée
- **Résolu**: Intervention terminée
- **Fermé**: Bon clôturé

Pour modifier le statut d'un ticket:
1. Ouvrez le bon concerné
2. Utilisez soit le panneau latéral "Modifier le statut", soit le bouton "Modifier le statut"
3. Sélectionnez le nouveau statut
4. Confirmez le changement

## Transfert de tickets

Le système permet deux types de transferts entre services:

### Transfert simple

Le bon est déplacé d'un service à un autre. Il n'est plus visible par le service d'origine.

### Duplication et transfert

Une copie du bon est créée pour le service destinataire, tandis que le service d'origine conserve le bon original.

Pour effectuer un transfert:
1. Ouvrez le bon concerné
2. Cliquez sur "Transférer"
3. Sélectionnez le service destinataire
4. Choisissez le type de transfert
5. Confirmez l'opération

## Historique des modifications

Chaque changement de statut et transfert est enregistré dans l'historique du bon:

- Visualisation des 3 dernières modifications directement sur la page du bon
- Accès à l'historique complet via "Voir l'historique complet"
- L'historique indique la date, l'utilisateur ayant effectué la modification et les détails du changement

L'historique est particulièrement utile pour:
- Suivre la progression d'une demande
- Vérifier qui a effectué une action particulière
- Comprendre pourquoi un ticket a été transféré d'un service à un autre

## Communication par messages

Chaque bon dispose d'un système de messagerie intégré:

- Les utilisateurs peuvent échanger des messages concernant l'intervention
- Le système affiche clairement l'auteur et l'horodatage de chaque message
- Possibilité de supprimer ses propres messages (les administrateurs peuvent supprimer tous les messages)
- Affichage du temps écoulé pour chaque message (à l'instant, il y a X minutes, hier, etc.)

Fonctionnalités administratives spéciales:
- Les administrateurs peuvent supprimer n'importe quel message, contrairement aux utilisateurs normaux qui ne peuvent supprimer que leurs propres messages
- Cette fonctionnalité est utile pour modérer les échanges si nécessaire

## Authentification et sécurité

Le système utilise une authentification par token avec les caractéristiques suivantes:

- Authentification LDAP pour la validation des identifiants utilisateurs
- Détection automatique du site basée sur l'adresse IP
- Sessions sécurisées avec expiration automatique après inactivité
- Vérification des permissions à chaque action sensible

Sites reconnus automatiquement:
- CHIMB: adresses IP 10.84.xxx.xxx ou 10.85.xxx.xxx
- Pelaudine: adresses IP 10.98.xxx.xxx
- Puychat: adresses IP 10.90.xxx.xxx

## Dépannage et maintenance

### Problèmes d'authentification

Si un utilisateur ne peut pas se connecter:
1. Vérifiez que ses identifiants LDAP sont corrects
2. Assurez-vous que le serveur LDAP est accessible
3. Vérifiez les logs pour toute erreur d'authentification

### Ajout de nouveaux sites

Pour ajouter la reconnaissance d'un nouveau site:
1. Modifiez la méthode `determineSiteFromIP` dans `UserController.php`
2. Ajoutez une nouvelle règle de correspondance IP/site
3. Redémarrez le service d'API

### Gestion des tokens expirés

Les tokens d'authentification expirent après 1 heure d'inactivité. En cas d'expiration:
1. Le système redirige automatiquement l'utilisateur vers la page de connexion
2. Un message "Session expirée. Veuillez vous reconnecter." s'affiche

### Maintenance de la base de données

Points importants:
- La base de données utilise MySQL
- Les informations de connexion sont définies dans le fichier `EntityRepository.php`
- En cas de problème de connexion, vérifiez les identifiants et les permissions de l'utilisateur de la base de données

---

Pour toute assistance supplémentaire ou questions concernant l'administration du système, veuillez contacter le support technique.
