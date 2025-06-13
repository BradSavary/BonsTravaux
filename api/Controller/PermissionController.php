<?php

require_once "Controller.php";
require_once "Repository/UserPermissionRepository.php";
require_once "Repository/UserRepository.php";
require_once "Controller/UserController.php";

class PermissionController extends Controller {
    private UserPermissionRepository $permissions;
    private UserRepository $users;
    
    public function __construct() {
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
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Non autorisé", "code" => 401];
        }
        
        // Vérifier si l'utilisateur a la permission AdminAccess
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        if (!$hasAdminAccess) {
            return ["status" => "error", "message" => "Accès refusé", "code" => 403];
        }
        
        // Si on demande les permissions pour un utilisateur spécifique
        if ($request->getId()) {
            $userPermissions = $this->permissions->findByUserId($request->getId());
            return ["status" => "success", "data" => $userPermissions];
        }
        
        // Sinon, retourner toutes les permissions (ou simplement un message d'erreur car c'est une opération coûteuse)
        return ["status" => "error", "message" => "Veuillez spécifier un ID d'utilisateur"];
    }
    
    protected function processPostRequest(HttpRequest $request) {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Non autorisé", "code" => 401];
        }
        
        // Vérifier si l'utilisateur a la permission AdminAccess
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        if (!$hasAdminAccess) {
            return ["status" => "error", "message" => "Accès refusé", "code" => 403];
        }
        
        $jsonData = $request->getJson();
        $data = json_decode($jsonData, true);
        
        if (!$data || !isset($data['user_id']) || !isset($data['permission'])) {
            return ["status" => "error", "message" => "Données incomplètes"];
        }
        
        // Vérifier que l'utilisateur existe
        $targetUser = $this->users->find($data['user_id']);
        if (!$targetUser) {
            return ["status" => "error", "message" => "Utilisateur non trouvé"];
        }
        
        // Vérifier si la permission existe déjà
        if ($this->permissions->hasPermission($data['user_id'], $data['permission'])) {
            return ["status" => "error", "message" => "La permission existe déjà pour cet utilisateur"];
        }
        
        $permission = new UserPermission($data['user_id'], $data['permission']);
        
        if ($this->permissions->save($permission)) {
            return ["status" => "success", "message" => "Permission ajoutée"];
        }
        
        return ["status" => "error", "message" => "Erreur lors de l'ajout de la permission"];
    }
    
protected function processDeleteRequest(HttpRequest $request) {
    $user = $this->getUserFromToken($request);
    if (!$user) {
        return ["status" => "error", "message" => "Non autorisé", "code" => 401];
    }
    
    // Vérifier si l'utilisateur a la permission AdminAccess
    $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
    if (!$hasAdminAccess) {
        return ["status" => "error", "message" => "Accès refusé", "code" => 403];
    }
    
    //Vérifier les paramètres d'URL ?userId=X&permission=Y
    $userId = $request->getParam('userId');
    $permissionName = $request->getParam('permission');
    
    if ($userId && $permissionName) {
        if ($this->permissions->deleteUserPermission($userId, $permissionName)) {
            return ["status" => "success", "message" => "Permission supprimée"];
        }
        
        return ["status" => "error", "message" => "Erreur lors de la suppression de la permission"];
    }
    
    return ["status" => "error", "message" => "Format d'URL invalide ou paramètres manquants. Utilisez soit /permissions/{user_id}/{permission_name} soit ?userId={user_id}&permission={permission_name}"];
}
    
    // Méthode utilitaire pour vérifier les permissions utilisateur (utilisable par d'autres contrôleurs)
    public function checkPermission($userId, $permission) {
        return $this->permissions->hasPermission($userId, $permission);
    }
    
    public function getUserPermissions($userId) {
        return $this->permissions->getUserPermissions($userId);
    }
    
    public function hasAnyTicketPermission($userId) {
        return $this->permissions->hasAnyTicketPermission($userId);
    }
    
    public function getUserTicketPermissions($userId) {
        return $this->permissions->getUserTicketPermissions($userId);
    }
}