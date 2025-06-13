<?php

require_once "Repository/EntityRepository.php";
require_once "Class/ServiceIntervenant.php";

class ServiceIntervenantRepository extends EntityRepository {
    
    public function __construct() {
        parent::__construct();
    }
    
    public function find($id) {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM service_intervenant WHERE id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$data) {
                return false;
            }
            
            $service = new ServiceIntervenant($data['id']);
            $service->setName($data['name']);
            
            return $service;
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche du service intervenant: " . $e->getMessage());
            return false;
        }
    }
    
    public function findAll() {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM service_intervenant ORDER BY name");
            $stmt->execute();
            $datas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $services = [];
            foreach ($datas as $data) {
                $service = new ServiceIntervenant($data['id']);
                $service->setName($data['name']);
                $services[] = $service;
            }
            
            return $services;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des services intervenants: " . $e->getMessage());
            return false;
        }
    }
    
    public function save($service) {
        try {
            $stmt = $this->cnx->prepare("INSERT INTO service_intervenant (name) VALUES (?)");
            $stmt->execute([$service->getName()]);
            
            if ($stmt->rowCount() > 0) {
                $id = $this->cnx->lastInsertId();
                return new ServiceIntervenant($id);
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erreur lors de l'ajout du service intervenant: " . $e->getMessage());
            return false;
        }
    }
    
    public function update($service) {
        try {
            $stmt = $this->cnx->prepare("UPDATE service_intervenant SET name = ? WHERE id = ?");
            return $stmt->execute([$service->getName(), $service->getId()]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour du service intervenant: " . $e->getMessage());
            return false;
        }
    }
    
    public function delete($id) {
        try {
            $stmt = $this->cnx->prepare("DELETE FROM service_intervenant WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression du service intervenant: " . $e->getMessage());
            return false;
        }
    }
}