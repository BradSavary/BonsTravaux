<?php

require_once "Controller.php";
require_once "Repository/TicketRepository.php";
require_once "Repository/ServiceIntervenantRepository.php";
require_once "Repository/ServiceDemandeurRepository.php";
require_once "Repository/TicketCategoryRepository.php";
require_once "Repository/UserPermissionRepository.php";
require_once "Repository/UserRepository.php";

class StatisticsController extends Controller {
    private TicketRepository $tickets;
    private ServiceIntervenantRepository $servicesIntervenants;
    private ServiceDemandeurRepository $servicesDemandeurs;
    private TicketCategoryRepository $categories;
    private UserPermissionRepository $permissions;
    private UserRepository $users;
    
    public function __construct() {
        $this->tickets = new TicketRepository();
        $this->servicesIntervenants = new ServiceIntervenantRepository();
        $this->servicesDemandeurs = new ServiceDemandeurRepository();
        $this->categories = new TicketCategoryRepository();
        $this->permissions = new UserPermissionRepository();
        $this->users = new UserRepository();
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
        
        require_once "Controller/UserController.php";
        $userCtrl = new UserController();
        $userData = $userCtrl->verifyTokenAndGetUser($token);
        
        if (!$userData || !isset($userData['id'])) {
            return null;
        }
        
        return $userData;
    }
      
    protected function processGetRequest(HttpRequest $request) {
        // Récupérer l'utilisateur à partir du token
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return [
                'status' => 'error',
                'message' => 'Token d\'authentification requis'
            ];
        }
        
        // Récupérer l'ID utilisateur de l'URL ou utiliser celui du token
        $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : $user['id'];
        
        // Vérifier si l'utilisateur a la permission d'accéder aux statistiques
        $userPermissions = $this->permissions->getUserPermissions($userId);
        
        if (!in_array('view_statistics', $userPermissions)) {
            return [
                'status' => 'error',
                'message' => 'Permission refusée'
            ];
        }
          // Récupérer les paramètres de date
        $startDate = isset($_GET['startDate']) ? $_GET['startDate'] : date('Y-m-d', strtotime('-1 year'));
        $endDate = isset($_GET['endDate']) ? $_GET['endDate'] : date('Y-m-d');
        
        // Déterminer quelle statistique récupérer
        $statsType = isset($_GET['statsType']) ? $_GET['statsType'] : 'global';
        $serviceId = isset($_GET['serviceId']) ? intval($_GET['serviceId']) : null;
        
        switch ($statsType) {
            case 'global':
                return $this->getGlobalStatistics($startDate, $endDate);
            case 'service':
                if (!$serviceId) {
                    return [
                        'status' => 'error',
                        'message' => 'ID de service requis'
                    ];
                }
                return $this->getServiceStatistics($serviceId, $startDate, $endDate);
            default:
                return [
                    'status' => 'error',
                    'message' => 'Type de statistiques non reconnu'
                ];
        }
    }
    
    protected function processPostRequest(HttpRequest $request) {
        return [
            'status' => 'error',
            'message' => 'Méthode POST non supportée pour les statistiques'
        ];
    }
    
    protected function processDeleteRequest(HttpRequest $request) {
        return [
            'status' => 'error',
            'message' => 'Méthode DELETE non supportée pour les statistiques'
        ];
    }
    
    /**
     * Récupère les statistiques globales
     */
    private function getGlobalStatistics($startDate, $endDate) {
        try {
            // Statistiques par service demandeur
            $ticketsByRequestingService = $this->tickets->getTicketsCountByRequestingService($startDate, $endDate);
            
            // Statistiques par statut
            $ticketsByStatus = $this->tickets->getTicketsCountByStatus($startDate, $endDate);
            
            // Nombre total de tickets sur la période
            $totalTickets = $this->tickets->countTicketsInPeriod($startDate, $endDate);
            
            return [
                'status' => 'success',
                'data' => [
                    'startDate' => $startDate,
                    'endDate' => $endDate,
                    'totalTickets' => $totalTickets,
                    'ticketsByRequestingService' => $ticketsByRequestingService,
                    'ticketsByStatus' => $ticketsByStatus
                ]
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Erreur lors de la récupération des statistiques : ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Récupère les statistiques pour un service spécifique
     */
    private function getServiceStatistics($serviceId, $startDate, $endDate) {
        try {
            // Récupérer les statistiques par catégorie pour ce service
            $ticketsByCategory = $this->tickets->getTicketsCountByCategory($serviceId, $startDate, $endDate);
            
            // Statistiques par statut pour ce service
            $ticketsByStatus = $this->tickets->getTicketsCountByStatusForService($serviceId, $startDate, $endDate);
            
            // Répartition des tickets entre techniciens
            $ticketsByTechnician = $this->tickets->getTicketsCountByTechnician($serviceId, $startDate, $endDate);
            
            return [
                'status' => 'success',
                'data' => [
                    'serviceId' => $serviceId,
                    'startDate' => $startDate,
                    'endDate' => $endDate,
                    'ticketsByCategory' => $ticketsByCategory,
                    'ticketsByStatus' => $ticketsByStatus,
                    'ticketsByTechnician' => $ticketsByTechnician
                ]
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Erreur lors de la récupération des statistiques : ' . $e->getMessage()
            ];
        }
    }
}
