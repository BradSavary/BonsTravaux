<?php

require_once "Controller.php";
require_once "Repository/ServiceDemandeurRepository.php";
require_once "Repository/UserPermissionRepository.php";
require_once "Repository/UserRepository.php";

class ServiceDemandeurController extends Controller {
    private ServiceDemandeurRepository $services;
    private UserPermissionRepository $permissions;
    private UserRepository $users;
    
    public function __construct() {
        $this->services = new ServiceDemandeurRepository();
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
        
        return $this->users->find($userData['id']);
    }
    
    protected function processGetRequest(HttpRequest $request) {
        // Pour les requêtes dans le formulaire de création de ticket, permettre l'accès sans vérification
        $isTicketCreationRequest = $request->getParam('forTicketCreation') === 'true';
        
        // Ajouter un log ici
        error_log("ServiceDemandeurController::processGetRequest - Début de la fonction, forTicketCreation=" . ($isTicketCreationRequest ? 'true' : 'false'));
        
        $user = $this->getUserFromToken($request);
        if (!$user && !$isTicketCreationRequest) {
            error_log("ServiceDemandeurController::processGetRequest - Utilisateur non autorisé");
            return ["status" => "error", "message" => "Non autorisé", "code" => 401];
        }
        
        // Si ce n'est pas une requête pour la création de ticket, vérifier les permissions
        if (!$isTicketCreationRequest && $user) {
            // Vérifier si l'utilisateur a le droit d'accéder à la gestion des services
            $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
            if (!$hasAdminAccess) {
                error_log("ServiceDemandeurController::processGetRequest - Accès refusé (permission AdminAccess requise)");
                return ["status" => "error", "message" => "Accès refusé", "code" => 403];
            }
        }
        
        // Récupérer un service par son ID
        if ($request->getId()) {
            error_log("ServiceDemandeurController::processGetRequest - Récupération du service avec ID=" . $request->getId());
            $service = $this->services->find($request->getId());
            if ($service) {
                return ["status" => "success", "data" => $service];
            }
            error_log("ServiceDemandeurController::processGetRequest - Service non trouvé");
            return ["status" => "error", "message" => "Service non trouvé"];
        }
        
        // Soit on retourne tous les services pour la création de ticket, soit on utilise la pagination pour l'admin
        if ($isTicketCreationRequest) {
            error_log("ServiceDemandeurController::processGetRequest - Récupération de tous les services pour la création de ticket");
            $allServices = $this->services->findAll();
            error_log("ServiceDemandeurController::processGetRequest - Nombre de services trouvés: " . count($allServices));
            return ["status" => "success", "data" => $allServices];
        } else {
            // Pour l'interface d'administration, utiliser la pagination
            $page = max(1, (int) ($request->getParam('page') ?? 1));
            $perPage = max(1, (int) ($request->getParam('perPage') ?? 10));
            $search = $request->getParam('search') ?? '';
            
            error_log("ServiceDemandeurController::processGetRequest - Pagination services: page=$page, perPage=$perPage, search=$search");
            
            // Récupérer les services avec pagination
            $paginatedServices = $this->services->findPaginated($page, $perPage, $search);
            error_log("ServiceDemandeurController::processGetRequest - Nombre de services paginés trouvés: " . count($paginatedServices));
            
            $total = $this->services->countAll($search);
            error_log("ServiceDemandeurController::processGetRequest - Nombre total de services: $total");
            
            // Retourner le résultat avec les informations de pagination
            return [
                "status" => "success", 
                "data" => $paginatedServices,
                "pagination" => [
                    "total" => $total,
                    "page" => $page,
                    "perPage" => $perPage,
                    "totalPages" => ceil($total / max(1, $perPage))
                ]
            ];
        }
    }
    
    protected function processPostRequest(HttpRequest $request) {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Non autorisé", "code" => 401];
        }
        
        // Vérifier si l'utilisateur a le droit d'accéder à la gestion des services
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        if (!$hasAdminAccess) {
            return ["status" => "error", "message" => "Accès refusé", "code" => 403];
        }
        
        $jsonData = $request->getJson();
        $data = json_decode($jsonData, true);
        
        if (!$data || !isset($data['nom']) || trim($data['nom']) === '') {
            return ["status" => "error", "message" => "Nom du service requis"];
        }
        
        $service = new ServiceDemandeur(null);
        $service->setNom($data['nom']);
        
        $savedService = $this->services->save($service);
        if ($savedService) {
            return ["status" => "success", "message" => "Service demandeur créé", "data" => $savedService];
        }
        
        return ["status" => "error", "message" => "Erreur lors de la création du service demandeur"];
    }
    
    protected function processPutRequest(HttpRequest $request) {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Non autorisé", "code" => 401];
        }
        
        // Vérifier si l'utilisateur a le droit d'accéder à la gestion des services
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        if (!$hasAdminAccess) {
            return ["status" => "error", "message" => "Accès refusé", "code" => 403];
        }
        
        if (!$request->getId()) {
            return ["status" => "error", "message" => "ID du service requis"];
        }
        
        $service = $this->services->find($request->getId());
        if (!$service) {
            return ["status" => "error", "message" => "Service demandeur non trouvé"];
        }
        
        $jsonData = $request->getJson();
        $data = json_decode($jsonData, true);
        
        if (!$data || !isset($data['nom']) || trim($data['nom']) === '') {
            return ["status" => "error", "message" => "Nom du service requis"];
        }
        
        $service->setNom($data['nom']);
        
        if ($this->services->update($service)) {
            return ["status" => "success", "message" => "Service demandeur mis à jour", "data" => $service];
        }
        
        return ["status" => "error", "message" => "Erreur lors de la mise à jour du service demandeur"];
    }
    
    protected function processDeleteRequest(HttpRequest $request) {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Non autorisé", "code" => 401];
        }
        
        // Vérifier si l'utilisateur a le droit d'accéder à la gestion des services
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        if (!$hasAdminAccess) {
            return ["status" => "error", "message" => "Accès refusé", "code" => 403];
        }
        
        if (!$request->getId()) {
            return ["status" => "error", "message" => "ID du service requis"];
        }
        
        if ($this->services->delete($request->getId())) {
            return ["status" => "success", "message" => "Service demandeur supprimé"];
        }
        
        return ["status" => "error", "message" => "Erreur lors de la suppression du service demandeur"];
    }
}