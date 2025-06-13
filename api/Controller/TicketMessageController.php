<?php

require_once "Controller.php";
require_once "Repository/TicketMessageRepository.php";
require_once "Repository/TicketRepository.php";
require_once "Repository/UserRepository.php";
require_once "Repository/UserPermissionRepository.php";
require_once "Repository/ServiceIntervenantRepository.php";

class TicketMessageController extends Controller {
    private TicketMessageRepository $messages;
    private TicketRepository $tickets;
    private UserRepository $users;
    private UserPermissionRepository $permissions;
    private ServiceIntervenantRepository $services;
    
    public function __construct() {
        $this->messages = new TicketMessageRepository();
        $this->tickets = new TicketRepository();
        $this->users = new UserRepository();
        $this->permissions = new UserPermissionRepository();
        $this->services = new ServiceIntervenantRepository();
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
        
        // Récupérer les messages d'un ticket spécifique
        if ($request->getId()) {
            $ticketId = $request->getId();
            $ticket = $this->tickets->find($ticketId);
            
            if (!$ticket) {
                return ["status" => "error", "message" => "Ticket non trouvé", "code" => 404];
            }
            
            // Vérifier si l'utilisateur a le droit de voir les messages de ce ticket
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
                $serviceCode = $this->getServiceCodeFromName($serviceIntervenant->getName());
                if ($this->permissions->hasPermission($user->getId(), $serviceCode . 'Ticket')) {
                    $canAccess = true;
                }
            }
            
            if (!$canAccess) {
                return ["status" => "error", "message" => "Accès refusé", "code" => 403];
            }
            
            $messages = $this->messages->findByTicketId($ticketId);
            return ["status" => "success", "data" => $messages];
        }
        
        return ["status" => "error", "message" => "ID de ticket requis", "code" => 400];
    }
    
    protected function processPostRequest(HttpRequest $request) {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Non autorisé", "code" => 401];
        }
        
        $jsonData = $request->getJson();
        $data = json_decode($jsonData, true);
        
        if (!$data || !isset($data['ticket_id']) || !isset($data['message']) || trim($data['message']) === '') {
            return ["status" => "error", "message" => "Données incomplètes ou message vide", "code" => 400];
        }
        
        $ticketId = $data['ticket_id'];
        $ticket = $this->tickets->find($ticketId);
        
        if (!$ticket) {
            return ["status" => "error", "message" => "Ticket non trouvé", "code" => 404];
        }
        
        // Vérifier si l'utilisateur a le droit d'ajouter un message à ce ticket
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
            $serviceCode = $this->getServiceCodeFromName($serviceIntervenant->getName());
            if ($this->permissions->hasPermission($user->getId(), $serviceCode . 'Ticket')) {
                $canAccess = true;
            }
        }
        
        if (!$canAccess) {
            return ["status" => "error", "message" => "Accès refusé", "code" => 403];
        }
          // Créer le message
        $message = new TicketMessage(null);
        $message->setTicketId($ticketId);
        $message->setUserId($user->getId());
        $message->setUsername($user->getUsername());
        $message->setMessage(trim($data['message']));
        
        // Si c'est un message de résolution ou un autre type de message lié au statut
        if (isset($data['is_status_change']) && $data['is_status_change']) {
            $message->setIsStatusChange(true);
            
            if (isset($data['status_type'])) {
                $message->setStatusType($data['status_type']);
            }
        }
        
        $savedMessage = $this->messages->save($message);
        
        if ($savedMessage) {
            // Récupérer tous les messages après l'ajout pour les renvoyer
            $allMessages = $this->messages->findByTicketId($ticketId);
            return [
                "status" => "success", 
                "message" => "Message envoyé", 
                "data" => [
                    "new_message" => $savedMessage,
                    "all_messages" => $allMessages
                ]
            ];
        }
        
        return ["status" => "error", "message" => "Erreur lors de l'envoi du message", "code" => 500];
    }
    
    protected function processDeleteRequest(HttpRequest $request) {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Non autorisé", "code" => 401];
        }
        
        if (!$request->getId()) {
            return ["status" => "error", "message" => "ID du message requis", "code" => 400];
        }
        
        $messageId = $request->getId();
        $message = $this->messages->find($messageId);
        
        if (!$message) {
            return ["status" => "error", "message" => "Message non trouvé", "code" => 404];
        }
        
        // Vérifier que l'utilisateur est l'auteur du message ou un admin
        if ($message->getUserId() != $user->getId() && !$this->permissions->hasPermission($user->getId(), 'AdminAccess')) {
            return ["status" => "error", "message" => "Vous n'êtes pas autorisé à supprimer ce message", "code" => 403];
        }
        
        if ($this->messages->delete($messageId)) {
            return ["status" => "success", "message" => "Message supprimé"];
        }
        
        return ["status" => "error", "message" => "Erreur lors de la suppression du message", "code" => 500];
    }
    
    private function getServiceCodeFromName($serviceName) {
        if (!$serviceName) {
            return '';
        }
        
        if (stripos($serviceName, 'Informatique') !== false) {
            return 'Informatique';
        }
        if (stripos($serviceName, 'Technique') !== false) {
            return 'Technique';
        }
        if (stripos($serviceName, 'Économat') !== false || stripos($serviceName, 'Economat') !== false) {
            return 'Economat';
        }
        
        return '';
    }
}