<?php

require_once "Controller.php";
require_once "Repository/TicketRepository.php";
require_once "Repository/UserRepository.php";
require_once "Repository/UserPermissionRepository.php";
require_once "Repository/ServiceIntervenantRepository.php";
require_once "Repository/TicketStatusHistoryRepository.php";
require_once "Repository/ServiceNotificationEmailRepository.php";
require_once "Repository/TicketCategoryRepository.php";
require_once "Repository/TicketImageRepository.php";
require_once "Class/EmailSender.php";


class TicketController extends Controller {    private TicketRepository $tickets;
    private UserRepository $users;
    private UserPermissionRepository $permissions;
    private ServiceIntervenantRepository $services;
    private TicketStatusHistoryRepository $history;
    private ServiceNotificationEmailRepository $notificationEmails;
    private TicketCategoryRepository $categories;
    private TicketImageRepository $images;    public function __construct() {
        $this->tickets = new TicketRepository();
        $this->users = new UserRepository();
        $this->permissions = new UserPermissionRepository();
        $this->services = new ServiceIntervenantRepository();
        $this->history = new TicketStatusHistoryRepository();
        $this->notificationEmails = new ServiceNotificationEmailRepository();
        $this->categories = new TicketCategoryRepository();
        $this->images = new TicketImageRepository();
    }

    private function getUserFromToken($request) {
        $headers = getallheaders();
        $token = null;
        
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }
        
        if (!$token) {
            return null;
        }
        
        // Accéder à UserController pour vérifier le token
        // Note: Ceci est une simplification, idéalement on devrait réutiliser la logique d'authentification
        // depuis UserController de façon plus propre
        require_once "Controller/UserController.php";
        $userCtrl = new UserController();
        $userData = $userCtrl->verifyTokenAndGetUser($token);
        
        if (!$userData || !isset($userData['id'])) {
            return null;
        }
        
