<?php

require_once "Repository/EntityRepository.php";
require_once "Class/ServiceNotificationEmail.php";

class ServiceNotificationEmailRepository extends EntityRepository {
    
    public function __construct() {
        parent::__construct();
    }
    
    public function find($id) {
        try {
            $stmt = $this->cnx->prepare("SELECT ne.*, si.name as service_name FROM service_notification_email ne
                                         LEFT JOIN service_intervenant si ON ne.service_id = si.id 
                                         WHERE ne.id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$data) {
                return false;
            }
            
            return $this->createNotificationFromData($data);
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche de la notification email: " . $e->getMessage());
            return false;
        }
    }
    
    public function findAll() {
        try {
            $stmt = $this->cnx->prepare("SELECT ne.*, si.name as service_name FROM service_notification_email ne
                                         LEFT JOIN service_intervenant si ON ne.service_id = si.id 
                                         ORDER BY ne.permission_type, si.name");
            $stmt->execute();
            
            $notifications = [];
            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $notifications[] = $this->createNotificationFromData($data);
            }
            
            return $notifications;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des notifications email: " . $e->getMessage());
            return false;
        }
    }
    
    public function findByPermissionType($permissionType) {
        try {
            $stmt = $this->cnx->prepare("SELECT ne.*, si.name as service_name FROM service_notification_email ne
                                         LEFT JOIN service_intervenant si ON ne.service_id = si.id 
                                         WHERE ne.permission_type = ? AND ne.enabled = 1");
            $stmt->execute([$permissionType]);
            
            $notifications = [];
            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $notifications[] = $this->createNotificationFromData($data);
            }
            
            return $notifications;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des notifications email par type de permission: " . $e->getMessage());
            return false;
        }
    }
    
    public function findByServiceId($serviceId) {
        try {
            $stmt = $this->cnx->prepare("SELECT ne.*, si.name as service_name FROM service_notification_email ne
                                         LEFT JOIN service_intervenant si ON ne.service_id = si.id 
                                         WHERE ne.service_id = ?");
            $stmt->execute([$serviceId]);
            
            $notifications = [];
            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $notifications[] = $this->createNotificationFromData($data);
            }
            
            return $notifications;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des notifications email par service: " . $e->getMessage());
            return false;
        }
    }
    
    public function findByServiceIdAndPermissionType($serviceId, $permissionType) {
        try {
            $stmt = $this->cnx->prepare("SELECT ne.*, si.name as service_name FROM service_notification_email ne
                                         LEFT JOIN service_intervenant si ON ne.service_id = si.id 
                                         WHERE ne.service_id = ? AND ne.permission_type = ?");
            $stmt->execute([$serviceId, $permissionType]);
            
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$data) {
                return false;
            }
            
            return $this->createNotificationFromData($data);
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération de la notification email: " . $e->getMessage());
            return false;
        }
    }
    
    public function save($notification) {
        try {
            // Vérifier si une notification existe déjà pour ce service et cette permission
            $existingNotification = $this->findByServiceIdAndPermissionType(
                $notification->getServiceId(),
                $notification->getPermissionType()
            );
            
            if ($existingNotification) {
                // Mise à jour de la notification existante
                $stmt = $this->cnx->prepare("UPDATE service_notification_email 
                                            SET email = ?, enabled = ? 
                                            WHERE service_id = ? AND permission_type = ?");
                
                $result = $stmt->execute([
                    $notification->getEmail(),
                    $notification->isEnabled() ? 1 : 0,
                    $notification->getServiceId(),
                    $notification->getPermissionType()
                ]);
                
                if ($result) {
                    return $this->findByServiceIdAndPermissionType(
                        $notification->getServiceId(),
                        $notification->getPermissionType()
                    );
                }
                
                return false;
            } else {
                // Création d'une nouvelle notification
                $stmt = $this->cnx->prepare("INSERT INTO service_notification_email 
                                           (service_id, permission_type, email, enabled) 
                                           VALUES (?, ?, ?, ?)");
                
                $result = $stmt->execute([
                    $notification->getServiceId(),
                    $notification->getPermissionType(),
                    $notification->getEmail(),
                    $notification->isEnabled() ? 1 : 0
                ]);
                
                if ($result) {
                    $id = $this->cnx->lastInsertId();
                    return $this->find($id);
                }
                
                return false;
            }
        } catch (PDOException $e) {
            error_log("Erreur lors de la sauvegarde de la notification email: " . $e->getMessage());
            return false;
        }
    }
    
    public function update($notification) {
        try {
            $stmt = $this->cnx->prepare("UPDATE service_notification_email 
                                        SET service_id = ?, permission_type = ?, email = ?, enabled = ? 
                                        WHERE id = ?");
            
            $result = $stmt->execute([
                $notification->getServiceId(),
                $notification->getPermissionType(),
                $notification->getEmail(),
                $notification->isEnabled() ? 1 : 0,
                $notification->getId()
            ]);
            
            return $result;
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour de la notification email: " . $e->getMessage());
            return false;
        }
    }
    
    public function delete($id) {
        try {
            $stmt = $this->cnx->prepare("DELETE FROM service_notification_email WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de la notification email: " . $e->getMessage());
            return false;
        }
    }
    
    public function deleteByServiceAndPermission($serviceId, $permissionType) {
        try {
            $stmt = $this->cnx->prepare("DELETE FROM service_notification_email 
                                        WHERE service_id = ? AND permission_type = ?");
            return $stmt->execute([$serviceId, $permissionType]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de la notification email: " . $e->getMessage());
            return false;
        }
    }
    
    private function createNotificationFromData($data) {
        $notification = new ServiceNotificationEmail($data['id']);
        $notification->setServiceId($data['service_id']);
        $notification->setPermissionType($data['permission_type']);
        $notification->setEmail($data['email']);
        $notification->setEnabled($data['enabled']);
        
        if (isset($data['service_name'])) {
            $notification->setServiceName($data['service_name']);
        }
        
        return $notification;
    }
}
