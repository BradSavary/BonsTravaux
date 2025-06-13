<?php

require_once "Repository/EntityRepository.php";
require_once "Class/TicketCategory.php";

class TicketCategoryRepository extends EntityRepository {
    
    public function __construct() {
        parent::__construct();
    }
    
    public function find($id) {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM ticket_category WHERE id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$data) {
                return false;
            }
            
            return $this->createCategoryFromData($data);
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche d'une catégorie : " . $e->getMessage());
            return false;
        }
    }
    
    public function findAll() {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM ticket_category ORDER BY name");
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $categories = [];
            foreach ($data as $row) {
                $categories[] = $this->createCategoryFromData($row);
            }
            
            return $categories;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des catégories : " . $e->getMessage());
            return [];
        }
    }
    
    public function findByServiceId($serviceId) {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM ticket_category WHERE service_id = ? ORDER BY name");
            $stmt->execute([$serviceId]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $categories = [];
            foreach ($data as $row) {
                $categories[] = $this->createCategoryFromData($row);
            }
            
            return $categories;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des catégories par service : " . $e->getMessage());
            return [];
        }
    }
    
    public function searchByNameAndService($query, $serviceId) {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM ticket_category WHERE service_id = ? AND name LIKE ? ORDER BY name LIMIT 10");
            $stmt->execute([$serviceId, '%' . $query . '%']);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $categories = [];
            foreach ($data as $row) {
                $categories[] = $this->createCategoryFromData($row);
            }
            
            return $categories;
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche de catégories par nom : " . $e->getMessage());
            return [];
        }
    }
    
    public function save($category) {
        try {
            $stmt = $this->cnx->prepare("INSERT INTO ticket_category (name, service_id) VALUES (?, ?)");
            $success = $stmt->execute([$category->getName(), $category->getServiceId()]);
            
            if ($success) {
                $id = $this->cnx->lastInsertId();
                return $this->find($id);
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erreur lors de l'ajout d'une catégorie : " . $e->getMessage());
            return false;
        }
    }
    
    public function update($category) {
        try {
            $stmt = $this->cnx->prepare("UPDATE ticket_category SET name = ?, service_id = ? WHERE id = ?");
            $success = $stmt->execute([$category->getName(), $category->getServiceId(), $category->getId()]);
            
            return $success;
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour d'une catégorie : " . $e->getMessage());
            return false;
        }
    }
    
    public function delete($id) {
        try {
            $stmt = $this->cnx->prepare("DELETE FROM ticket_category WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression d'une catégorie : " . $e->getMessage());
            return false;
        }
    }
    
    private function createCategoryFromData($data) {
        $category = new TicketCategory($data['id']);
        $category->setName($data['name']);
        $category->setServiceId($data['service_id']);
        $category->setCreatedAt($data['created_at']);
        
        return $category;
    }
}