        return $this->users->find($userData['id']);
    }
    
    protected function processGetRequest(HttpRequest $request) {
        $user = $this->getUserFromToken($request);
            if (!$user) {
                return ["status" => "error", "message" => "Non autorisé", "code" => 401];
            }

            if ($request->getId() === 'statuses') {
                $statuses = $this->tickets->getDistinctStatuses();
                return ["status" => "success", "data" => $statuses];
            }

            // Action pour récupérer les techniciens disponibles pour un ticket
            if (is_numeric($request->getId()) && $request->getParam('action') === 'getTechnicians') {
                $ticketId = $request->getId();
                
                // Récupérer le ticket pour obtenir le service intervenant
                $ticket = $this->tickets->find($ticketId);
                if (!$ticket) {
                    return ["status" => "error", "message" => "Ticket introuvable", "code" => 404];
                }
                
                // Vérifier les permissions de l'utilisateur
                $hasAccessToService = $this->permissions->hasPermission($user->getId(), str_replace(' ', '', $ticket->getServiceIntervenantName()) . 'Ticket');
                $isAdmin = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
                
                if (!$hasAccessToService && !$isAdmin) {
                    return ["status" => "error", "message" => "Accès refusé à ce ticket", "code" => 403];
                }
                
                // Récupérer les techniciens non bloqués pour ce service
                $serviceId = $ticket->getServiceIntervenantId();
                $techniciansList = $this->tickets->getTechniciansForService($serviceId);
                
                // Récupérer l'intervenant actuel s'il existe
                $currentIntervenant = null;
                if ($ticket->getIntervenantId()) {
                    $currentIntervenantUser = $this->users->find($ticket->getIntervenantId());
                    if ($currentIntervenantUser) {
                        $currentIntervenant = [
                            'id' => $currentIntervenantUser->getId(),
                            'username' => $currentIntervenantUser->getUsername()
                        ];
                    }
                }
                
                // Filtrer les techniciens bloqués
                $filteredTechnicians = [];
                foreach ($techniciansList as $tech) {
                    $techUser = $this->users->find($tech['id']);
                    if ($techUser && !$techUser->getIsLock()) {
                        $filteredTechnicians[] = [
                            'id' => $tech['id'],
                            'username' => $tech['username']
                        ];
                    }
                }
                
                return [
                    "status" => "success",
                    "data" => [
                        "technicians" => $filteredTechnicians,
                        "currentIntervenant" => $currentIntervenant
                    ]
                ];
            }

            if ($request->getParam('serviceId') && $request->getParam('limit')) {
                $serviceId = $request->getParam('serviceId');
                $limit = min((int)$request->getParam('limit'), 20); // Limiter à 20 maximum
                
                $tickets = $this->tickets->getTicketsByServiceForUser($user->getId(), $serviceId);
                
                // Limiter le nombre de tickets retournés
                $tickets = array_slice($tickets, 0, $limit);
                
                return ["status" => "success", "data" => $tickets];
            }

            // Action pour compter les tickets plus anciens qu'une période donnée
            if ($request->getParam('action') === 'count_older') {
                // Vérifier si l'utilisateur est admin
                $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
                if (!$hasAdminAccess) {
                    return ["status" => "error", "message" => "Accès refusé", "code" => 403];
                }
                
                $period = $request->getParam('period');
                if (!$period) {
                    return ["status" => "error", "message" => "La période doit être spécifiée", "code" => 400];
                }
                
                try {
                    $date = $this->calculateDateFromPeriod($period);
                    $count = $this->tickets->countTicketsOlderThan($date);
                    
                    return [
                        "status" => "success",
                        "data" => [
                            "count" => $count,
                            "period" => $period,
                            "date" => $date
                        ]
                    ];
                } catch (Exception $e) {
                    error_log("Erreur lors du comptage des tickets anciens: " . $e->getMessage());
                    return [
                        "status" => "error",
                        "message" => $e->getMessage(),
                        "code" => 400
                    ];
                }
            }

             // Vérifier si l'utilisateur peut gérer des tickets
            $userTicketPermissions = $this->permissions->getUserTicketPermissions($user->getId());
            $hasTicketManagementRights = count($userTicketPermissions) > 0;
            
            // Récupérer les filtres disponibles pour l'interface
                if ($request->getId() === "filters") {
                    if (!$hasTicketManagementRights) {
                        return ["status" => "error", "message" => "Accès refusé", "code" => 403];
                    }                      $statuses = $this->tickets->getDistinctStatuses();
                    $services = $this->services->findAll();
                    $intervenants = $this->tickets->getDistinctIntervenants();
                    // Récupérer uniquement les catégories des services que l'utilisateur peut gérer
                    $categories = $this->tickets->getDistinctCategories($userTicketPermissions);
                    
                    return [
                        "status" => "success", 
                        "data" => [
                            "statuses" => $statuses,
                            "services" => $services,
                            "intervenants" => $intervenants,
                            "categories" => $categories
                        ]
                    ];
                }

            // Endpoint pour le tableau de bord
            if ($request->getId() === 'dashboard') {
                $dashboardData = $this->getDashboardData($user);
                return ["status" => "success", "data" => $dashboardData];
            }

           // Point d'API pour obtenir les options de filtre
            if ($request->getId() === 'filter-options') {
                $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
                $ticketPermissions = $this->permissions->getUserTicketPermissions($user->getId());
                
                if (empty($ticketPermissions) && !$hasAdminAccess) {
                    return ["status" => "error", "message" => "Vous n'avez pas les permissions nécessaires", "code" => 403];
                }
                
                // Récupérer tous les statuts disponibles
                $statuses = $this->tickets->getDistinctStatuses();
                $statusOptions = array_map(function($status) {
                    return ["value" => $status, "label" => $status];
                }, $statuses);
                
                // Récupérer les services intervenants selon les permissions
                $serviceIntervenantOptions = [];
                
                if ($hasAdminAccess) {
                    // L'admin voit tous les services
                    $allServices = $this->services->findAll();
                    $serviceIntervenantOptions = array_map(function($service) {
                        return ["value" => $service->getId(), "label" => $service->getName()];
                    }, $allServices);
                } else {
                    // Filtrer les services selon les permissions
                    $allServices = $this->services->findAll();
                    $filteredServices = [];
                    
                    foreach ($allServices as $service) {
                        $serviceName = $service->getName();
                        if (
                            (stripos($serviceName, 'Informatique') !== false && in_array('InformatiqueTicket', $ticketPermissions)) ||
                            (stripos($serviceName, 'Technique') !== false && in_array('TechniqueTicket', $ticketPermissions)) ||
                            ((stripos($serviceName, 'Économat') !== false || stripos($serviceName, 'Economat') !== false) && in_array('EconomatTicket', $ticketPermissions))
                        ) {
                            $filteredServices[] = $service;
                        }
                    }
                    
                    $serviceIntervenantOptions = array_map(function($service) {
                        return ["value" => $service->getId(), "label" => $service->getName()];
                    }, $filteredServices);
                }
                
                return [
                    "status" => "success",
                    "data" => [
                        "statusOptions" => $statusOptions,
                        "serviceIntervenantOptions" => $serviceIntervenantOptions
                    ]
                ];
            }

                // Gestion des tickets
                if ($request->getId() === "manage") {
                    if (!$hasTicketManagementRights) {
                        return ["status" => "error", "message" => "Accès refusé", "code" => 403];
                    }
                    
                    $page = $request->getParam('page') ? (int)$request->getParam('page') : 1;
                    $perPage = $request->getParam('perPage') ? (int)$request->getParam('perPage') : 10;
                    $search = $request->getParam('search') ? $request->getParam('search') : '';
                    $statusFilters = [];
                    
                    // Accepter à la fois 'statusFilters' et 'status' comme paramètres
                    if ($request->getParam('statusFilters')) {
                        $rawStatuses = explode(',', $request->getParam('statusFilters'));
                        // Trim et urldecode pour chaque valeur
                        $statusFilters = array_map(function($status) {
                            return urldecode(trim($status));
                        }, $rawStatuses);
                    } else if ($request->getParam('status')) {
                        $rawStatuses = explode(',', $request->getParam('status'));
                        // Trim et urldecode pour chaque valeur
                        $statusFilters = array_map(function($status) {
                            return urldecode(trim($status));
                        }, $rawStatuses);
                    }
                    
                    $serviceId = $request->getParam('serviceId') ? $request->getParam('serviceId') : '';
                    
                    // Filtre pour les intervenants
                    $intervenantIds = [];
                    if ($request->getParam('intervenantIds')) {
                        $intervenantIds = array_map('trim', explode(',', $request->getParam('intervenantIds')));
                    }
                      // Filtre pour les catégories
                    $categoryFilters = [];
                    if ($request->getParam('categoryFilters')) {
                        $categoryFilters = array_map('trim', explode(',', $request->getParam('categoryFilters')));
                    }
                    
                    // Log pour aider au débogage
                    error_log("TicketController::manage - statusFilters après traitement: " . json_encode($statusFilters));
                    error_log("TicketController::manage - intervenantIds après traitement: " . json_encode($intervenantIds));
                    error_log("TicketController::manage - categoryFilters après traitement: " . json_encode($categoryFilters));
                    
                    $tickets = $this->tickets->findManageablePaginated(
                        $user->getId(),
                        $userTicketPermissions,
                        $page,
                        $perPage,
                        $search,
                        $statusFilters,
                        $serviceId,
                        $intervenantIds,
                        $categoryFilters
                    );
                    
                    $totalItems = $this->tickets->countManageableTickets(
                        $user->getId(),
                        $userTicketPermissions,
                        $search,
                        $statusFilters,
                        $serviceId,
                        $intervenantIds,
                        $categoryFilters
                    );
                    
                    $totalPages = ceil($totalItems / $perPage);
                    
                    return [
                        "status" => "success", 
                        "data" => [
                            "tickets" => $tickets,
                            "pagination" => [
                                "currentPage" => $page,
                                "perPage" => $perPage,
                                "totalItems" => $totalItems,
                                "totalPages" => $totalPages
                            ]
                        ]
                    ];
                }
                

            if (is_numeric($request->getId()) && $request->getParam('action') === 'transferTicket') {
                $ticketId = $request->getId();
                $ticket = $this->tickets->find($ticketId);
                
                if (!$ticket) {
                    return ["status" => "error", "message" => "Ticket non trouvé", "code" => 404];
                }
                
                // Vérifier si l'utilisateur peut modifier ce ticket (membre du service intervenant actuel)
                $serviceIntervenantId = $ticket->getServiceIntervenantId();
                $canUpdate = false;
                
                // Vérifier si l'utilisateur a la permission requise pour ce service
                $serviceCode = $this->getServiceCodeById($serviceIntervenantId);
                if ($serviceCode && $this->permissions->hasPermission($user->getId(), $serviceCode.'Ticket')) {
                    $canUpdate = true;
                }
                
                if (!$canUpdate) {
                    return ["status" => "error", "message" => "Vous n'êtes pas autorisé à transférer ce ticket", "code" => 403];
                }
                
                $jsonData = $request->getJson();
                $data = json_decode($jsonData, true);
                
                if (!isset($data['targetServiceId']) || !isset($data['transferType'])) {
                    return ["status" => "error", "message" => "Données manquantes pour le transfert", "code" => 400];
                }
                
                $targetServiceId = $data['targetServiceId'];
                $transferType = $data['transferType']; // 'transfer_only' ou 'transfer_and_keep'
                
                // Vérifier que le service cible existe
                $targetService = $this->services->find($targetServiceId);
                if (!$targetService) {
                    return ["status" => "error", "message" => "Service intervenant cible non trouvé", "code" => 404];
                }
                
                // Exécuter le transfert selon le type choisi
                if ($transferType === 'transfer_only') {
                    // Mettre à jour le service intervenant du ticket actuel
                    if ($this->tickets->updateServiceIntervenant($ticketId, $targetServiceId)) {
                        // Enregistrer l'action dans l'historique
                        $history = new TicketStatusHistory(null);
                        $history->setTicketId($ticketId);
                        $history->setUserId($user->getId());
                        $history->setOldStatus($ticket->getStatut());
                        $history->setNewStatus($ticket->getStatut()); // Le statut ne change pas
                        $history->setTransferredToServiceId($targetServiceId);
                        $history->setTransferType('transfer_only');
                        $this->history->save($history);
                        
                        // Retourner le ticket mis à jour
                        $updatedTicket = $this->tickets->find($ticketId);
                        return ["status" => "success", "message" => "Ticket transféré avec succès", "data" => $updatedTicket];
                    }
                } else if ($transferType === 'transfer_and_keep') {
                        // Créer une copie du ticket avec le nouveau service intervenant
                        $newTicket = new Ticket(null);
                        $newTicket->setUserId($ticket->getUserId());
                        $newTicket->setUsername($ticket->getUsername());
                        $newTicket->setSite($ticket->getSite());
                        $newTicket->setLieuIntervention($ticket->getLieuIntervention());
                        $newTicket->setServiceId($ticket->getServiceId());
                        $newTicket->setServiceIntervenantId($targetServiceId);
                        
                        // Récupérer le nom du service initiateur du transfert
                        $sourceService = $this->services->find($serviceIntervenantId);
                        $sourceServiceName = $sourceService ? $sourceService->getName() : "Inconnu";
                        
                        // Modifier le message pour afficher le service source au lieu du numéro de ticket
                        $newTicket->setDetails($ticket->getDetails() . "\n\n[Ticket transféré depuis le service " . $sourceServiceName . "]");
                        $newTicket->setVoirAvantIntervention($ticket->getVoirAvantIntervention());
                        $newTicket->setStatut('Ouvert'); // Le nouveau ticket est toujours ouvert
                        
                        // Sauvegarder le nouveau ticket
                        $createdTicket = $this->tickets->saveTransferredTicket($newTicket);
                        
                        if ($createdTicket) {
                            // Enregistrer l'action dans l'historique
                            $history = new TicketStatusHistory(null);
                            $history->setTicketId($ticketId);
                            $history->setUserId($user->getId());
                            $history->setOldStatus($ticket->getStatut());
                            $history->setNewStatus($ticket->getStatut()); // Le statut ne change pas
                            $history->setTransferredToServiceId($targetServiceId);
                            $history->setTransferType('transfer_and_keep');
                            $this->history->save($history);
                            
                            // Mettre à jour le ticket original pour indiquer qu'il a été dupliqué
                            $ticket->setDetails($ticket->getDetails() . "\n\n[Ce ticket a été également transféré au service " . $targetService->getName() . " - Ticket #" . $createdTicket->getId() . "]");
                            $this->tickets->update($ticket);
                            
                            return [
                                "status" => "success", 
                                "message" => "Ticket dupliqué et transféré avec succès", 
                                "data" => [
                                    "originalTicket" => $this->tickets->find($ticketId),
                                    "newTicket" => $createdTicket
                                ]
                            ];
                        }
                    } else {
                    return ["status" => "error", "message" => "Type de transfert non valide", "code" => 400];
                }
                
                return ["status" => "error", "message" => "Erreur lors du transfert du ticket", "code" => 500];
            }

            // Si l'utilisateur demande un ticket spécifique par ID
            if (is_numeric($request->getId())) {
                $ticketId = $request->getId();
                $ticket = $this->tickets->find($ticketId);
                
            if (!$ticket) {
                return ["status" => "error", "message" => "Ticket non trouvé", "code" => 404];
            }
            
            // Vérifier si l'utilisateur a le droit de voir ce ticket
            $canAccess = false;
            
            // Si l'utilisateur est l'auteur du ticket
            if ($ticket->getUserId() == $user->getId()) {
                $canAccess = true;
            }
            
            // Si l'utilisateur est admin
            if ($this->permissions->hasPermission($user->getId(), 'AdminAccess')) {
                $canAccess = true;
            }
            
            // Si l'utilisateur appartient au service intervenant du ticket
            $serviceIntervenant = $this->services->find($ticket->getServiceIntervenantId());
            if ($serviceIntervenant) {
                $serviceName = str_replace(' ', '', $serviceIntervenant->getName()) . 'Ticket';
                if ($this->permissions->hasPermission($user->getId(), $serviceName)) {
                    $canAccess = true;
                }
            }
            
            if (!$canAccess) {
                return ["status" => "error", "message" => "Accès refusé à ce ticket", "code" => 403];
            }
            
            // Récupérer l'historique des statuts
            $statusHistory = $this->history->findByTicketId($ticketId);
            
            return [
                "status" => "success", 
                "data" => [
                    "ticket" => $ticket,
                    "history" => $statusHistory
                ]
            ];
            }
            
                // Si l'utilisateur demande ses propres tickets
            if ($request->getId() === 'my') {
                    // Pagination
                    $page = $request->getParam('page') ? (int)$request->getParam('page') : 1;
                    $perPage = $request->getParam('perPage') ? (int)$request->getParam('perPage') : 10;
                    
                    // Filtres
                    $search = $request->getParam('search') ?? '';
                    $serviceIntervenantId = $request->getParam('serviceIntervenantId') ?? '';
                    
                    // Statuts - peut être multiple via status[]
                    $statusFilters = [];
                    if ($request->getParam('status')) {
                        if (is_array($request->getParam('status'))) {
                            $statusFilters = $request->getParam('status');
                        } else {
                            $statusFilters = [$request->getParam('status')];
                        }
                    }
                    
                    // Récupérer les tickets avec filtres
                    $tickets = $this->tickets->findByUserIdPaginated(
                        $user->getId(), 
                        $page, 
                        $perPage, 
                        $search, 
                        $statusFilters,
                        $serviceIntervenantId
                    );
                    
                    // Compter le nombre total
                    $totalCount = $this->tickets->countUserTickets(
                        $user->getId(),
                        $search,
                        $statusFilters,
                        $serviceIntervenantId
                    );
                    
                    // Calculer le nombre total de pages
                    $totalPages = ceil($totalCount / $perPage);
                    
                    return [
                        "status" => "success",
                        "data" => [
                            "tickets" => $tickets,
                            "totalItems" => $totalCount,
                            "totalPages" => $totalPages,
                            "currentPage" => $page,
                            "perPage" => $perPage
                        ]
                    ];
                }
                

        // Si l'utilisateur demande un ticket spécifique par ID
        if ($request->getId()) {
            $ticket = $this->tickets->find($request->getId());
            if (!$ticket) {
                return ["status" => "error", "message" => "Ticket non trouvé"];
            }
            
            // Vérifier si l'utilisateur a le droit d'accéder à ce ticket
            if ($user->getId() == $ticket->getUserId()) {
                return ["status" => "success", "data" => $ticket];
            }
            
            // Vérifier si l'utilisateur a la permission pour ce service intervenant
            $serviceIntervenantId = $ticket->getServiceIntervenantId();
            $serviceCode = $this->getServiceCodeById($serviceIntervenantId);
            
            if ($serviceCode && $this->permissions->hasPermission($user->getId(), $serviceCode . 'Ticket')) {
                return ["status" => "success", "data" => $ticket];
            }
            
            return ["status" => "error", "message" => "Accès refusé", "code" => 403];
        }
        
        // Si l'utilisateur a la permission AdminAccess, retourner tous les tickets
        if ($this->permissions->hasPermission($user->getId(), 'AdminAccess')) {
            $tickets = $this->tickets->findAll();
            return ["status" => "success", "data" => $tickets];
        }
        
        return ["status" => "error", "message" => "Accès refusé", "code" => 403];
    }

        private function getServiceIntervenantIdByCode($code) {
            // Rechercher l'ID du service intervenant par son nom
            $services = $this->services->findAll();
            foreach ($services as $service) {
                // Comparer en ignorant la casse
                if (strtolower($service->getName()) === strtolower($code)) {
                    return $service->getId();
                }
            }
            return false;
        }
    
    private function getServiceCodeById($id) {
        // Récupérer le service par son ID
        $service = $this->services->find($id);
        if ($service) {
            return $service->getName();
        }
        return false;
    }
    
  protected function processPostRequest(HttpRequest $request) {
    $user = $this->getUserFromToken($request);
    if (!$user) {
        return ["status" => "error", "message" => "Non autorisé", "code" => 401];
    }
    
    $jsonData = $request->getJson();
    $data = json_decode($jsonData, true);
    
    if (!$data) {
        return ["status" => "error", "message" => "Données JSON invalides"];
    }    // Action pour mettre à jour la catégorie d'un ticket
    if ($request->getParam('action') === 'update-category') {
        if ($request->getId()) {
            return $this->updateTicketCategory($request);
        } else {
            return ["status" => "error", "message" => "ID de ticket manquant", "code" => 400];
        }
    }
    
    // Action pour supprimer les tickets anciens
    if ($request->getParam('action') === 'cleanup') {
        // Vérifier que l'utilisateur est admin
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        if (!$hasAdminAccess) {
            return ["status" => "error", "message" => "Accès refusé", "code" => 403];
        }
        
        $jsonData = $request->getJson();
        $data = json_decode($jsonData, true);
        
        if (!$data || !isset($data['period'])) {
            return ["status" => "error", "message" => "La période doit être spécifiée", "code" => 400];
        }
        
        if (!isset($data['confirmation']) || $data['confirmation'] !== true) {
            return ["status" => "error", "message" => "La confirmation est requise pour cette action", "code" => 400];
        }
        
        try {
            $date = $this->calculateDateFromPeriod($data['period']);
            $deletedCount = $this->tickets->deleteTicketsOlderThan($date);
            
            // Enregistrer une trace de suppression dans les logs du système
            error_log(sprintf(
                "SUPPRESSION DE TICKETS: %s tickets datant d'avant %s ont été supprimés par l'utilisateur %s (ID: %s)",
                $deletedCount,
                $date,
                $user->getUsername(),
                $user->getId()
            ));
            
            return [
                "status" => "success",
                "message" => "Les bons antérieurs à " . $date . " ont été supprimés avec succès",
                "data" => [
                    "deletedCount" => $deletedCount,
                    "date" => $date
                ]
            ];
        } catch (Exception $e) {
            error_log("Erreur lors de la suppression des tickets anciens: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Une erreur est survenue lors de la suppression des tickets: " . $e->getMessage(),
                "code" => 500
            ];
        }
    }
    
    // Créer un nouveau ticket
    $ticket = new Ticket(null);
    $ticket->setUserId($user->getId());
    $ticket->setUsername($user->getUsername());
    $ticket->setSite($data['site'] ?? $user->getSite());
    
    // Vérifier que les champs obligatoires sont présents
    if (!isset($data['service_id']) || !isset($data['service_intervenant_id']) || !isset($data['details']) || !isset($data['lieu_intervention'])) {
        return [
            "status" => "error", 
            "message" => "Données incomplètes"
        ];
    }
    
    try {
        // Convertir les chaînes en entiers
        $ticket->setServiceId((int)$data['service_id']);
        $ticket->setServiceIntervenantId((int)$data['service_intervenant_id']); // Remplacer nature_id
        $ticket->setDetails($data['details']);
        $ticket->setLieuIntervention($data['lieu_intervention']);
        $ticket->setVoirAvantIntervention(isset($data['voir_avant_intervention']) ? (bool)$data['voir_avant_intervention'] : false);
        $ticket->setStatut('Ouvert');
          $savedTicket = $this->tickets->save($ticket);
        
        if ($savedTicket) {
            // Envoi d'email de notification si le ticket est créé avec succès
            $this->sendTicketNotificationEmails($savedTicket);
            
            return ["status" => "success", "message" => "Bon créé avec succès", "data" => $savedTicket];
        }
        
        error_log("Échec de la création du ticket: " . json_encode($data));
        return ["status" => "error", "message" => "Erreur lors de la création du ticket"];
    } catch (Exception $e) {
        error_log("Exception lors de la création du ticket: " . $e->getMessage());
        return ["status" => "error", "message" => "Erreur lors de la création du ticket: " . $e->getMessage()];
    }
}

        
        protected function processPutRequest(HttpRequest $request) {
            $user = $this->getUserFromToken($request);
            if (!$user) {
                return ["status" => "error", "message" => "Non autorisé", "code" => 401];
            }
              // Mise à jour du statut d'un ticket
            if ($request->getParam('action') === 'updateStatus') {
                $ticket = $this->tickets->find($request->getId());
                if (!$ticket) {
                    return ["status" => "error", "message" => "Ticket non trouvé"];
                }
                
                $jsonData = $request->getJson();
                $data = json_decode($jsonData, true);
                
                if (!$data || !isset($data['newStatus'])) {
                    return ["status" => "error", "message" => "Données invalides"];
                }
                
                $newStatus = $data['newStatus'];
                $oldStatus = $ticket->getStatut();
                
                // Récupérer la date fournie par l'utilisateur ou utiliser la date actuelle
                $statusDate = null;
                if (isset($data['statusDate']) && !empty($data['statusDate'])) {
                    // Valider le format de date (YYYY-MM-DD)
                    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['statusDate'])) {
                        $userDate = $data['statusDate'];
                        $today = date('Y-m-d');
                        
                        // Vérifier que la date n'est pas dans le futur
                        if ($userDate <= $today) {
                            $statusDate = $userDate;
                        }
                    }
                }
                
                // Si aucune date valide n'a été fournie, utiliser la date actuelle
                if (!$statusDate) {
                    $statusDate = date('Y-m-d');
                }
                
                // Vérifier si l'utilisateur est bloqué
                $isUserLocked = $user->getIsLock();
                
                // Si technicien est bloqué et que le ticket est en cours avec un autre intervenant
                if ($isUserLocked && $oldStatus === 'En cours' && $newStatus === 'Ouvert') {
                    // Vérifier que c'est bien cet utilisateur qui est intervenant
                    if ($ticket->getIntervenantId() != $user->getId()) {
                        return [
                            "status" => "error", 
                            "message" => "Vous ne pouvez pas retirer un autre technicien de ce bon"
                        ];
                    }
                }
                
                // Vérifier si un intervenant personnalisé est spécifié
                $customIntervenantId = null;
                if (isset($data['customIntervenantId']) && !$isUserLocked) {
                    // Les techniciens non bloqués peuvent changer manuellement l'intervenant
                    $customIntervenantId = $data['customIntervenantId'];
                }
                
                // Mise à jour du statut du ticket
                if ($this->tickets->updateStatus($ticket->getId(), $newStatus, $user->getId(), $customIntervenantId)) {                // Créer l'entrée d'historique avec la date spécifiée
                    $historyEntry = new TicketStatusHistory(null);
                    $historyEntry->setTicketId($ticket->getId());
                    
                    // Utiliser l'intervenant personnalisé s'il est spécifié, sinon utiliser l'utilisateur connecté
                    if (isset($data['customIntervenantId']) && $data['customIntervenantId']) {
                        $intervenant = $this->users->find($data['customIntervenantId']);
                        if ($intervenant) {
                            $historyEntry->setUserId($intervenant->getId());
                            $historyEntry->setUsername($intervenant->getUsername());
                        } else {
                            $historyEntry->setUserId($user->getId());
                            $historyEntry->setUsername($user->getUsername());
                        }
                    } else {
                        $historyEntry->setUserId($user->getId());
                        $historyEntry->setUsername($user->getUsername());
                    }
                    
                    $historyEntry->setOldStatus($oldStatus);
                    $historyEntry->setNewStatus($newStatus);
                    
                    // Ici, nous utilisons la date sélectionnée par l'utilisateur
                    // mais nous laissons MySQL gérer l'heure via NOW() dans la requête SQL
                      $savedHistory = $this->history->saveWithCustomDate($historyEntry, $statusDate);
                    
                    // Si c'est une résolution, enregistrer le message de résolution
                    if ($newStatus === 'Résolu' && isset($data['resolutionMessage']) && !empty($data['resolutionMessage'])) {
                        require_once "Repository/TicketMessageRepository.php";
                        require_once "Class/TicketMessage.php";
                        
                        $messageRepo = new TicketMessageRepository();
                        
                        // Créer le message de résolution
                        $resolutionMessage = new TicketMessage(null);
                        $resolutionMessage->setTicketId($ticket->getId());
                        $resolutionMessage->setUserId($user->getId());
                        $resolutionMessage->setUsername($user->getUsername());
                        $resolutionMessage->setMessage($data['resolutionMessage']);
                        $resolutionMessage->setIsStatusChange(true);
                        $resolutionMessage->setStatusType('resolution');
                        
                        // Sauvegarder le message
                        $messageRepo->save($resolutionMessage);
                    }
                    
                    if ($savedHistory) {
                        // Récupérer l'historique complet du ticket
                        $ticketHistory = $this->history->findByTicketId($ticket->getId());
                        
                        // Retourner le ticket mis à jour et son historique
                        return [
                            "status" => "success", 
                            "message" => "Statut mis à jour", 
                            "data" => [
                                "ticket" => $ticket,
                                "history" => $ticketHistory
                            ]
                        ];
                    }
                }
                
                return ["status" => "error", "message" => "Erreur lors de la mise à jour du statut"];
            }
            
            // Transfert d'un ticket vers un autre service
            if (is_numeric($request->getId()) && $request->getParam('action') === 'transferTicket') {
                $ticketId = $request->getId();
                $ticket = $this->tickets->find($ticketId);
                
                if (!$ticket) {
                    return ["status" => "error", "message" => "Ticket non trouvé", "code" => 404];
                }
                
                // Vérifier si l'utilisateur peut modifier ce ticket (membre du service intervenant actuel)
                $serviceIntervenantId = $ticket->getServiceIntervenantId();
                $canUpdate = false;
                
                // Vérifier si l'utilisateur a la permission requise pour ce service
                $serviceCode = $this->getServiceCodeById($serviceIntervenantId);
                if ($serviceCode && $this->permissions->hasPermission($user->getId(), $serviceCode.'Ticket')) {
                    $canUpdate = true;
                }
                
                if (!$canUpdate) {
                    return ["status" => "error", "message" => "Vous n'êtes pas autorisé à transférer ce ticket", "code" => 403];
                }
                
                $jsonData = $request->getJson();
                $data = json_decode($jsonData, true);
                
                if (!isset($data['targetServiceId']) || !isset($data['transferType'])) {
                    return ["status" => "error", "message" => "Données manquantes pour le transfert", "code" => 400];
                }
                
                $targetServiceId = $data['targetServiceId'];
                $transferType = $data['transferType']; // 'transfer_only' ou 'transfer_and_keep'
                
                // Vérifier que le service cible existe
                $targetService = $this->services->find($targetServiceId);
                if (!$targetService) {
                    return ["status" => "error", "message" => "Service intervenant cible non trouvé", "code" => 404];
                }
                
                // Exécuter le transfert selon le type choisi
                if ($transferType === 'transfer_only') {
                    // Mettre à jour le service intervenant du ticket actuel
                    if ($this->tickets->updateServiceIntervenant($ticketId, $targetServiceId)) {
                        // Enregistrer l'action dans l'historique
                        $history = new TicketStatusHistory(null);
                        $history->setTicketId($ticketId);
                        $history->setUserId($user->getId());
                        $history->setOldStatus($ticket->getStatut());
                        $history->setNewStatus($ticket->getStatut()); // Le statut ne change pas
                        $history->setTransferredToServiceId($targetServiceId);
                        $history->setTransferType('transfer_only');
                        $this->history->save($history);
                        
                        // Retourner le ticket mis à jour
                        $updatedTicket = $this->tickets->find($ticketId);
                        return ["status" => "success", "message" => "Ticket transféré avec succès", "data" => $updatedTicket];
                    }
                } else if ($transferType === 'transfer_and_keep') {
                    // Créer une copie du ticket avec le nouveau service intervenant
                    $newTicket = new Ticket(null);
                    $newTicket->setUserId($ticket->getUserId());
                    $newTicket->setUsername($ticket->getUsername());
                    $newTicket->setSite($ticket->getSite());
                    $newTicket->setLieuIntervention($ticket->getLieuIntervention());
                    $newTicket->setServiceId($ticket->getServiceId());
                    $newTicket->setServiceIntervenantId($targetServiceId);

                    // Récupérer le nom du service initiateur du transfert
                        $sourceService = $this->services->find($serviceIntervenantId);
                        $sourceServiceName = $sourceService ? $sourceService->getName() : "Inconnu";
                    $newTicket->setDetails($ticket->getDetails() . "\n\n[Ticket transféré depuis le service " . $sourceServiceName . "]");
                    $newTicket->setVoirAvantIntervention($ticket->getVoirAvantIntervention());
                    $newTicket->setStatut('Ouvert'); // Le nouveau ticket est toujours ouvert
                    
                    // Sauvegarder le nouveau ticket
                    $createdTicket = $this->tickets->saveTransferredTicket($newTicket);
                    
                    if ($createdTicket) {
                        // Enregistrer l'action dans l'historique
                        $history = new TicketStatusHistory(null);
                        $history->setTicketId($ticketId);
                        $history->setUserId($user->getId());
                        $history->setOldStatus($ticket->getStatut());
                        $history->setNewStatus($ticket->getStatut()); // Le statut ne change pas
                        $history->setTransferredToServiceId($targetServiceId);
                        $history->setTransferType('transfer_and_keep');
                        $this->history->save($history);
                        
                        // Mettre à jour le ticket original pour indiquer qu'il a été dupliqué
                        $ticket->setDetails($ticket->getDetails() . "\n\n[Ce ticket a été également transféré au service " . $targetService->getName() . " - Ticket #" . $createdTicket->getId() . "]");
                        $this->tickets->update($ticket);
                        
                        return [
                            "status" => "success", 
                            "message" => "Ticket dupliqué et transféré avec succès", 
                            "data" => [
                                "originalTicket" => $this->tickets->find($ticketId),
                                "newTicket" => $createdTicket
                            ]
                        ];
                    }
                } else {
                    return ["status" => "error", "message" => "Type de transfert non valide", "code" => 400];
                }
                
                return ["status" => "error", "message" => "Erreur lors du transfert du ticket", "code" => 500];
            }
            
            return ["status" => "error", "message" => "Action non reconnue", "code" => 400];
        }

