<?php

require_once "Controller.php";
require_once "Repository/ServiceNotificationEmailRepository.php";
require_once "Repository/ServiceIntervenantRepository.php";
require_once "Repository/UserPermissionRepository.php";
require_once "Repository/UserRepository.php";
require_once "Class/ServiceNotificationEmail.php";

class NotificationEmailController extends Controller {
    private ServiceNotificationEmailRepository $notifications;
    private ServiceIntervenantRepository $services;
    private UserPermissionRepository $permissions;
    private UserRepository $users;
    
    public function __construct() {
        $this->notifications = new ServiceNotificationEmailRepository();
        $this->services = new ServiceIntervenantRepository();
        $this->permissions = new UserPermissionRepository();
        $this->users = new UserRepository();
    }
    
    private function getUserFromToken($request) {
        $headers = getallheaders();
        $token = null;
        
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            $bearerPrefix = 'Bearer ';
            
            if (substr($authHeader, 0, strlen($bearerPrefix)) === $bearerPrefix) {
                $token = substr($authHeader, strlen($bearerPrefix));
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
        // Vérifier l'authentification
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Vous devez être connecté pour accéder à cette ressource", "code" => 401];
        }
        
        // Vérifier que l'utilisateur est admin
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        if (!$hasAdminAccess) {
            return ["status" => "error", "message" => "Vous n'avez pas les permissions nécessaires", "code" => 403];
        }
        
        // Route pour tester l'envoi d'emails
        if ($request->getId() === 'test-email' && $request->getParam('email')) {
            require_once "Class/EmailSender.php";
            $to = $request->getParam('email');
            
            // Essayer d'envoyer un email de test
            $result = EmailSender::sendTestEmail($to);
            
            if ($result) {
                return [
                    "status" => "success", 
                    "message" => "Un email de test a été envoyé à " . $to . ". Vérifiez votre boîte de réception."
                ];
            } else {
                return [
                    "status" => "error", 
                    "message" => "Échec de l'envoi de l'email de test. Vérifiez les logs du serveur pour plus d'informations.",
                    "code" => 500
                ];
            }
        }
        
        // Récupérer une notification spécifique par son ID
        if ($request->getId()) {
            $notification = $this->notifications->find($request->getId());
            
            if (!$notification) {
                return ["status" => "error", "message" => "Notification introuvable", "code" => 404];
            }
            
            return ["status" => "success", "data" => $notification];
        }
        
        // Récupérer toutes les notifications
        $allNotifications = $this->notifications->findAll();
        
        // Obtenir la liste des services intervenants pour le formulaire
        if ($request->getParam('service_options')) {
            $allServices = $this->services->findAll();
            $serviceOptions = array_map(function($service) {
                return [
                    "id" => $service->getId(),
                    "name" => $service->getName()
                ];
            }, $allServices);
            
            return [
                "status" => "success", 
                "data" => [
                    "services" => $serviceOptions,
                    "permissions" => [
                        ["id" => "InformatiqueTicket", "name" => "Informatique"],
                        ["id" => "TechniqueTicket", "name" => "Technique"],
                        ["id" => "EconomatTicket", "name" => "Économat"]
                    ]
                ]
            ];
        }
        
        return ["status" => "success", "data" => $allNotifications];
    }
    
    protected function processPostRequest(HttpRequest $request) {
        // Vérifier l'authentification
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Vous devez être connecté pour accéder à cette ressource", "code" => 401];
        }
        
        // Vérifier que l'utilisateur est admin
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        if (!$hasAdminAccess) {
            return ["status" => "error", "message" => "Vous n'avez pas les permissions nécessaires", "code" => 403];
        }
        
        // Récupérer les données de la requête
        $jsonData = $request->getJson();
        $data = json_decode($jsonData, true);
        
        if (!$data || !isset($data['service_id']) || !isset($data['permission_type']) || !isset($data['email'])) {
            return ["status" => "error", "message" => "Données manquantes ou incorrectes", "code" => 400];
        }
        
