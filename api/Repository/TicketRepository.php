<?php

require_once "Repository/EntityRepository.php";
require_once "Class/Ticket.php";

class TicketRepository extends EntityRepository {
    
    public function __construct() {
        parent::__construct();
    }        public function find($id) {
            try {
                $stmt = $this->cnx->prepare("
                    SELECT t.*, sd.nom as service_nom, si.name as service_intervenant_name,
                    u_interv.username as intervenant_username, tc.name as category_name
                    FROM ticket t
                    LEFT JOIN service_demandeur sd ON t.service_id = sd.id
                    LEFT JOIN service_intervenant si ON t.service_intervenant_id = si.id
                    LEFT JOIN user u_interv ON t.intervenant_id = u_interv.id
                    LEFT JOIN ticket_category tc ON t.category_id = tc.id
                    WHERE t.id = ?
                ");
                $stmt->execute([$id]);
                $data = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$data) {
                    return false;
                }
                
                $ticket = $this->createTicketFromData($data);
                return $ticket;
            } catch (PDOException $e) {
                error_log("Erreur lors de la recherche du ticket: " . $e->getMessage());
                return false;
            }
        }

        public function findAll() {
            try {
                $stmt = $this->cnx->prepare("
                    SELECT t.*, 
                        s.nom as service_nom,
                        si.name as service_intervenant_name 
                    FROM ticket t
                    LEFT JOIN service_demandeur s ON t.service_id = s.id
                    LEFT JOIN service_intervenant si ON t.service_intervenant_id = si.id
                    ORDER BY t.date_creation DESC
                ");
                $stmt->execute();
                $datas = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $tickets = [];
                foreach ($datas as $data) {
                    $tickets[] = $this->createTicketFromData($data);
                }
                
                return $tickets;
            } catch (PDOException $e) {
                error_log("Erreur lors de la récupération des tickets: " . $e->getMessage());
                return false;
            }
        }
    
    public function findByUserId($userId) {
        try {
            $stmt = $this->cnx->prepare("
                SELECT t.*, 
                    s.nom as service_nom,
                    si.name as service_intervenant_name 
                FROM ticket t
                LEFT JOIN service_demandeur s ON t.service_id = s.id
                LEFT JOIN service_intervenant si ON t.service_intervenant_id = si.id
                WHERE t.user_id = ?
                ORDER BY t.date_creation DESC
            ");
            $stmt->execute([$userId]);
            $datas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $tickets = [];
            foreach ($datas as $data) {
                $tickets[] = $this->createTicketFromData($data);
            }
            
            return $tickets;
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des tickets de l'utilisateur: " . $e->getMessage());
            return false;
        }
    }

    /**
 * Récupère les tickets paginés pour un utilisateur spécifique
 */
public function findByUserIdPaginated($userId, $page = 1, $perPage = 10, $search = '', $statusFilters = [], $serviceIntervenantId = '') {
    try {
        $offset = ($page - 1) * $perPage;
          $sql = "SELECT t.*, 
                s.nom as service_nom, 
                si.name as service_intervenant_name, 
                u2.username as intervenant_username,
                tc.name as category_name
                FROM ticket t
                LEFT JOIN service_demandeur s ON t.service_id = s.id
                LEFT JOIN service_intervenant si ON t.service_intervenant_id = si.id
                LEFT JOIN user u2 ON t.intervenant_id = u2.id
                LEFT JOIN ticket_category tc ON t.category_id = tc.id
                WHERE t.user_id = ?";
        
        $params = [$userId];
        
        // Ajouter la condition de recherche si elle existe
        if (!empty($search)) {
            $sql .= " AND (t.details LIKE ? OR t.lieu_intervention LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        // Ajouter les filtres de statut si définis
        if (!empty($statusFilters)) {
            $placeholders = implode(',', array_fill(0, count($statusFilters), '?'));
            $sql .= " AND t.statut IN ($placeholders)";
            $params = array_merge($params, $statusFilters);
        }
        
        // Ajouter le filtre de service intervenant si défini
        if (!empty($serviceIntervenantId)) {
            $sql .= " AND t.service_intervenant_id = ?";
            $params[] = $serviceIntervenantId;
        }
        
        $sql .= " ORDER BY t.date_creation DESC LIMIT ? OFFSET ?";
        
        $stmt = $this->cnx->prepare($sql);
        
        // Ajouter les paramètres de pagination
        $params[] = (int)$perPage;
        $params[] = (int)$offset;
        
        // Binder tous les paramètres
        for ($i = 0; $i < count($params); $i++) {
            $value = $params[$i];
            $type = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue($i + 1, $value, $type);
        }
        
        $stmt->execute();
        $datas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $tickets = [];
        foreach ($datas as $data) {
            $tickets[] = $this->createTicketFromData($data);
        }
        
        return $tickets;
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des tickets paginés: " . $e->getMessage());
        return [];
    }
}

/**
 * Compte le nombre total de tickets pour un utilisateur avec filtres
 */
public function countUserTickets($userId, $search = '', $statusFilters = [], $serviceIntervenantId = '') {
    try {
        $sql = "SELECT COUNT(*) FROM ticket t WHERE t.user_id = ?";
        $params = [$userId];
        
        // Ajouter la condition de recherche si elle existe
        if (!empty($search)) {
            $sql .= " AND (t.details LIKE ? OR t.lieu_intervention LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        // Ajouter les filtres de statut si définis
        if (!empty($statusFilters)) {
            $placeholders = implode(',', array_fill(0, count($statusFilters), '?'));
            $sql .= " AND t.statut IN ($placeholders)";
            $params = array_merge($params, $statusFilters);
        }
        
        // Ajouter le filtre de service intervenant si défini
        if (!empty($serviceIntervenantId)) {
            $sql .= " AND t.service_intervenant_id = ?";
            $params[] = $serviceIntervenantId;
        }
        
        $stmt = $this->cnx->prepare($sql);
        
        // Binder tous les paramètres
        for ($i = 0; $i < count($params); $i++) {
            $value = $params[$i];
            $type = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue($i + 1, $value, $type);
        }
        
        $stmt->execute();
        return (int)$stmt->fetchColumn();
    } catch (PDOException $e) {
        error_log("Erreur lors du comptage des tickets: " . $e->getMessage());
        return 0;
    }
}
    
   public function findByServiceIntervenantId($serviceIntervenantId) {
    try {
        $stmt = $this->cnx->prepare("
            SELECT t.*, 
                   s.nom as service_nom,
                   si.name as service_intervenant_name 
            FROM ticket t
            LEFT JOIN service_demandeur s ON t.service_id = s.id
            LEFT JOIN service_intervenant si ON t.service_intervenant_id = si.id
            WHERE t.service_intervenant_id = ?
            ORDER BY t.date_creation DESC
        ");
        $stmt->execute([$serviceIntervenantId]);
        $datas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $tickets = [];
        foreach ($datas as $data) {
            $tickets[] = $this->createTicketFromData($data);
        }
        
        return $tickets;
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des tickets par service intervenant: " . $e->getMessage());
        return false;
    }
}
public function save($ticket) {
    try {     
        $stmt = $this->cnx->prepare("
            INSERT INTO ticket (
                user_id, username, site, lieu_intervention, service_id, 
                service_intervenant_id, details, voir_avant_intervention, statut, date_creation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $result = $stmt->execute([
            $ticket->getUserId(),
            $ticket->getUsername(),
            $ticket->getSite(),
            $ticket->getLieuIntervention(),
            $ticket->getServiceId(),
            $ticket->getServiceIntervenantId(),
            $ticket->getDetails(),
            $ticket->getVoirAvantIntervention() ? 1 : 0,
            $ticket->getStatut()
        ]);
        
        if ($result) {
            $id = $this->cnx->lastInsertId();
            return $this->find($id);
        }
        
        $errorInfo = $stmt->errorInfo();
        error_log("Erreur SQL: " . $errorInfo[2]);
        
        return false;
    } catch (PDOException $e) {
        error_log("Erreur PDO lors de l'enregistrement du ticket: " . $e->getMessage());
        throw $e;
    } catch (Exception $e) {
        error_log("Erreur lors de l'enregistrement du ticket: " . $e->getMessage());
        throw $e;
    }
}
    
    public function update($ticket) {
    try {
        $stmt = $this->cnx->prepare("
            UPDATE ticket SET 
                user_id = ?, 
                username = ?, 
                site = ?, 
                lieu_intervention = ?,
                service_id = ?, 
                nature_id = ?, 
                details = ?, 
                voir_avant_intervention = ?, 
                statut = ?
            WHERE id = ?
        ");
        
        $result = $stmt->execute([
            $ticket->getUserId(),
            $ticket->getUsername(),
            $ticket->getSite(),
            $ticket->getLieuIntervention(), // Ajouter à la requête
            $ticket->getServiceId(),
            $ticket->getNatureId(),
            $ticket->getDetails(),
            $ticket->getVoirAvantIntervention() ? 1 : 0,
            $ticket->getStatut(),
            $ticket->getId()
        ]);
        
        return $result;
    } catch (PDOException $e) {
        error_log("Erreur lors de la mise à jour du ticket: " . $e->getMessage());
        return false;
    }
}

public function updateStatus($ticketId, $newStatus, $intervenantId, $customIntervenantId = null) {
    try {
        // Récupérer l'état actuel du ticket
        $currentTicket = $this->find($ticketId);
        if (!$currentTicket) {
            return false;
        }
        
        // Si un intervenant personnalisé est spécifié, l'utiliser pour tous les statuts
        if ($customIntervenantId !== null) {
            $stmt = $this->cnx->prepare("
                UPDATE ticket SET statut = ?, intervenant_id = ? WHERE id = ?
            ");
            return $stmt->execute([$newStatus, $customIntervenantId, $ticketId]);
        }
        // Si le ticket passe à "En cours" et qu'il n'y a pas encore d'intervenant
        elseif ($newStatus === 'En cours' && empty($currentTicket->getIntervenantId())) {
            // Pour le passage à "En cours" sans intervenant spécifié, on utilise l'utilisateur actuel
            $stmt = $this->cnx->prepare("
                UPDATE ticket SET statut = ?, intervenant_id = ? WHERE id = ?
            ");
            return $stmt->execute([$newStatus, $intervenantId, $ticketId]);
        } 
        elseif ($newStatus === 'Ouvert' && $currentTicket->getStatut() === 'En cours') {
            // Pour le passage de "En cours" à "Ouvert", on retire l'intervenant
            $stmt = $this->cnx->prepare("
                UPDATE ticket SET statut = ?, intervenant_id = NULL WHERE id = ?
            ");
            return $stmt->execute([$newStatus, $ticketId]);
        }
        else {
            // Pour tous les autres changements de statut sans changement d'intervenant
            // on conserve l'intervenant existant et on met à jour uniquement le statut
            $stmt = $this->cnx->prepare("
                UPDATE ticket SET statut = ? WHERE id = ?
            ");
            return $stmt->execute([$newStatus, $ticketId]);
        }
    } catch (PDOException $e) {
        error_log("Erreur lors de la mise à jour du statut: " . $e->getMessage());
        return false;
    }
}
    
    public function delete($id) {
        try {
            $stmt = $this->cnx->prepare("DELETE FROM ticket WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression du ticket: " . $e->getMessage());
            return false;
        }
    }
    
private function createTicketFromData($data) {
    $ticket = new Ticket($data['id']);
    $ticket->setUserId($data['user_id']);
    $ticket->setUsername($data['username']);
    $ticket->setSite($data['site']);
    $ticket->setLieuIntervention($data['lieu_intervention']);
    $ticket->setServiceId($data['service_id']);
    $ticket->setServiceIntervenantId($data['service_intervenant_id']); 
    $ticket->setDetails($data['details']);
    $ticket->setVoirAvantIntervention($data['voir_avant_intervention'] ? true : false);
    $ticket->setDateCreation($data['date_creation']);
    $ticket->setStatut($data['statut']);
    
    // Ajouter les relations
    if (isset($data['service_nom'])) {
        $ticket->setServiceNom($data['service_nom']);
    }
      // Ajouter directement le nom du service intervenant
    if (isset($data['service_intervenant_name'])) {
        $ticket->setServiceIntervenantName($data['service_intervenant_name']);
    }
    
    // Ajouter les informations de catégorie
    if (isset($data['category_id']) && $data['category_id']) {
        $ticket->setCategoryId($data['category_id']);
        $ticket->setCategoryName(isset($data['category_name']) ? $data['category_name'] : null);
    }

     if (isset($data['intervenant_id'])) {
        $ticket->setIntervenantId($data['intervenant_id']);
    }
    
    if (isset($data['intervenant_username'])) {
        $ticket->setIntervenantUsername($data['intervenant_username']);
    }
    
    return $ticket;
}
/**
 * Récupère tous les statuts distincts de tickets
 */
public function getDistinctStatuses() {
    try {
        $stmt = $this->cnx->prepare("SELECT DISTINCT statut FROM ticket ORDER BY statut");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des statuts: " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère tous les intervenants distincts des tickets
 */
public function getDistinctIntervenants() {
    try {
        $stmt = $this->cnx->prepare("
            SELECT DISTINCT u.id, u.username 
            FROM ticket t 
            JOIN user u ON t.intervenant_id = u.id 
            WHERE t.intervenant_id IS NOT NULL
            ORDER BY u.username
        ");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des intervenants distincts: " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère les catégories distinctes utilisées dans les tickets
 * avec filtrage optionnel par permissions de l'utilisateur
 * 
 * @param array $ticketPermissions Liste des permissions de tickets de l'utilisateur (ex: ['InformatiqueTicket'])
 * @return array Liste des catégories
 */
public function getDistinctCategories($ticketPermissions = []) {
    try {
        // Si pas de permissions spécifiées, retourne un tableau vide
        if (empty($ticketPermissions)) {
            return [];
        }
        
        $permissionConditions = [];
        $params = [];
        
        foreach ($ticketPermissions as $permission) {
            if ($permission === 'InformatiqueTicket') {
                $permissionConditions[] = "si.name LIKE '%Informatique%'";
            } elseif ($permission === 'TechniqueTicket') {
                $permissionConditions[] = "si.name LIKE '%Technique%'";
            } elseif ($permission === 'EconomatTicket') {
                $permissionConditions[] = "si.name LIKE '%Économat%'";
            }
        }
        
        // Si pas de conditions de permission valides, retourner vide
        if (empty($permissionConditions)) {
            return [];
        }
        
        $permissionSql = '(' . implode(' OR ', $permissionConditions) . ')';
        
        $sql = "
            SELECT DISTINCT tc.id, tc.name 
            FROM ticket_category tc
            INNER JOIN ticket t ON t.category_id = tc.id
            INNER JOIN service_intervenant si ON t.service_intervenant_id = si.id
            WHERE {$permissionSql}
            ORDER BY tc.name ASC
        ";
        
        $stmt = $this->cnx->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des catégories distinctes: " . $e->getMessage());
        return [];
    }
}

/**
 * Compte le nombre total de tickets que l'utilisateur peut gérer avec filtres
 */
public function countManageableTickets($userId, $ticketPermissions, $search = '', $statusFilters = [], $serviceIntervenantId = '', $intervenantIds = [], $categoryFilters = []) {
    try {
        $whereConditions = [];
        $params = [];
        
        // Ajouter les conditions pour les permissions de tickets
        $permissionConditions = [];
        foreach ($ticketPermissions as $permission) {
            if ($permission === 'InformatiqueTicket') {
                $permissionConditions[] = "si.name LIKE '%Informatique%'";
            } elseif ($permission === 'TechniqueTicket') {
                $permissionConditions[] = "si.name LIKE '%Technique%'";
            } elseif ($permission === 'EconomatTicket') {
                $permissionConditions[] = "si.name LIKE '%Économat%'";
            }
        }
        
        if (!empty($permissionConditions)) {
            $whereConditions[] = '(' . implode(' OR ', $permissionConditions) . ')';
        }
        
        // Ajouter la condition de recherche
        if (!empty($search)) {
            $whereConditions[] = "(t.details LIKE ? OR sd.nom LIKE ? OR u.username LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        // Ajouter le filtrage par statut
        if (!empty($statusFilters)) {
            $statusPlaceholders = implode(',', array_fill(0, count($statusFilters), '?'));
            $whereConditions[] = "t.statut IN ($statusPlaceholders)";
            foreach ($statusFilters as $status) {
                $params[] = $status;
            }
        }
        
        // Ajouter le filtrage par service intervenant
        if (!empty($serviceIntervenantId)) {
            $whereConditions[] = "t.service_intervenant_id = ?";
            $params[] = $serviceIntervenantId;
        }
        
        // Ajouter le filtrage par intervenants
        if (!empty($intervenantIds)) {
            $intervenantPlaceholders = implode(',', array_fill(0, count($intervenantIds), '?'));
            $whereConditions[] = "t.intervenant_id IN ($intervenantPlaceholders)";
            foreach ($intervenantIds as $intervenantId) {
                $params[] = $intervenantId;
            }
        }
        
        // Ajouter le filtrage par catégorie
        if (!empty($categoryFilters)) {
            $categoryConditions = [];
            
            // Vérifier si on inclut les non catégorisés
            $includeUncategorized = false;
            $categoryFiltersCopy = $categoryFilters;
            
            if (($key = array_search('uncategorized', $categoryFiltersCopy)) !== false) {
                $includeUncategorized = true;
                unset($categoryFiltersCopy[$key]);
            }
            
            // Si on a des catégories spécifiques
            if (!empty($categoryFiltersCopy)) {
                $categoryPlaceholders = implode(',', array_fill(0, count($categoryFiltersCopy), '?'));
                $categoryConditions[] = "t.category_id IN ($categoryPlaceholders)";
                foreach ($categoryFiltersCopy as $categoryId) {
                    $params[] = $categoryId;
                }
            }
            
            // Ajouter la condition pour les non catégorisés si nécessaire
            if ($includeUncategorized) {
                $categoryConditions[] = "t.category_id IS NULL";
            }
            
            // Ajouter la condition à la requête si on a des conditions
            if (!empty($categoryConditions)) {
                $whereConditions[] = "(" . implode(' OR ', $categoryConditions) . ")";
            }
        }
        
        // Construire la clause WHERE
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Requête SQL finale pour compter
        $sql = "
            SELECT COUNT(DISTINCT t.id) as total
            FROM ticket t
            LEFT JOIN service_demandeur sd ON t.service_id = sd.id
            LEFT JOIN service_intervenant si ON t.service_intervenant_id = si.id
            LEFT JOIN user u ON t.user_id = u.id
            $whereClause
        ";
        
        $stmt = $this->cnx->prepare($sql);
        
        // Exécuter avec les paramètres bindés par index
        $paramIndex = 1;
        foreach ($params as $param) {
            $stmt->bindValue($paramIndex++, $param);
        }
        
        $stmt->execute();
        $count = $stmt->fetchColumn();
        
        return $count;
    } catch (PDOException $e) {
        error_log("Erreur lors du comptage des tickets gérables: " . $e->getMessage());
        return 0;
    }
}

/**
 * Récupère les tickets paginés que l'utilisateur peut gérer avec filtres
 */
public function findManageablePaginated($userId, $ticketPermissions, $page = 1, $perPage = 10, $search = '', $statusFilters = [], $serviceIntervenantId = '', $intervenantIds = [], $categoryFilters = []) {
    try {
        $offset = ($page - 1) * $perPage;
        $whereConditions = [];
        $params = [];

        error_log("findManageablePaginated - Filtres statut: " . json_encode($statusFilters));
        error_log("findManageablePaginated - Service intervenant: " . $serviceIntervenantId);
        error_log("findManageablePaginated - Intervenants: " . json_encode($intervenantIds));
        error_log("findManageablePaginated - Categories: " . json_encode($categoryFilters));

        
        // Ajouter les conditions pour les permissions de tickets
        $permissionConditions = [];
        foreach ($ticketPermissions as $permission) {
            if ($permission === 'InformatiqueTicket') {
                $permissionConditions[] = "si.name LIKE '%Informatique%'";
            } elseif ($permission === 'TechniqueTicket') {
                $permissionConditions[] = "si.name LIKE '%Technique%'";
            } elseif ($permission === 'EconomatTicket') {
                $permissionConditions[] = "si.name LIKE '%Économat%'";
            }
        }
        
        if (!empty($permissionConditions)) {
            $whereConditions[] = '(' . implode(' OR ', $permissionConditions) . ')';
        }
        
        // Ajouter la condition de recherche
        if (!empty($search)) {
            $whereConditions[] = "(t.details LIKE ? OR sd.nom LIKE ? OR u.username LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        // Ajouter le filtrage par statut
        if (!empty($statusFilters)) {
            $statusPlaceholders = implode(',', array_fill(0, count($statusFilters), '?'));
            $whereConditions[] = "t.statut IN ($statusPlaceholders)";
            foreach ($statusFilters as $status) {
                $params[] = $status;
            }
        }
        
        // Ajouter le filtrage par service intervenant
        if (!empty($serviceIntervenantId)) {
            $whereConditions[] = "t.service_intervenant_id = ?";
            $params[] = $serviceIntervenantId;
        }
        
        // Ajouter le filtrage par intervenants
        if (!empty($intervenantIds)) {
            $intervenantPlaceholders = implode(',', array_fill(0, count($intervenantIds), '?'));
            $whereConditions[] = "t.intervenant_id IN ($intervenantPlaceholders)";
            foreach ($intervenantIds as $intervenantId) {
                $params[] = $intervenantId;
            }
        }
        
        // Ajouter le filtrage par catégorie
        if (!empty($categoryFilters)) {
            $categoryConditions = [];
            
            // Vérifier si on inclut les non catégorisés
            $includeUncategorized = false;
            $categoryFiltersCopy = $categoryFilters;
            
            if (($key = array_search('uncategorized', $categoryFiltersCopy)) !== false) {
                $includeUncategorized = true;
                unset($categoryFiltersCopy[$key]);
            }
            
            // Si on a des catégories spécifiques
            if (!empty($categoryFiltersCopy)) {
                $categoryPlaceholders = implode(',', array_fill(0, count($categoryFiltersCopy), '?'));
                $categoryConditions[] = "t.category_id IN ($categoryPlaceholders)";
                foreach ($categoryFiltersCopy as $categoryId) {
                    $params[] = $categoryId;
                }
            }
            
            // Ajouter la condition pour les non catégorisés si nécessaire
            if ($includeUncategorized) {
                $categoryConditions[] = "t.category_id IS NULL";
            }
            
            // Ajouter la condition à la requête si on a des conditions
            if (!empty($categoryConditions)) {
                $whereConditions[] = "(" . implode(' OR ', $categoryConditions) . ")";
            }
        }
        
        // Construire la clause WHERE
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Requête SQL finale pour récupérer les tickets
        $sql = "
            SELECT t.*, sd.nom as service_nom, si.name as service_intervenant_name,
                  ui.username as intervenant_username
            FROM ticket t
            LEFT JOIN service_demandeur sd ON t.service_id = sd.id
            LEFT JOIN service_intervenant si ON t.service_intervenant_id = si.id
            LEFT JOIN user u ON t.user_id = u.id
            LEFT JOIN user ui ON t.intervenant_id = ui.id
            $whereClause
            ORDER BY t.date_creation DESC
            LIMIT ? OFFSET ?
        ";
        
        error_log("findManageablePaginated - SQL Query: " . $sql . " avec params: " . json_encode($params));
        
        $stmt = $this->cnx->prepare($sql);
        
        // Ajouter les paramètres dans l'ordre
        $paramIndex = 1;
        foreach ($params as $param) {
            $stmt->bindValue($paramIndex++, $param);
        }
        
        // Ajouter les paramètres de pagination en tant qu'entiers
        $stmt->bindValue($paramIndex++, (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue($paramIndex++, (int)$offset, PDO::PARAM_INT);
        
        $stmt->execute();
        $ticketsData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $tickets = [];
        foreach ($ticketsData as $data) {
            $tickets[] = $this->createTicketFromData($data);
        }
        
        return $tickets;
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des tickets gérables paginés: " . $e->getMessage());
        return [];
    }
}


/**
 * Aide au débogage - Remplace les placeholders par leurs valeurs dans la requête SQL
 */
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
        
        if (is_numeric($value)) {
            // Les valeurs numériques sont affichées sans guillemets
            $values[] = $value;
        } else if (is_string($value)) {
            // Les chaînes sont entourées de guillemets simples et échappées
            $values[] = "'" . str_replace("'", "\'", $value) . "'";
        } else if (is_null($value)) {
            $values[] = 'NULL';
        } else if (is_bool($value)) {
            $values[] = ($value) ? '1' : '0';
        } else {
            $values[] = "'" . $value . "'";
        }
    }
    
    // Remplacer les ? par des valeurs
    return preg_replace($keys, $values, $query, 1);
}

/**
 * Met à jour le service intervenant d'un ticket
 */
public function updateServiceIntervenant($ticketId, $serviceIntervenantId) {
    try {
        $stmt = $this->cnx->prepare("
            UPDATE ticket 
            SET service_intervenant_id = ?
            WHERE id = ?
        ");
        
        return $stmt->execute([$serviceIntervenantId, $ticketId]);
    } catch (PDOException $e) {
        error_log("Erreur lors de la mise à jour du service intervenant: " . $e->getMessage());
        return false;
    }
}

/**
 * Sauvegarde un ticket transféré (pour le cas transfer_and_keep)
 */
public function saveTransferredTicket($ticket) {
    try {
        $stmt = $this->cnx->prepare("
            INSERT INTO ticket (
                user_id, username, site, lieu_intervention, service_id,
                service_intervenant_id, details, voir_avant_intervention,
                statut, date_creation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $result = $stmt->execute([
            $ticket->getUserId(),
            $ticket->getUsername(),
            $ticket->getSite(),
            $ticket->getLieuIntervention(),
            $ticket->getServiceId(),
            $ticket->getServiceIntervenantId(),
            $ticket->getDetails(),
            $ticket->getVoirAvantIntervention() ? 1 : 0,
            $ticket->getStatut()
        ]);
        
        if ($result) {
            $id = $this->cnx->lastInsertId();
            return $this->find($id);
        }
        
        return false;
    } catch (PDOException $e) {
        error_log("Erreur lors de la création du ticket transféré: " . $e->getMessage());
        return false;
    }
}

/**
 * Récupère les tickets récents pour un utilisateur avec des permissions de gestion
 */
public function getRecentTickets($userId, array $ticketPermissions, $hours = 24) {
    try {
        // Obtenir les codes de services correspondants aux permissions
        $serviceCodes = [];
        foreach ($ticketPermissions as $permission) {
            if (preg_match('/(.+)Ticket$/', $permission, $matches)) {
                $serviceCodes[] = $matches[1];
            }
        }
        
        if (empty($serviceCodes)) {
            return [];
        }
        
        // Préparer la clause pour les services
        $serviceClause = '';
        $params = [];
        foreach ($serviceCodes as $index => $code) {
            $serviceClause .= ($index > 0 ? ' OR ' : '') . 'si.name LIKE ?';
            $params[] = '%' . $code . '%';
        }
        
        $sql = "SELECT t.id, t.details, t.date_creation, t.statut,
                sd.nom as service_nom, si.name as service_intervenant_name
                FROM ticket t
                JOIN service_demandeur sd ON t.service_id = sd.id
                JOIN service_intervenant si ON t.service_intervenant_id = si.id
                WHERE ($serviceClause) 
                AND t.date_creation >= DATE_SUB(NOW(), INTERVAL ? HOUR)
                ORDER BY t.date_creation DESC
                LIMIT 10";
                
        $params[] = $hours;
        
        $stmt = $this->cnx->prepare($sql);
        $stmt->execute($params);
        
        $tickets = [];
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $ticket = [
                'id' => $data['id'],
                'details' => $data['details'],
                'date_creation' => $data['date_creation'],
                'statut' => $data['statut'],
                'service_nom' => $data['service_nom'],
                'service_intervenant_name' => $data['service_intervenant_name']
            ];
            $tickets[] = $ticket;
        }
        
        return $tickets;
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des tickets récents: " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère les tickets assignés à un utilisateur
 */
public function getTicketsAssignedToUser($userId) {
    try {
        $sql = "SELECT t.id, t.details, t.date_creation, t.statut,
                sd.nom as service_nom, si.name as service_intervenant_name
                FROM ticket t
                JOIN service_demandeur sd ON t.service_id = sd.id
                JOIN service_intervenant si ON t.service_intervenant_id = si.id
                WHERE t.intervenant_id = ? AND t.statut = 'En cours'
                ORDER BY t.date_creation DESC";
                
        $stmt = $this->cnx->prepare($sql);
        $stmt->execute([$userId]);
        
        $tickets = [];
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $ticket = [
                'id' => $data['id'],
                'details' => $data['details'],
                'date_creation' => $data['date_creation'],
                'statut' => $data['statut'],
                'service_nom' => $data['service_nom'],
                'service_intervenant_name' => $data['service_intervenant_name']
            ];
            $tickets[] = $ticket;
        }
        
        return $tickets;
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des tickets assignés: " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère les tickets d'un utilisateur
 */
public function getUserTickets($userId, $limit = 10) {
    try {
        $sql = "SELECT t.id, t.details, t.date_creation, t.statut,
                sd.nom as service_nom, si.name as service_intervenant_name
                FROM ticket t
                JOIN service_demandeur sd ON t.service_id = sd.id
                JOIN service_intervenant si ON t.service_intervenant_id = si.id
                WHERE t.user_id = ?
                ORDER BY t.date_creation DESC
                LIMIT ?";
                
        $stmt = $this->cnx->prepare($sql);
        $stmt->execute([$userId, $limit]);
        
        $tickets = [];
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $ticket = [
                'id' => $data['id'],
                'details' => $data['details'],
                'date_creation' => $data['date_creation'],
                'statut' => $data['statut'],
                'service_nom' => $data['service_nom'],
                'service_intervenant_name' => $data['service_intervenant_name']
            ];
            $tickets[] = $ticket;
        }
        
        return $tickets;
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des tickets de l'utilisateur: " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère les tickets d'un service pour un utilisateur spécifique
 */
public function getTicketsByServiceForUser($serviceId) {
    try {
        $sql = "SELECT t.id, t.user_id, t.details, t.date_creation, t.statut,
                sd.nom as service_nom, si.name as service_intervenant_name
                FROM ticket t
                JOIN service_demandeur sd ON t.service_id = sd.id
                JOIN service_intervenant si ON t.service_intervenant_id = si.id
                WHERE  t.service_id = ?
                ORDER BY t.date_creation DESC";
                
        $stmt = $this->cnx->prepare($sql);
        $stmt->execute([$serviceId]);

        $tickets = [];
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $ticket = [
                'id' => $data['id'],
                'user_id' => $data['user_id'],
                'details' => $data['details'],
                'date_creation' => $data['date_creation'],
                'statut' => $data['statut'],
                'service_nom' => $data['service_nom'],
                'service_intervenant_name' => $data['service_intervenant_name']
            ];
            $tickets[] = $ticket;
        }
        
        return $tickets;
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des tickets par service: " . $e->getMessage());
        return [];
    }
}

public function getUserRecentTickets($userId) {
    try {
        $sql = "SELECT t.id, t.details, t.date_creation, t.statut,
                sd.nom as service_nom, si.name as service_intervenant_name
                FROM ticket t
                JOIN service_demandeur sd ON t.service_id = sd.id
                JOIN service_intervenant si ON t.service_intervenant_id = si.id
                WHERE t.user_id = ?
                ORDER BY t.date_creation DESC
                LIMIT 5";
                
        $stmt = $this->cnx->prepare($sql);
        $stmt->execute([$userId]);
        
        $tickets = [];
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $ticket = [
                'id' => $data['id'],
                'details' => $data['details'],
                'date_creation' => $data['date_creation'],
                'statut' => $data['statut'],
                'service_nom' => $data['service_nom'],
                'service_intervenant_name' => $data['service_intervenant_name']
            ];
            $tickets[] = $ticket;
        }
        
        return $tickets;
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des tickets récents de l'utilisateur: " . $e->getMessage());
        return [];
    }
}

/**
 * Compte le nombre de tickets plus anciens qu'une date spécifiée
 */
public function countTicketsOlderThan($date) {
    try {
        $stmt = $this->cnx->prepare("SELECT COUNT(*) FROM ticket WHERE DATE(date_creation) < ?");
        $stmt->execute([$date]);
        return (int)$stmt->fetchColumn();
    } catch (PDOException $e) {
        error_log("Erreur lors du comptage des tickets anciens: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Supprime définitivement les tickets plus anciens qu'une date spécifiée
 */
public function deleteTicketsOlderThan($date) {
    try {
        // Démarrer une transaction pour garantir l'intégrité des données
        $this->cnx->beginTransaction();
        
        // D'abord nous identifions les tickets à supprimer
        $stmtSelect = $this->cnx->prepare("SELECT id FROM ticket WHERE DATE(date_creation) < ?");
        $stmtSelect->execute([$date]);
        $ticketsToDelete = $stmtSelect->fetchAll(PDO::FETCH_COLUMN);
        
        if (empty($ticketsToDelete)) {
            $this->cnx->commit();
            return 0;
        }
        
        $count = count($ticketsToDelete);
        
        // Supprimer les messages liés aux tickets
        $placeholders = implode(',', array_fill(0, $count, '?'));
        
        // Essayer de supprimer des messages s'il y en a
        try {
            $stmtDeleteMessages = $this->cnx->prepare("DELETE FROM ticket_messages WHERE ticket_id IN ($placeholders)");
            $stmtDeleteMessages->execute($ticketsToDelete);
        } catch (PDOException $e) {
            error_log("Avertissement: impossible de supprimer les messages du ticket: " . $e->getMessage());
            // Continuer malgré l'erreur
        }
        
        // Essayer de supprimer l'historique du statut s'il y en a
        try {
            $stmtDeleteHistory = $this->cnx->prepare("DELETE FROM ticket_status_history WHERE ticket_id IN ($placeholders)");
            $stmtDeleteHistory->execute($ticketsToDelete);
        } catch (PDOException $e) {
            error_log("Avertissement: impossible de supprimer l'historique du statut: " . $e->getMessage());
            // Continuer malgré l'erreur
        }
        
        // Enfin, supprimer les tickets eux-mêmes
        $stmtDeleteTickets = $this->cnx->prepare("DELETE FROM ticket WHERE id IN ($placeholders)");
        $stmtDeleteTickets->execute($ticketsToDelete);
        
        // Valider la transaction
        $this->cnx->commit();
        
        return $count;
    } catch (PDOException $e) {
        // En cas d'erreur, annuler toutes les modifications
        $this->cnx->rollBack();
        error_log("Erreur lors de la suppression des tickets anciens: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Récupère les intervenants qui sont déjà intervenus sur des tickets d'un service
 */
public function getPastIntervenants($serviceIntervenantId) {
    try {
        $stmt = $this->cnx->prepare("
            SELECT DISTINCT t.intervenant_id as id, u.username
            FROM ticket t
            JOIN user u ON t.intervenant_id = u.id
            WHERE t.service_intervenant_id = ? AND t.intervenant_id IS NOT NULL
        ");
        $stmt->execute([$serviceIntervenantId]);
        
        $intervenants = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $intervenants[] = [
                'id' => $row['id'],
                'username' => $row['username']
            ];
        }
        
        return $intervenants;
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des intervenants passés: " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère tous les techniciens ayant déjà travaillé sur des tickets pour un service 
 */
public function getTechniciansForService($serviceIntervenantId) {
    try {
        $stmt = $this->cnx->prepare("
            SELECT DISTINCT u.id, u.username
            FROM user u
            JOIN user_permission up ON u.id = up.user_id
            LEFT JOIN ticket t ON t.intervenant_id = u.id AND t.service_intervenant_id = ?
            JOIN service_intervenant si ON si.id = ?
            WHERE (t.id IS NOT NULL OR up.permission LIKE CONCAT(REPLACE(si.name, ' ', ''), 'Ticket'))
            ORDER BY u.username ASC
        ");
        $stmt->execute([$serviceIntervenantId, $serviceIntervenantId]);
        
        $technicians = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $technicians[] = [
                'id' => $row['id'],
                'username' => $row['username']
            ];
        }
          return $technicians;
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des techniciens: " . $e->getMessage());
        return [];
    }
}

/**
 * Mise à jour de la catégorie d'un ticket
 */
public function updateCategory($ticketId, $categoryId) {
    try {
        $stmt = $this->cnx->prepare("UPDATE ticket SET category_id = ? WHERE id = ?");
        $result = $stmt->execute([$categoryId, $ticketId]);
        
        return $result;
    } catch (PDOException $e) {
        error_log("Erreur lors de la mise à jour de la catégorie du ticket: " . $e->getMessage());
        return false;
    }
}

/**
 * Compte le nombre de tickets dans une période donnée
 */
public function countTicketsInPeriod($startDate, $endDate) {
    try {
        $stmt = $this->cnx->prepare("
            SELECT COUNT(*) as count
            FROM ticket
            WHERE DATE(date_creation) BETWEEN ? AND ?
        ");
        
        // Ajout d'un log pour déboguer
        error_log("countTicketsInPeriod SQL: SELECT COUNT(*) FROM ticket WHERE DATE(date_creation) BETWEEN '{$startDate}' AND '{$endDate}'");
        
        $stmt->execute([$startDate, $endDate]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Ajout d'un log pour afficher le résultat
        error_log("countTicketsInPeriod result: " . print_r($result, true));
        
        return intval($result['count']);
    } catch (Exception $e) {
        error_log("Error counting tickets in period: " . $e->getMessage());
        return 0;
    }
}

/**
 * Récupère le nombre de tickets par service demandeur
 */
public function getTicketsCountByRequestingService($startDate, $endDate) {
    try {
        $stmt = $this->cnx->prepare("
            SELECT sd.id, sd.nom as service_name, COUNT(t.id) as ticket_count
            FROM ticket t
            JOIN service_demandeur sd ON t.service_id = sd.id
            WHERE DATE(t.date_creation) BETWEEN ? AND ?
            GROUP BY sd.id, sd.nom
            ORDER BY ticket_count DESC
        ");
        
        // Ajout d'un log pour déboguer
        error_log("getTicketsCountByRequestingService SQL: SELECT sd.id, sd.nom, COUNT(t.id) FROM ticket t JOIN service_demandeur sd WHERE DATE(t.created_at) BETWEEN '{$startDate}' AND '{$endDate}'");
        
        $stmt->execute([$startDate, $endDate]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ajout d'un log pour afficher le résultat
        error_log("getTicketsCountByRequestingService results: " . print_r($result, true));
        
        return $result;
    } catch (Exception $e) {
        error_log("Error getting tickets count by requesting service: " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère le nombre de tickets par statut
 */
public function getTicketsCountByStatus($startDate, $endDate) {
    try {
        $stmt = $this->cnx->prepare("
            SELECT statut, COUNT(*) as count
            FROM ticket
            WHERE date_creation BETWEEN ? AND ?
            GROUP BY statut
        ");
        $stmt->execute([$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log("Error getting tickets count by status: " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère le nombre de tickets par catégorie pour un service donné, incluant aussi les tickets sans catégorie
 */
public function getTicketsCountByCategory($serviceId, $startDate, $endDate) {
    try {
        // D'abord, récupérer les tickets avec catégorie
        $stmtWithCategory = $this->cnx->prepare("
            SELECT tc.id, tc.name as category_name, COUNT(t.id) as ticket_count
            FROM ticket t
            JOIN ticket_category tc ON t.category_id = tc.id
            WHERE t.service_intervenant_id = ? AND DATE(t.date_creation) BETWEEN ? AND ?
            GROUP BY tc.id, tc.name
            ORDER BY ticket_count DESC
        ");
        
        $stmtWithCategory->execute([$serviceId, $startDate, $endDate]);
        $resultWithCategory = $stmtWithCategory->fetchAll(PDO::FETCH_ASSOC);
        
        // Ensuite, récupérer le nombre de tickets sans catégorie (category_id est NULL)
        $stmtNoCategory = $this->cnx->prepare("
            SELECT NULL as id, 'Sans catégorie' as category_name, COUNT(id) as ticket_count
            FROM ticket
            WHERE service_intervenant_id = ? 
            AND DATE(date_creation) BETWEEN ? AND ?
            AND (category_id IS NULL OR category_id = 0)
        ");
        
        $stmtNoCategory->execute([$serviceId, $startDate, $endDate]);
        $resultNoCategory = $stmtNoCategory->fetchAll(PDO::FETCH_ASSOC);
        
        // Combiner les résultats si des tickets sans catégorie existent
        $result = $resultWithCategory;
        if (!empty($resultNoCategory) && $resultNoCategory[0]['ticket_count'] > 0) {
            $result = array_merge($result, $resultNoCategory);
        }
        
        error_log("getTicketsCountByCategory result with no category: " . print_r($result, true));
        
        return $result;
    } catch (Exception $e) {
        error_log("Error getting tickets count by category: " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère le nombre de tickets par statut pour un service donné
 */
public function getTicketsCountByStatusForService($serviceId, $startDate, $endDate) {
    try {
        $stmt = $this->cnx->prepare("
            SELECT statut, COUNT(*) as count
            FROM ticket
            WHERE service_intervenant_id = ? AND DATE(date_creation) BETWEEN ? AND ?
            GROUP BY statut
        ");
        
        error_log("getTicketsCountByStatusForService SQL: SELECT statut, COUNT(*) FROM ticket WHERE service_intervenant_id = {$serviceId} AND DATE(date_creation) BETWEEN '{$startDate}' AND '{$endDate}' GROUP BY statut");
        
        $stmt->execute([$serviceId, $startDate, $endDate]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("getTicketsCountByStatusForService result: " . print_r($result, true));
        
        return $result;
    } catch (Exception $e) {
        error_log("Error getting tickets count by status for service: " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère le nombre de tickets par technicien pour un service donné
 */
public function getTicketsCountByTechnician($serviceId, $startDate, $endDate) {
    try {
        // Cette requête complexe compte les techniciens qui sont soit:
        // 1. Assignés officiellement comme intervenant au ticket
        // 2. Ont laissé au moins un message dans le suivi du ticket
        // Sans compter en double ceux qui sont à la fois intervenants et ont laissé des messages
        $stmt = $this->cnx->prepare("
            WITH tech_activities AS (
                -- Techniciens assignés comme intervenants
                SELECT DISTINCT t.id AS ticket_id, t.intervenant_id AS user_id
                FROM ticket t
                WHERE t.service_intervenant_id = ? 
                  AND DATE(t.date_creation) BETWEEN ? AND ?
                  AND t.intervenant_id IS NOT NULL
                
                UNION
                
                -- Techniciens ayant laissé des messages
                SELECT DISTINCT tm.ticket_id, tm.user_id
                FROM ticket_messages tm
                JOIN ticket t ON t.id = tm.ticket_id
                JOIN user_permission up ON up.user_id = tm.user_id
                WHERE t.service_intervenant_id = ?
                  AND DATE(t.date_creation) BETWEEN ? AND ?
                  AND up.permission IN ('InformatiqueTicket', 'TechniqueTicket', 'EconomatTicket')
            )
            SELECT u.id, u.username, COUNT(DISTINCT ta.ticket_id) as ticket_count
            FROM user u
            JOIN tech_activities ta ON u.id = ta.user_id
            GROUP BY u.id, u.username
            ORDER BY ticket_count DESC
        ");
        
        $stmt->execute([$serviceId, $startDate, $endDate, $serviceId, $startDate, $endDate]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("getTicketsCountByTechnician result: " . print_r($result, true));
        
        return $result;
    } catch (Exception $e) {
        error_log("Error getting tickets count by technician: " . $e->getMessage());
        return [];
    }
}
}