/**
 * Récupère les données pour le tableau de bord
 */
protected function getDashboardData(User $user) {
    // Vérifier si l'utilisateur a des permissions de gestion de tickets
    $userTicketPermissions = $this->permissions->getUserTicketPermissions($user->getId());
    $hasTicketManagementRights = count($userTicketPermissions) > 0;
    
    if ($hasTicketManagementRights) {
        // Données pour techniciens/gestionnaires
        return $this->getTechnicianDashboardData($user, $userTicketPermissions);
    } else {
        // Données pour utilisateurs standards
        return $this->getUserDashboardData($user);
    }
}

/**
 * Récupère les données du tableau de bord pour les techniciens
 */
private function getTechnicianDashboardData(User $user, array $ticketPermissions) {
    // 1. Nombre de bons ouverts
    $openTickets = $this->tickets->countManageableTickets(
        $user->getId(),
        $ticketPermissions,
        '',
        ['Ouvert']
    );
    
    // 2. Nombre de bons en cours
    $inProgressTickets = $this->tickets->countManageableTickets(
        $user->getId(),
        $ticketPermissions,
        '',
        ['En cours']
    );
    
    // 3. Nombre de bons résolus
    $resolvedTickets = $this->tickets->countManageableTickets(
        $user->getId(),
        $ticketPermissions,
        '',
        ['Résolu']
    );
    
    // 4. Tickets créés dans les dernières 24h
    $recentTickets = $this->tickets->getRecentTickets(
        $user->getId(),
        $ticketPermissions,
        24
    );
    
    // 5. Tickets en cours où l'utilisateur intervient
    $assignedTickets = $this->tickets->getTicketsAssignedToUser($user->getId());
    
    return [
        "openTicketsCount" => $openTickets,
        "inProgressTicketsCount" => $inProgressTickets,
        "resolvedTicketsCount" => $resolvedTickets,
        "recentTickets" => $recentTickets,
        "assignedTickets" => $assignedTickets
    ];
}

