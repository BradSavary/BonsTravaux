<?php

require_once "Repository/EntityRepository.php";
require_once "Class/TicketStatusHistory.php";

class TicketStatusHistoryRepository extends EntityRepository {
    
    public function __construct() {
        parent::__construct();
    }
    
    public function find($id) {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM ticket_status_history WHERE id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$data) {
                return false;
            }
            
            return $this->createHistoryFromData($data);
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche de l'historique du statut: " . $e->getMessage());
            return false;
        }
    }
    
    public function findAll() {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM ticket_status_history");
            $stmt->execute();
            $datas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $histories = [];
            foreach ($datas as $data) {
                $histories[] = $this->createHistoryFromData($data);
            }
            
            return $histories;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération de tous les historiques: " . $e->getMessage());
            return false;
        }
    }
      public function findByTicketId($ticketId) {
        try {
            $stmt = $this->cnx->prepare("
                SELECT h.*, 
                    u.username, 
                    si.name as service_name,
                    technician.username as technician_username
                FROM ticket_status_history h
                LEFT JOIN user u ON h.user_id = u.id
                LEFT JOIN service_intervenant si ON (h.transferred_to_service_id = si.id AND h.transfer_type != 'assignation_technicien')
                LEFT JOIN user technician ON (h.transferred_to_service_id = technician.id AND h.transfer_type = 'assignation_technicien')
                WHERE h.ticket_id = ?
                ORDER BY h.date_changement DESC
            ");
            $stmt->execute([$ticketId]);
            $datas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $histories = [];
            foreach ($datas as $data) {
                $histories[] = $this->createHistoryFromData($data);
            }
            
            return $histories;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération de l'historique du ticket: " . $e->getMessage());
            return [];
        }
    }
    
    public function save($history) {
        try {
            $stmt = $this->cnx->prepare("
                INSERT INTO ticket_status_history 
                (ticket_id, user_id, old_status, new_status, date_changement, transferred_to_service_id, transfer_type) 
                VALUES (?, ?, ?, ?, NOW(), ?, ?)
            ");
            
            $result = $stmt->execute([
                $history->getTicketId(),
                $history->getUserId(),
                $history->getOldStatus(),
                $history->getNewStatus(),
                $history->getTransferredToServiceId(),
                $history->getTransferType()
            ]);
            
            if ($result) {
                $id = $this->cnx->lastInsertId();
                $history = $this->find($id);
                return $history;
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erreur lors de l'enregistrement de l'historique: " . $e->getMessage());
            return false;
        }
    }
    
    public function delete($id) {
        try {
            $stmt = $this->cnx->prepare("DELETE FROM ticket_status_history WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de l'historique: " . $e->getMessage());
            return false;
        }
    }
    
    public function update($history) {
        // Les entrées d'historique ne sont généralement pas modifiées
        return false;
    }
    
private function createHistoryFromData($data) {
    $history = new TicketStatusHistory($data['id']);
    $history->setTicketId($data['ticket_id']);
    $history->setUserId($data['user_id']);
    $history->setOldStatus($data['old_status']);
    $history->setNewStatus($data['new_status']);
    $history->setDateChangement($data['date_changement']);
    
    // Ajouter les nouveaux champs
    if (isset($data['transferred_to_service_id'])) {
        $history->setTransferredToServiceId($data['transferred_to_service_id']);
    }
    
    if (isset($data['transfer_type'])) {
        $history->setTransferType($data['transfer_type']);
    }
    
    // Ajouter le nom du service s'il est disponible
    if (isset($data['service_name'])) {
        $history->setServiceName($data['service_name']);
    }
    
    // Ajouter le nom d'utilisateur s'il est disponible
    if (isset($data['username'])) {
        $history->setUsername($data['username']);
    }
    
    return $history;
}

public function saveWithCustomDate($history, $customDate) {
    try {
        // Construire une chaîne de date-heure qui combine la date personnalisée avec l'heure actuelle
        $dateTime = $customDate . ' ' . date('H:i:s');
        
        $stmt = $this->cnx->prepare("
            INSERT INTO ticket_status_history 
            (ticket_id, user_id, old_status, new_status, date_changement, transferred_to_service_id, transfer_type) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $history->getTicketId(),
            $history->getUserId(),
            $history->getOldStatus(),
            $history->getNewStatus(),
            $dateTime, // Utiliser la date personnalisée avec l'heure actuelle
            $history->getTransferredToServiceId(),
            $history->getTransferType()
        ]);
        
        if ($result) {
            $id = $this->cnx->lastInsertId();
            return $this->find($id);
        }
        
        return false;
    } catch (PDOException $e) {
        error_log("Erreur lors de l'enregistrement de l'historique avec date personnalisée: " . $e->getMessage());
        return false;
    }
}







}