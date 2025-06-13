<?php

require_once "Repository/EntityRepository.php";
require_once "Class/ServiceDemandeur.php";

class ServiceDemandeurRepository extends EntityRepository {
    
    public function __construct() {
        parent::__construct();
    }
    
    public function find($id) {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM service_demandeur WHERE id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$data) {
                return false;
            }
            
            $service = new ServiceDemandeur($data['id']);
            $service->setNom($data['nom']);
            
            return $service;
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche du service: " . $e->getMessage());
            return false;
        }
    }
    
    public function findAll() {
        try {
            $stmt = $this->cnx->prepare("SELECT * FROM service_demandeur ORDER BY nom");
            $stmt->execute();
            $datas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("ServiceDemandeurRepository::findAll - Nombre de services trouvés: " . count($datas));
            
            $services = [];
            foreach ($datas as $data) {
                $service = new ServiceDemandeur($data['id']);
                $service->setNom($data['nom']);
                $services[] = $service;
            }
            
            return $services;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des services: " . $e->getMessage());
            return [];
        }
    }
    
    public function findPaginated($page = 1, $perPage = 10, $search = '') {
        try {
            $offset = ($page - 1) * $perPage;
            
            $sql = "SELECT * FROM service_demandeur";
            $params = [];
            
            if (!empty($search)) {
                $sql .= " WHERE nom LIKE ?";
                $params[] = "%$search%";
            }
            
            $sql .= " ORDER BY nom ASC LIMIT ? OFFSET ?";
            
            $stmt = $this->cnx->prepare($sql);
            
            // Déboguer la requête
            error_log("ServiceDemandeurRepository::findPaginated - SQL Query avant bindValue: " . $this->interpolateQuery($sql, array_merge($params, [$perPage, $offset])));
            
            // Ajouter les paramètres en utilisant bindValue avec les types explicites
            $paramIndex = 1;
            
            // Ajouter les paramètres de recherche si présents
            if (!empty($search)) {
                $stmt->bindValue($paramIndex++, "%$search%", PDO::PARAM_STR);
            }
            
            // Ajouter les paramètres de pagination avec le type explicite PDO::PARAM_INT
            $stmt->bindValue($paramIndex++, (int)$perPage, PDO::PARAM_INT);
            $stmt->bindValue($paramIndex++, (int)$offset, PDO::PARAM_INT);
            
            $stmt->execute();
            $datas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("ServiceDemandeurRepository::findPaginated - Nombre de résultats: " . count($datas));
            
            $services = [];
            foreach ($datas as $data) {
                $service = new ServiceDemandeur($data['id']);
                $service->setNom($data['nom']);
                $services[] = $service;
            }
            
            return $services;
        } catch (PDOException $e) {
            error_log("Erreur lors de la pagination des services: " . $e->getMessage() . "\nTrace: " . $e->getTraceAsString());
            return [];
        }
    }
    
    public function countAll($search = '') {
        try {
            $sql = "SELECT COUNT(*) FROM service_demandeur";
            $params = [];
            
            if (!empty($search)) {
                $sql .= " WHERE nom LIKE ?";
                $params[] = "%$search%";
            }
            
            error_log("ServiceDemandeurRepository::countAll - SQL Query: " . $this->interpolateQuery($sql, $params));
            
            $stmt = $this->cnx->prepare($sql);
            $stmt->execute($params);
            
            $count = (int)$stmt->fetchColumn();
            error_log("ServiceDemandeurRepository::countAll - Nombre total: " . $count);
            
            return $count;
        } catch (PDOException $e) {
            error_log("Erreur lors du comptage des services: " . $e->getMessage());
            return 0;
        }
    }
    
    private function interpolateQuery($query, $params) {
        $keys = array();
        $values = array();
        
        // Construire un tableau associatif de valeurs sécurisées pour l'affichage
        foreach ($params as $key => $value) {
            if (is_string($key)) {
                $keys[] = '/:' . $key . '/';
            } else {
                $keys[] = '/[?]/';
            }
            
            if (is_string($value)) {
                $values[] = "'" . addslashes($value) . "'";
            } elseif (is_array($value)) {
                $values[] = implode(',', $value);
            } elseif (is_null($value)) {
                $values[] = 'NULL';
            } else {
                $values[] = $value;
            }
        }
        
        return preg_replace($keys, $values, $query, 1, $count);
    }
    
    public function save($service) {
        try {
            $stmt = $this->cnx->prepare("INSERT INTO service_demandeur (nom) VALUES (?)");
            $stmt->execute([$service->getNom()]);
            
            if ($stmt->rowCount() > 0) {
                $id = $this->cnx->lastInsertId();
                return $this->find($id);
            }
            
            return false;
        } catch (PDOException $e) {
            error_log("Erreur lors de l'ajout du service: " . $e->getMessage());
            return false;
        }
    }
    
    public function update($service) {
        try {
            $stmt = $this->cnx->prepare("UPDATE service_demandeur SET nom = ? WHERE id = ?");
            return $stmt->execute([$service->getNom(), $service->getId()]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour du service: " . $e->getMessage());
            return false;
        }
    }
    
    public function delete($id) {
        try {
            $stmt = $this->cnx->prepare("DELETE FROM service_demandeur WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression du service: " . $e->getMessage());
            return false;
        }
    }

}