/**
 * Récupère les données du tableau de bord pour les utilisateurs standards
 */
private function getUserDashboardData(User $user) {
    // 1. Tickets récents de l'utilisateur (les 5 derniers)
    $userRecentTickets = $this->tickets->getUserRecentTickets($user->getId());
    
    // 2. Tous les tickets de l'utilisateur (du plus récent au plus ancien)
    $userTickets = $this->tickets->getUserTickets($user->getId(), 10);
    
    // 3. Tickets filtrés par service par défaut
    $defaultServiceId = $user->getDefaultServiceId();
    $serviceTickets = [];
    
    if ($defaultServiceId) {
        $serviceTickets = $this->tickets->getTicketsByServiceForUser($defaultServiceId);
    }
      return [
        "userRecentTickets" => $userRecentTickets,
        "userTickets" => $userTickets,
        "defaultServiceId" => $defaultServiceId,
        "serviceTickets" => $serviceTickets
    ];
}

/**
 * Envoie des emails de notification pour un nouveau ticket
 * 
 * @param Ticket $ticket Le ticket nouvellement créé
 * @return void
 */
private function sendTicketNotificationEmails($ticket) {
    // Déterminer quel service intervenant a été sélectionné
    $serviceIntervenantId = $ticket->getServiceIntervenantId();
    $serviceIntervenant = $this->services->find($serviceIntervenantId);
    
    if (!$serviceIntervenant) {
        error_log("Service intervenant non trouvé pour l'ID: " . $serviceIntervenantId);
        return;
    }
    
    // Déterminer quelle permission correspond à ce service
    $serviceName = $serviceIntervenant->getName();
    $permissionType = '';
    
    if (stripos($serviceName, 'Informatique') !== false) {
        $permissionType = 'InformatiqueTicket';
    } elseif (stripos($serviceName, 'Technique') !== false) {
        $permissionType = 'TechniqueTicket';
    } elseif (stripos($serviceName, 'Économat') !== false || stripos($serviceName, 'Economat') !== false) {
        $permissionType = 'EconomatTicket';
    } else {
        error_log("Type de service non reconnu pour: " . $serviceName);
        return;
    }
    
    // Rechercher les notifications configurées pour ce service et cette permission
    $notifications = $this->notificationEmails->findByPermissionType($permissionType);
    
    if (empty($notifications)) {
        error_log("Aucune notification email configurée pour la permission: " . $permissionType);
        return;
    }
    
    // Envoi des emails à toutes les adresses configurées
    foreach ($notifications as $notification) {
        if ($notification->isEnabled()) {
            // Récupérer l'adresse email et envoyer la notification
            $email = $notification->getEmail();
            
            // Préparer les données du ticket pour l'email
            $ticketData = [
                'id' => $ticket->getId(),
                'username' => $ticket->getUsername(),
                'site' => $ticket->getSite(),
                'service_nom' => $ticket->getServiceNom(),
                'details' => $ticket->getDetails(),
                'date_creation' => $ticket->getDateCreation(),
                'service_intervenant_name' => $serviceIntervenant->getName()
            ];
            
            // Envoyer l'email
            $sent = EmailSender::sendNewTicketNotification($email, $ticketData);
            
            if ($sent) {
                error_log("Email de notification envoyé avec succès à: " . $email . " pour le ticket #" . $ticket->getId());
            } else {
                error_log("Échec de l'envoi de l'email de notification à: " . $email . " pour le ticket #" . $ticket->getId());
            }
        }
    }
}