        // Valider l'adresse email
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return ["status" => "error", "message" => "L'adresse email n'est pas valide", "code" => 400];
        }
        
        // Vérifier que le service existe
        $service = $this->services->find($data['service_id']);
        if (!$service) {
            return ["status" => "error", "message" => "Service intervenant introuvable", "code" => 404];
        }
        
        // Créer et sauvegarder la notification
        $notification = new ServiceNotificationEmail(null);
        $notification->setServiceId($data['service_id']);
        $notification->setPermissionType($data['permission_type']);
        $notification->setEmail($data['email']);
        $notification->setEnabled(isset($data['enabled']) ? $data['enabled'] : true);
        
        $savedNotification = $this->notifications->save($notification);
        
        if ($savedNotification) {
            return ["status" => "success", "message" => "Notification email créée avec succès", "data" => $savedNotification];
        } else {
            return ["status" => "error", "message" => "Erreur lors de la création de la notification email", "code" => 500];
        }
    }
    
    protected function processPutRequest(HttpRequest $request) {
        // Vérifier l'authentification
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Vous devez être connecté pour accéder à cette ressource", "code" => 401];
        }
        
        // Vérifier que l'utilisateur est admin
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        if (!$hasAdminAccess) {
            return ["status" => "error", "message" => "Vous n'avez pas les permissions nécessaires", "code" => 403];
        }
        
        // Vérifier l'ID de la notification
        if (!$request->getId()) {
            return ["status" => "error", "message" => "ID de notification manquant", "code" => 400];
        }
        
        // Vérifier que la notification existe
        $notification = $this->notifications->find($request->getId());
        if (!$notification) {
            return ["status" => "error", "message" => "Notification introuvable", "code" => 404];
        }
        
        // Récupérer les données de la requête
        $jsonData = $request->getJson();
        $data = json_decode($jsonData, true);
        
        if (!$data) {
            return ["status" => "error", "message" => "Données incorrectes", "code" => 400];
        }
        
        // Mettre à jour les champs modifiés
        if (isset($data['email'])) {
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                return ["status" => "error", "message" => "L'adresse email n'est pas valide", "code" => 400];
            }
            $notification->setEmail($data['email']);
        }
        
        if (isset($data['service_id'])) {
            $service = $this->services->find($data['service_id']);
            if (!$service) {
                return ["status" => "error", "message" => "Service intervenant introuvable", "code" => 404];
            }
            $notification->setServiceId($data['service_id']);
        }
        
        if (isset($data['permission_type'])) {
            $notification->setPermissionType($data['permission_type']);
        }
        
        if (isset($data['enabled'])) {
            $notification->setEnabled($data['enabled']);
        }
        
        // Enregistrer les modifications
        $result = $this->notifications->update($notification);
        
        if ($result) {
            return [
                "status" => "success", 
                "message" => "Notification email mise à jour avec succès", 
                "data" => $this->notifications->find($notification->getId())
            ];
        } else {
            return ["status" => "error", "message" => "Erreur lors de la mise à jour de la notification email", "code" => 500];
        }
    }
    
    protected function processDeleteRequest(HttpRequest $request) {
        // Vérifier l'authentification
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Vous devez être connecté pour accéder à cette ressource", "code" => 401];
        }
        
        // Vérifier que l'utilisateur est admin
        $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        if (!$hasAdminAccess) {
            return ["status" => "error", "message" => "Vous n'avez pas les permissions nécessaires", "code" => 403];
        }
        
        // Vérifier l'ID de la notification
        if (!$request->getId()) {
            return ["status" => "error", "message" => "ID de notification manquant", "code" => 400];
        }
        
        // Vérifier que la notification existe
        $notification = $this->notifications->find($request->getId());
        if (!$notification) {
            return ["status" => "error", "message" => "Notification introuvable", "code" => 404];
        }
        
        // Supprimer la notification
        $result = $this->notifications->delete($request->getId());
        
        if ($result) {
            return ["status" => "success", "message" => "Notification email supprimée avec succès"];
        } else {
            return ["status" => "error", "message" => "Erreur lors de la suppression de la notification email", "code" => 500];
        }
    }
}
