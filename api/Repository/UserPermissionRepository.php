<?php

require_once "Repository/EntityRepository.php";
require_once "Class/UserPermission.php";

class UserPermissionRepository extends EntityRepository {
    
    public function __construct() {
        parent::__construct();
    }
    
    public function find($id) {
        // Cette méthode n'est pas pertinente pour cette table à double clé primaire
        return false;
    }
    
    public function findByUserId($userId) {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM user_permission WHERE user_id = ?");
            $stmt->execute([$userId]);
            $datas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $permissions = [];
            foreach ($datas as $data) {
                $permissions[] = new UserPermission($data['user_id'], $data['permission']);
            }
            
            return $permissions;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des permissions utilisateur: " . $e->getMessage());
            return false;
        }
    }
    
    public function getUserPermissions($userId) {
        try {
            $stmt = $this->cnx->prepare("SELECT permission FROM user_permission WHERE user_id = ?");
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des permissions: " . $e->getMessage());
            return [];
        }
    }
    
    public function hasPermission($userId, $permission) {
        try {
            $stmt = $this->cnx->prepare("SELECT COUNT(*) FROM user_permission WHERE user_id = ? AND permission = ?");
            $stmt->execute([$userId, $permission]);
            return (int)$stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la permission: " . $e->getMessage());
            return false;
        }
    }
    
    // public function hasAnyTicketPermission($userId) {
    //     try {
    //         $stmt = $this->cnx->prepare("SELECT COUNT(*) FROM user_permission 
    //             WHERE user_id = ? AND permission IN ('InformatiqueTicket', 'TechniqueTicket', 'EconomatTicket')");
    //         $stmt->execute([$userId]);
    //         return (int)$stmt->fetchColumn() > 0;
    //     } catch (PDOException $e) {
    //         error_log("Erreur lors de la vérification des permissions de tickets: " . $e->getMessage());
    //         return false;
    //     }
    // }
    
    public function getUserTicketPermissions($userId) {
        try {
            $stmt = $this->cnx->prepare("SELECT permission FROM user_permission 
                WHERE user_id = ? AND permission IN ('InformatiqueTicket', 'TechniqueTicket', 'EconomatTicket')");
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des permissions de tickets: " . $e->getMessage());
            return [];
        }
    }
    
    public function findAll() {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM user_permission");
            $stmt->execute();
            $datas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $permissions = [];
            foreach ($datas as $data) {
                $permissions[] = new UserPermission($data['user_id'], $data['permission']);
            }
            
            return $permissions;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération de toutes les permissions: " . $e->getMessage());
            return false;
        }
    }
    
    public function save($permission) {
        try {
            $stmt = $this->cnx->prepare("INSERT INTO user_permission (user_id, permission) VALUES (?, ?)");
            return $stmt->execute([$permission->getUserId(), $permission->getPermission()]);
        } catch (PDOException $e) {
            error_log("Erreur lors de l'ajout de la permission: " . $e->getMessage());
            return false;
        }
    }
    
    public function delete($id) {
        // Cette méthode n'est pas pertinente pour cette table à double clé primaire
        return false;
    }
    
    public function deleteUserPermission($userId, $permission) {
        try {
            $stmt = $this->cnx->prepare("DELETE FROM user_permission WHERE user_id = ? AND permission = ?");
            return $stmt->execute([$userId, $permission]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de la permission: " . $e->getMessage());
            return false;
        }
    }
    
    public function deleteAllUserPermissions($userId) {
        try {
            $stmt = $this->cnx->prepare("DELETE FROM user_permission WHERE user_id = ?");
            return $stmt->execute([$userId]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression des permissions de l'utilisateur: " . $e->getMessage());
            return false;
        }
    }
      public function update($permission) {
        // Cette méthode n'est pas pertinente car on supprime et rajoute plutôt que de mettre à jour
        return false;
    }
    
    /**
     * Vérifie si l'utilisateur possède au moins une permission liée aux tickets
     * @param int $userId ID de l'utilisateur
     * @return bool
     */
    public function hasAnyTicketPermission($userId) {
        try {
            $stmt = $this->cnx->prepare("
                SELECT COUNT(*) 
                FROM user_permission 
                WHERE user_id = ? AND permission LIKE '%Ticket'
            ");
            $stmt->execute([$userId]);
            return (int)$stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification des permissions ticket: " . $e->getMessage());
            return false;
        }
    }
    
    // /**
    //  * Récupère toutes les permissions ticket d'un utilisateur
    //  * @param int $userId ID de l'utilisateur
    //  * @return array Liste des permissions ticket
    //  */
    // public function getUserTicketPermissions($userId) {
    //     try {
    //         $stmt = $this->cnx->prepare("
    //             SELECT permission 
    //             FROM user_permission 
    //             WHERE user_id = ? AND permission LIKE '%Ticket'
    //         ");
    //         $stmt->execute([$userId]);
    //         return $stmt->fetchAll(PDO::FETCH_COLUMN);
    //     } catch (PDOException $e) {
    //         error_log("Erreur lors de la récupération des permissions ticket: " . $e->getMessage());
    //         return [];
    //     }
    // }
    
    /**
     * Vérifie si l'utilisateur a les permissions pour gérer les tickets d'un service spécifique
     * @param int $userId ID de l'utilisateur
     * @param int $serviceId ID du service
     * @return bool
     */
    public function hasTicketPermissionsForService($userId, $serviceId) {
        try {
            // D'abord récupérer le nom du service
            $serviceStmt = $this->cnx->prepare("SELECT name FROM service_intervenant WHERE id = ?");
            $serviceStmt->execute([$serviceId]);
            $serviceName = $serviceStmt->fetchColumn();
            
            if (!$serviceName) {
                return false;
            }
            
            // Convertir le nom en code permission (ex: "Informatique" -> "InformatiqueTicket")
            $serviceCode = str_replace(' ', '', $serviceName);
            $permissionName = $serviceCode . 'Ticket';
            
            // Vérifier si l'utilisateur a cette permission
            return $this->hasPermission($userId, $permissionName);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification des permissions pour le service: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Récupère toutes les permissions disponibles dans le système
     * @return array Liste des permissions disponibles
     */
    public function getAllPermissions() {
        // Liste des permissions disponibles dans le système
        $availablePermissions = [
            // Permissions administrateur
            'AdminAccess',
            
            // Permissions pour les tickets par service
            'InformatiqueTicket',
            'TechniqueTicket',
            'EconomatTicket',
            
            // Permission pour voir les statistiques
            'view_statistics'
        ];
        
        return $availablePermissions;
    }
}