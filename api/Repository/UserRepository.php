<?php
require_once "Repository/EntityRepository.php";
require_once "Class/User.php";

class UserRepository extends EntityRepository {

    public function __construct() {
        parent::__construct();
    }    public function find($id) {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM user WHERE id = ?");
            $stmt->execute([$id]);
            $userData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$userData) {
                return false;
            }
            
            $user = new User($userData['id']);
            $user->setUsername($userData['username']);
            $user->setPassword($userData['password']);
            if (isset($userData['last_ip'])) $user->setLastIp($userData['last_ip']);
            if (isset($userData['site'])) $user->setSite($userData['site']);
            if (isset($userData['default_service_id'])) $user->setDefaultServiceId($userData['default_service_id']);
            if (isset($userData['is_lock'])) $user->setIsLock($userData['is_lock'] == 1 || $userData['is_lock'] === true);
            
            return $user;
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche de l'utilisateur: " . $e->getMessage());
            return false;
        }
    }    public function findByUsername($username) {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM user WHERE username = ?");
            $stmt->execute([$username]);
            $userData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$userData) {
                return false;
            }
            
            $user = new User($userData['id']);
            $user->setUsername($userData['username']);
            $user->setPassword($userData['password']);
            if (isset($userData['last_ip'])) $user->setLastIp($userData['last_ip']);
            if (isset($userData['site'])) $user->setSite($userData['site']);
            if (isset($userData['default_service_id'])) $user->setDefaultServiceId($userData['default_service_id']);
            if (isset($userData['is_lock'])) $user->setIsLock($userData['is_lock'] == 1 || $userData['is_lock'] === true);
            
            return $user;
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche de l'utilisateur par nom: " . $e->getMessage());
            return false;
        }
    }
    
    public function findAll() {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM user");
            $stmt->execute();
            $usersData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $users = [];
            foreach ($usersData as $userData) {                $user = new User($userData['id']);
                $user->setUsername($userData['username']);
                $user->setPassword($userData['password']);
                if (isset($userData['last_ip'])) $user->setLastIp($userData['last_ip']);
                if (isset($userData['site'])) $user->setSite($userData['site']);
                if (isset($userData['default_service_id'])) $user->setDefaultServiceId($userData['default_service_id']);
                if (isset($userData['is_lock'])) $user->setIsLock($userData['is_lock'] == 1 || $userData['is_lock'] === true);
                $users[] = $user;
            }
            
            return $users;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération de tous les utilisateurs: " . $e->getMessage());
            return false;
        }
    }
    
    public function save($user) {
        try {
            $stmt = $this->cnx->prepare("INSERT INTO user (username, password, site) VALUES (?, ?, ?)");
            $result = $stmt->execute([
                $user->getUsername(),
                $user->getPassword(),
                $user->getSite()
            ]);
            
            if ($result) {
                $id = $this->cnx->lastInsertId();
                $user->id = $id;  // Mettre à jour l'ID de l'utilisateur créé
                return $user;
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erreur lors de l'enregistrement de l'utilisateur: " . $e->getMessage());
            return false;
        }
    }

    public function delete($id) {
        try {
            $stmt = $this->cnx->prepare("DELETE FROM user WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de l'utilisateur: " . $e->getMessage());
            return false;
        }
    }    public function update($user) {
        try {
            $stmt = $this->cnx->prepare("UPDATE user SET username = ?, password = ?, last_ip = ?, site = ?, default_service_id = ?, is_lock = ? WHERE id = ?");
            return $stmt->execute([
                $user->getUsername(),
                $user->getPassword(),
                $user->getLastIp(),
                $user->getSite(),
                $user->getDefaultServiceId(),
                $user->getIsLock() ? 1 : 0, // Ensure boolean is properly converted to 1 or 0
                $user->getId()
            ]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour de l'utilisateur: " . $e->getMessage());
            return false;
        }
    }
    
    public function updateIpAndSite($userId, $ip, $site) {
        try {
            $stmt = $this->cnx->prepare("UPDATE user SET last_ip = ?, site = ? WHERE id = ?");
            return $stmt->execute([$ip, $site, $userId]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour de l'IP et du site: " . $e->getMessage());
            return false;
        }
    }


      public function countAll($search = '', $permissionFilter = '') {
        try {
            $sql = "SELECT COUNT(DISTINCT u.id) FROM user u";
            $params = [];
            
            // Si on filtre par permission, on doit joindre avec la table user_permission
            if (!empty($permissionFilter)) {
                $sql .= " LEFT JOIN user_permission up ON u.id = up.user_id 
                         WHERE up.permission = :permission";
                $params[':permission'] = $permissionFilter;
                
                // Ajouter la condition de recherche si elle existe aussi
                if (!empty($search)) {
                    $sql .= " AND (u.username LIKE :search OR u.site LIKE :search)";
                    $params[':search'] = '%' . $search . '%';
                }
            } 
            // Sinon, juste la condition de recherche si elle existe
            else if (!empty($search)) {
                $sql .= " WHERE username LIKE :search OR site LIKE :search";
                $params[':search'] = '%' . $search . '%';
            }
            
            $stmt = $this->cnx->prepare($sql);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            $stmt->execute();
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Erreur lors du comptage des utilisateurs: " . $e->getMessage());
            return 0;
        }
    }
    
    public function findPaginated($page = 1, $perPage = 10, $search = '', $sortBy = 'username', $sortDir = 'asc', $permissionFilter = '') {
        try {
            $offset = ($page - 1) * $perPage;
            
            // Construction de la requête SQL de base
            $sql = "SELECT DISTINCT u.* FROM user u";
            $params = [];
            
            // Si on filtre par permission, on doit joindre avec la table user_permission
            if (!empty($permissionFilter)) {
                $sql .= " LEFT JOIN user_permission up ON u.id = up.user_id 
                         WHERE up.permission = :permission";
                $params[':permission'] = $permissionFilter;
                
                // Ajouter la condition de recherche si elle existe aussi
                if (!empty($search)) {
                    $sql .= " AND (u.username LIKE :search OR u.site LIKE :search)";
                    $params[':search'] = '%' . $search . '%';
                }
            } 
            // Sinon, juste la condition de recherche si elle existe
            else if (!empty($search)) {
                $sql .= " WHERE u.username LIKE :search OR u.site LIKE :search";
                $params[':search'] = '%' . $search . '%';
            }
            
            // Validation des paramètres de tri pour éviter les injections SQL
            $allowedSortColumns = ['id', 'username', 'site', 'last_ip'];
            $sortBy = in_array($sortBy, $allowedSortColumns) ? "u.".$sortBy : "u.username";
            $sortDir = strtolower($sortDir) === 'desc' ? 'DESC' : 'ASC';
            
            $sql .= " ORDER BY {$sortBy} {$sortDir} LIMIT :limit OFFSET :offset";
            
            $stmt = $this->cnx->prepare($sql);
            
            // Bind des paramètres
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            $usersData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $users = [];
            foreach ($usersData as $userData) {                $user = new User($userData['id']);
                $user->setUsername($userData['username']);
                // Ne pas inclure le mot de passe dans les résultats                if (isset($userData['last_ip'])) $user->setLastIp($userData['last_ip']);
                if (isset($userData['site'])) $user->setSite($userData['site']);
                if (isset($userData['default_service_id'])) $user->setDefaultServiceId($userData['default_service_id']);
                if (isset($userData['is_lock'])) $user->setIsLock($userData['is_lock'] == 1 || $userData['is_lock'] === true);
                $users[] = $user;
            }
            
            return $users;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des utilisateurs paginés: " . $e->getMessage());
            return [];
        }
    }


    public function updateDefaultService($userId, $serviceId) {
    try {
        $stmt = $this->cnx->prepare("UPDATE user SET default_service_id = ? WHERE id = ?");
        return $stmt->execute([$serviceId, $userId]);
    } catch (PDOException $e) {
        error_log("Erreur lors de la mise à jour du service par défaut: " . $e->getMessage());
        return false;
    }
}
}