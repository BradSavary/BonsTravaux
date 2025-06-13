<?php

require_once "Repository/EntityRepository.php";
require_once "Class/TicketMessage.php";

class TicketMessageRepository extends EntityRepository {
    
    public function __construct() {
        parent::__construct();
    }
    
    public function find($id) {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM ticket_messages WHERE id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$data) {
                return false;
            }
            
            return $this->createMessageFromData($data);
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche du message: " . $e->getMessage());
            return false;
        }
    }
    
    public function findAll() {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM ticket_messages ORDER BY timestamp DESC");
            $stmt->execute();
            $datas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $messages = [];
            foreach ($datas as $data) {
                $messages[] = $this->createMessageFromData($data);
            }
            
            return $messages;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération de tous les messages: " . $e->getMessage());
            return [];
        }
    }
    
    public function findByTicketId($ticketId) {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY timestamp ASC");
            $stmt->execute([$ticketId]);
            $datas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $messages = [];
            foreach ($datas as $data) {
                $messages[] = $this->createMessageFromData($data);
            }
            
            return $messages;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des messages du ticket: " . $e->getMessage());
            return [];
        }
    }
      public function save($message) {
        try {
            $stmt = $this->cnx->prepare("
                INSERT INTO ticket_messages 
                (ticket_id, user_id, username, message, timestamp, is_status_change, status_type) 
                VALUES (?, ?, ?, ?, NOW(), ?, ?)
            ");
            
            $result = $stmt->execute([
                $message->getTicketId(),
                $message->getUserId(),
                $message->getUsername(),
                $message->getMessage(),
                $message->isStatusChange() ? 1 : 0,
                $message->getStatusType()
            ]);
            
            if ($result) {
                $id = $this->cnx->lastInsertId();
                return $this->find($id);
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erreur lors de l'enregistrement du message: " . $e->getMessage());
            return false;
        }
    }
    
    public function update($message) {
        // Généralement on ne modifie pas les messages dans un chat
        // mais cette méthode peut être utilisée pour des fonctionnalités comme "message édité"
        try {
            $stmt = $this->cnx->prepare("
                UPDATE ticket_messages 
                SET message = ? 
                WHERE id = ?
            ");
            
            return $stmt->execute([
                $message->getMessage(),
                $message->getId()
            ]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour du message: " . $e->getMessage());
            return false;
        }
    }
    
    public function delete($id) {
        try {
            $stmt = $this->cnx->prepare("DELETE FROM ticket_messages WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression du message: " . $e->getMessage());
            return false;
        }
    }
      private function createMessageFromData($data) {
        $message = new TicketMessage($data['id']);
        $message->setTicketId($data['ticket_id']);
        $message->setUserId($data['user_id']);
        $message->setUsername($data['username']);
        $message->setMessage($data['message']);
        $message->setTimestamp($data['timestamp']);
        
        // Handle status change fields if they exist in the data
        if(isset($data['is_status_change'])) {
            $message->setIsStatusChange($data['is_status_change']);
        }
        
        if(isset($data['status_type'])) {
            $message->setStatusType($data['status_type']);
        }
        
        return $message;
    }
}