/**
 * Calcule la date d'ancienneté en fonction de la période spécifiée
 */
private function calculateDateFromPeriod($period) {
    $now = new DateTime();
    
    switch ($period) {
        case '1y':
            $interval = 'P1Y'; // 1 an
            break;
        case '2y':
            $interval = 'P2Y'; // 2 ans
            break;
        case '3y':
            $interval = 'P3Y'; // 3 ans
            break;
        case '5y':
            $interval = 'P5Y'; // 5 ans
            break;
        default:
            throw new InvalidArgumentException("Période non valide: $period");
    }
    
    $now->sub(new DateInterval($interval));
    return $now->format('Y-m-d');
}

/**
     * Récupère la liste des intervenants potentiels pour un ticket
     */
    private function getPotentialIntervenants($ticketId) {
        try {
            // Récupérer le ticket
            $ticket = $this->tickets->find($ticketId);
            if (!$ticket) {
                return [];
            }
            
            // Récupérer le service intervenant
            $serviceIntervenantId = $ticket->getServiceIntervenantId();
            if (!$serviceIntervenantId) {
                return [];
            }
            
            // Récupérer le code du service
            $serviceCode = $this->getServiceCodeById($serviceIntervenantId);
            if (!$serviceCode) {
                return [];
            }
            
            // Permission requise pour ce service
            $requiredPermission = str_replace(' ', '', $serviceCode) . 'Ticket';
            
            // Récupérer tous les utilisateurs ayant cette permission
            $intervenants = [];
            $users = $this->users->findAll();
            
            foreach ($users as $user) {
                if ($this->permissions->hasPermission($user->getId(), $requiredPermission)) {
                    $intervenants[] = [
                        'id' => $user->getId(),
                        'username' => $user->getUsername()
                    ];
                }
            }
            
            // Récupérer également les intervenants uniques qui sont déjà intervenus sur des tickets de ce service
            $pastIntervenants = $this->tickets->getPastIntervenants($serviceIntervenantId);
            
            // Fusionner les deux listes sans doublons
            $allIntervenants = array_merge($intervenants, $pastIntervenants);
            $uniqueIntervenants = [];
            $seenIds = [];
            
            foreach ($allIntervenants as $intervenant) {
                if (!isset($seenIds[$intervenant['id']])) {
                    $uniqueIntervenants[] = $intervenant;
                    $seenIds[$intervenant['id']] = true;
                }
            }
              return $uniqueIntervenants;
        } catch (Exception $e) {
            error_log("Erreur lors de la récupération des intervenants potentiels: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Met à jour la catégorie d'un ticket
     */
    public function updateTicketCategory($request) {
        // Vérifier l'authentification
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Authentification requise"];
        }
        
        // Vérifier les droits d'accès
        $ticketId = $request->getId();
        if (!$ticketId) {
            return ["status" => "error", "message" => "ID de ticket manquant"];
        }
        
        // Récupérer le ticket
        $ticket = $this->tickets->find($ticketId);
        if (!$ticket) {
            return ["status" => "error", "message" => "Ticket non trouvé"];
        }
        
        // Vérifier que l'utilisateur est intervenant sur ce ticket ou admin
        $isAdmin = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        $isOwner = $ticket->getUserId() === $user->getId();
        $isTicketManager = $this->permissions->hasTicketPermissionsForService($user->getId(), $ticket->getServiceIntervenantId());
        
        if (!$isAdmin && !$isOwner && !$isTicketManager) {
            return ["status" => "error", "message" => "Accès refusé"];
        }
        
        $jsonData = json_decode($request->getJson(), true);
        if (!isset($jsonData['categoryId'])) {
            return ["status" => "error", "message" => "Catégorie manquante"];
        }
        
        $categoryId = $jsonData['categoryId'];
        
        // Si l'id est 'null', réinitialiser la catégorie
        if ($categoryId === 'null' || $categoryId === null || $categoryId === '') {
            $result = $this->tickets->updateCategory($ticketId, null);
            if ($result) {
                return ["status" => "success", "message" => "Catégorie supprimée"];
            } else {
                return ["status" => "error", "message" => "Erreur lors de la suppression de la catégorie"];
            }
        }
        
        // Vérifier que la catégorie existe
        $category = $this->categories->find($categoryId);
        if (!$category) {
            return ["status" => "error", "message" => "Catégorie non trouvée"];
        }
        
        // Vérifier que la catégorie appartient bien au service du ticket
        if ($category->getServiceId() != $ticket->getServiceIntervenantId()) {
            return ["status" => "error", "message" => "Cette catégorie n'est pas valide pour ce service"];
        }
        
        // Mettre à jour la catégorie
        $result = $this->tickets->updateCategory($ticketId, $categoryId);
        
        if ($result) {
            return [
                "status" => "success", 
                "message" => "Catégorie mise à jour", 
                "data" => [
                    "category_id" => $categoryId,
                    "category_name" => $category->getName()
                ]
            ];
        } else {
            return ["status" => "error", "message" => "Erreur lors de la mise à jour de la catégorie"];
        }
    }
}