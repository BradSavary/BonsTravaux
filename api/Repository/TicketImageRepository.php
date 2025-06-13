<?php

require_once "Repository/EntityRepository.php";
require_once "Class/TicketImage.php";

class TicketImageRepository extends EntityRepository {
    
    public function __construct() {
        parent::__construct();
    }
    
    public function find($id) {
        try {
            $stmt = $this->cnx->prepare("SELECT ti.*, u.username 
                FROM ticket_images ti
                LEFT JOIN user u ON ti.user_id = u.id
                WHERE ti.id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$data) {
                return null;
            }
            
            return $this->createImageFromData($data);
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche de l'image: " . $e->getMessage());
            return null;
        }
    }
    
    public function findAll() {
        try {
            $stmt = $this->cnx->query("SELECT ti.*, u.username 
                FROM ticket_images ti
                LEFT JOIN user u ON ti.user_id = u.id
                ORDER BY ti.created_at DESC");
            
            $images = [];
            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $images[] = $this->createImageFromData($data);
            }
            
            return $images;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des images: " . $e->getMessage());
            return [];
        }
    }
    
    public function findByTicketId($ticketId) {
        try {
            $stmt = $this->cnx->prepare("SELECT ti.*, u.username 
                FROM ticket_images ti
                LEFT JOIN user u ON ti.user_id = u.id
                WHERE ti.ticket_id = ?
                ORDER BY ti.created_at DESC");
            $stmt->execute([$ticketId]);
            
            $images = [];
            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $images[] = $this->createImageFromData($data);
            }
            
            return $images;
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des images par ticket: " . $e->getMessage());
            return [];
        }
    }
    
    public function save($image) {
        try {
            $stmt = $this->cnx->prepare(
                "INSERT INTO ticket_images 
                (ticket_id, user_id, filename, original_name, mime_type, file_size, in_message, message_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );
            
            $result = $stmt->execute([
                $image->getTicketId(),
                $image->getUserId(),
                $image->getFilename(),
                $image->getOriginalName(),
                $image->getMimeType(),
                $image->getFileSize(),
                $image->isInMessage(),
                $image->getMessageId()
            ]);
            
            if ($result) {
                $id = $this->cnx->lastInsertId();
                $image = $this->find($id);
                return $image;
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erreur lors de l'enregistrement de l'image: " . $e->getMessage());
            return false;
        }
    }
    
    public function delete($id) {
        try {
            // On récupère d'abord l'image pour connaître le nom du fichier
            $image = $this->find($id);
            if (!$image) {
                return false;
            }
            
            // Supprimer l'entrée de la base de données
            $stmt = $this->cnx->prepare("DELETE FROM ticket_images WHERE id = ?");
            $result = $stmt->execute([$id]);
            
            // Si la suppression a réussi, on retourne l'image pour que le contrôleur puisse supprimer le fichier physique
            if ($result) {
                return $image;
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de l'image: " . $e->getMessage());
            return false;
        }
    }
    
    public function update($image) {
        try {
            $stmt = $this->cnx->prepare(
                "UPDATE ticket_images 
                SET ticket_id = ?, user_id = ?, filename = ?, original_name = ?, 
                    mime_type = ?, file_size = ?, in_message = ?, message_id = ? 
                WHERE id = ?"
            );
            
            $result = $stmt->execute([
                $image->getTicketId(),
                $image->getUserId(),
                $image->getFilename(),
                $image->getOriginalName(),
                $image->getMimeType(),
                $image->getFileSize(),
                $image->isInMessage(),
                $image->getMessageId(),
                $image->getId()
            ]);
            
            return $result;
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour de l'image: " . $e->getMessage());
            return false;
        }
    }
    
    private function createImageFromData($data) {
        $image = new TicketImage($data['id']);
        $image->setTicketId($data['ticket_id'])
            ->setUserId($data['user_id'])
            ->setFilename($data['filename'])
            ->setOriginalName($data['original_name'])
            ->setMimeType($data['mime_type'])
            ->setFileSize($data['file_size'])
            ->setCreatedAt($data['created_at'])
            ->setInMessage($data['in_message']);
            
        if (isset($data['message_id'])) {
            $image->setMessageId($data['message_id']);
        }
        
        if (isset($data['username'])) {
            $image->setUsername($data['username']);
        }
        
        return $image;
    }
    
    public function deleteByTicketId($ticketId) {
        try {
            // On récupère d'abord toutes les images du ticket
            $images = $this->findByTicketId($ticketId);
            
            // Supprimer les entrées de la base de données
            $stmt = $this->cnx->prepare("DELETE FROM ticket_images WHERE ticket_id = ?");
            $result = $stmt->execute([$ticketId]);
            
            // Si la suppression a réussi, on retourne les images pour que le contrôleur puisse supprimer les fichiers physiques
            if ($result) {
                return $images;
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression des images par ticket: " . $e->getMessage());
            return false;
        }
    }
}
