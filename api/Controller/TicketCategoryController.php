<?php

require_once "Controller.php";
require_once "Repository/TicketCategoryRepository.php";
require_once "Repository/ServiceIntervenantRepository.php";
require_once "Repository/UserPermissionRepository.php";
require_once "Repository/UserRepository.php";
require_once "Class/TicketCategory.php";

class TicketCategoryController extends Controller {
    private TicketCategoryRepository $categories;
    private ServiceIntervenantRepository $services;
    private UserPermissionRepository $permissions;
    private UserRepository $users;
    
    public function __construct() {
        $this->categories = new TicketCategoryRepository();
        $this->services = new ServiceIntervenantRepository();
        $this->permissions = new UserPermissionRepository();
        $this->users = new UserRepository();
    }
    
    private function getUserFromToken($request) {
        $headers = getallheaders();
        $token = null;
        
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (strpos($authHeader, 'Bearer ') === 0) {
                $token = substr($authHeader, 7);
            }
        }
        
        if (!$token) {
            return false;
        }
        
        require_once "Controller/UserController.php";
        $userCtrl = new UserController();
        $userData = $userCtrl->verifyTokenAndGetUser($token);
        
        if (!$userData) {
            return false;
        }
        
        return $this->users->find($userData['id']);
    }
    
    protected function processGetRequest(HttpRequest $request) {
        // Vérifier l'authentification
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Authentification requise"];
        }
        
        // Récupérer une catégorie par son ID
        if ($request->getId()) {
            $category = $this->categories->find($request->getId());
            if ($category) {
                return ["status" => "success", "data" => $category];
            }
            return ["status" => "error", "message" => "Catégorie non trouvée"];
        }
          // Rechercher des catégories par nom et service
        $serviceId = $request->getParam('serviceId');
        $query = $request->getParam('query');
        
        error_log("TicketCategoryController - serviceId: " . $serviceId . ", query: " . $query);
        
        if ($serviceId && $query !== null) {
            error_log("TicketCategoryController - Recherche par nom et service");
            $categories = $this->categories->searchByNameAndService($query, $serviceId);
            error_log("TicketCategoryController - Résultat: " . count($categories) . " catégories trouvées");
            return ["status" => "success", "data" => $categories];
        }
        
        // Récupérer les catégories par service
        if ($serviceId) {
            error_log("TicketCategoryController - Recherche par service uniquement");
            $categories = $this->categories->findByServiceId($serviceId);
            error_log("TicketCategoryController - Résultat: " . count($categories) . " catégories trouvées");
            return ["status" => "success", "data" => $categories];
        }
        
        // Récupérer toutes les catégories
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        if (!$hasAdminAccess) {
            // Pour les non-administrateurs, vérifier qu'ils ont au moins une permission de ticket
            $ticketPermissions = $this->permissions->getUserTicketPermissions($user->getId());
            if (empty($ticketPermissions)) {
                return ["status" => "error", "message" => "Accès refusé"];
            }
        }
        
        $categories = $this->categories->findAll();
        return ["status" => "success", "data" => $categories];
    }
    
    protected function processPostRequest(HttpRequest $request) {
        // Vérifier l'authentification
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Authentification requise"];
        }
        
        // Vérifier si l'utilisateur a la permission AdminAccess ou gère des tickets
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        $hasTicketPermission = $this->permissions->hasAnyTicketPermission($user->getId());
        
        if (!$hasAdminAccess && !$hasTicketPermission) {
            return ["status" => "error", "message" => "Accès refusé"];
        }
        
        $jsonData = $request->getJson();
        $data = json_decode($jsonData, true);
        
        if (!$data || !isset($data['name']) || !isset($data['service_id'])) {
            return ["status" => "error", "message" => "Données incomplètes"];
        }
        
        // Vérifier si le service existe
        $service = $this->services->find($data['service_id']);
        if (!$service) {
            return ["status" => "error", "message" => "Service intervenant non trouvé"];
        }
        
        // Si l'utilisateur n'est pas administrateur, vérifier qu'il a la permission pour ce service
        if (!$hasAdminAccess) {
            $serviceCode = $this->getServiceCodeFromName($service->getName());
            if ($serviceCode) {
                $hasPermission = $this->permissions->hasPermission($user->getId(), $serviceCode . 'Ticket');
                if (!$hasPermission) {
                    return ["status" => "error", "message" => "Vous n'avez pas les droits pour ce service"];
                }
            } else {
                return ["status" => "error", "message" => "Service non reconnu"];
            }
        }
        
        // Créer la catégorie
        $category = new TicketCategory(null);
        $category->setName(trim($data['name']));
        $category->setServiceId($data['service_id']);
        
        // Sauvegarder la catégorie
        $savedCategory = $this->categories->save($category);
        
        if ($savedCategory) {
            return ["status" => "success", "message" => "Catégorie créée", "data" => $savedCategory];
        }
        
        return ["status" => "error", "message" => "Erreur lors de la création de la catégorie"];
    }
    
    protected function processPutRequest(HttpRequest $request) {
        // Vérifier l'authentification
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Authentification requise"];
        }
        
        // Vérifier que l'utilisateur a la permission AdminAccess
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        if (!$hasAdminAccess) {
            return ["status" => "error", "message" => "Accès refusé"];
        }
        
        // Vérifier que l'ID est fourni
        if (!$request->getId()) {
            return ["status" => "error", "message" => "ID de catégorie manquant"];
        }
        
        // Récupérer la catégorie existante
        $category = $this->categories->find($request->getId());
        if (!$category) {
            return ["status" => "error", "message" => "Catégorie non trouvée"];
        }
        
        $jsonData = $request->getJson();
        $data = json_decode($jsonData, true);
        
        if (!$data) {
            return ["status" => "error", "message" => "Données invalides"];
        }
        
        // Mettre à jour les champs
        if (isset($data['name'])) {
            $category->setName(trim($data['name']));
        }
        
        if (isset($data['service_id'])) {
            // Vérifier si le service existe
            $service = $this->services->find($data['service_id']);
            if (!$service) {
                return ["status" => "error", "message" => "Service intervenant non trouvé"];
            }
            
            $category->setServiceId($data['service_id']);
        }
        
        // Enregistrer les modifications
        $success = $this->categories->update($category);
        
        if ($success) {
            return ["status" => "success", "message" => "Catégorie mise à jour", "data" => $category];
        }
        
        return ["status" => "error", "message" => "Erreur lors de la mise à jour de la catégorie"];
    }
    
    protected function processDeleteRequest(HttpRequest $request) {
        // Vérifier l'authentification
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Authentification requise"];
        }
        
        // Vérifier que l'utilisateur a la permission AdminAccess
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        if (!$hasAdminAccess) {
            return ["status" => "error", "message" => "Accès refusé"];
        }
        
        // Vérifier que l'ID est fourni
        if (!$request->getId()) {
            return ["status" => "error", "message" => "ID de catégorie manquant"];
        }
        
        // Récupérer la catégorie existante
        $category = $this->categories->find($request->getId());
        if (!$category) {
            return ["status" => "error", "message" => "Catégorie non trouvée"];
        }
        
        // Supprimer la catégorie
        $success = $this->categories->delete($request->getId());
        
        if ($success) {
            return ["status" => "success", "message" => "Catégorie supprimée"];
        }
        
        return ["status" => "error", "message" => "Erreur lors de la suppression de la catégorie"];
    }
    
    private function getServiceCodeFromName($serviceName) {
        if (stripos($serviceName, 'Informatique') !== false) {
            return 'Informatique';
        } else if (stripos($serviceName, 'Technique') !== false) {
            return 'Technique';
        } else if (stripos($serviceName, 'Économat') !== false || stripos($serviceName, 'Economat') !== false) {
            return 'Économat';
        }
        return null;
    }
}
