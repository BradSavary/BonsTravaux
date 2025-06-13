<?php

require_once "Controller.php";
require_once "Repository/TicketImageRepository.php";
require_once "Repository/TicketRepository.php";
require_once "Repository/UserRepository.php";
require_once "Repository/UserPermissionRepository.php";

class TicketImageController extends Controller {
    private TicketImageRepository $images;
    private TicketRepository $tickets;
    private UserRepository $users;
    private UserPermissionRepository $permissions;
    
    // Dossier de stockage des images (relatif au dossier de l'API)
    private string $imageStoragePath = "uploads/tickets/";
    
    // Extensions autorisées
    private array $allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ];
    
    // Taille maximale des fichiers (5 MB)
    private int $maxFileSize = 5242880;
    
    public function __construct() {
        $this->images = new TicketImageRepository();
        $this->tickets = new TicketRepository();
        $this->users = new UserRepository();
        $this->permissions = new UserPermissionRepository();
        
        // Créer le dossier de stockage s'il n'existe pas
        $this->ensureStoragePathExists();
    }
    
    private function ensureStoragePathExists() {
        // Créer le dossier s'il n'existe pas
        if (!file_exists($this->imageStoragePath)) {
            mkdir($this->imageStoragePath, 0775, true);
        }
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
            return ["status" => "error", "message" => "Utilisateur non authentifié"];
        }
        
        // Cas 1 : Récupérer une image spécifique par son ID
        if ($request->getId()) {
            $image = $this->images->find($request->getId());
            
            if (!$image) {
                return ["status" => "error", "message" => "Image non trouvée"];
            }
            
            // Vérifier si l'utilisateur a accès au ticket associé à cette image
            $ticket = $this->tickets->find($image->getTicketId());
            $hasAccessToTicket = $this->checkTicketAccess($user, $ticket);
            
            if (!$hasAccessToTicket) {
                return ["status" => "error", "message" => "Vous n'avez pas les droits pour accéder à cette image"];
            }
            
            return ["status" => "success", "data" => $image];
        }
        
        // Cas 2 : Récupérer toutes les images d'un ticket
        $ticketId = $request->getParam('ticketId');
        if ($ticketId) {
            $ticket = $this->tickets->find($ticketId);
            
            if (!$ticket) {
                return ["status" => "error", "message" => "Ticket non trouvé"];
            }
            
            // Vérifier si l'utilisateur a accès à ce ticket
            $hasAccessToTicket = $this->checkTicketAccess($user, $ticket);
            
            if (!$hasAccessToTicket) {
                return ["status" => "error", "message" => "Vous n'avez pas les droits pour accéder aux images de ce ticket"];
            }
            
            $images = $this->images->findByTicketId($ticketId);
            return ["status" => "success", "data" => $images];
        }
        
        // Par défaut, retourner toutes les images (uniquement pour les administrateurs)
        if ($this->permissions->hasPermission($user->getId(), 'AdminAccess')) {
            $images = $this->images->findAll();
            return ["status" => "success", "data" => $images];
        } else {
            return ["status" => "error", "message" => "Accès non autorisé"];
        }
    }
    
    protected function processPostRequest(HttpRequest $request) {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Utilisateur non authentifié"];
        }
        
        $jsonData = $request->getJson();
        $data = json_decode($jsonData, true);
        
        if (!$data) {
            return ["status" => "error", "message" => "Données JSON invalides"];
        }
        
        // Vérifier la présence des champs requis
        if (!isset($data['image_data']) || !isset($data['ticket_id'])) {
            return ["status" => "error", "message" => "Données manquantes: image_data et ticket_id sont requis"];
        }
        
        // Traiter les données d'image (base64)
        $imageData = $data['image_data'];
        $ticketId = $data['ticket_id'];
        $messageId = $data['message_id'] ?? null;
        $inMessage = isset($data['in_message']) ? (bool)$data['in_message'] : false;
        
        // Vérifier si l'utilisateur a accès au ticket
        $ticket = $this->tickets->find($ticketId);
        if (!$ticket) {
            return ["status" => "error", "message" => "Ticket non trouvé"];
        }
        
        $hasAccessToTicket = $this->checkTicketAccess($user, $ticket);
        if (!$hasAccessToTicket) {
            return ["status" => "error", "message" => "Vous n'avez pas les droits pour ajouter des images à ce ticket"];
        }
        
        // Vérifier et décoder les données de l'image
        if (!$this->isValidBase64Image($imageData)) {
            return ["status" => "error", "message" => "Format d'image invalide. Utilisez uniquement des images au format JPEG, PNG, GIF ou WEBP"];
        }
        
        list($imageType, $imageData) = $this->parseBase64Image($imageData);
        
        // Vérifier si le type MIME est autorisé
        if (!in_array($imageType, $this->allowedMimeTypes)) {
            return ["status" => "error", "message" => "Type de fichier non autorisé. Utilisez uniquement des images JPEG, PNG, GIF ou WEBP"];
        }
        
        // Vérifier la taille du fichier
        if (strlen($imageData) > $this->maxFileSize) {
            return ["status" => "error", "message" => "L'image est trop volumineuse. La taille maximale est de 5 MB"];
        }
        
        // Générer un nom de fichier unique
        $extension = $this->getExtensionFromMimeType($imageType);
        $filename = uniqid('ticket_' . $ticketId . '_') . '.' . $extension;
        $originalName = 'image_' . date('Ymd_His') . '.' . $extension;
        
        // Créer un dossier spécifique pour le ticket si nécessaire
        $ticketFolder = $this->imageStoragePath . $ticketId . '/';
        if (!file_exists($ticketFolder)) {
            mkdir($ticketFolder, 0775, true);
        }
        
        $filePath = $ticketFolder . $filename;
        
        // Enregistrer l'image sur le disque
        if (!file_put_contents($filePath, $imageData)) {
            return ["status" => "error", "message" => "Échec de l'enregistrement de l'image"];
        }
        
        // Enregistrer l'image dans la base de données
        $image = new TicketImage(null);
        $image->setTicketId($ticketId)
            ->setUserId($user->getId())
            ->setFilename($filename)
            ->setOriginalName($originalName)
            ->setMimeType($imageType)
            ->setFileSize(strlen($imageData))
            ->setInMessage($inMessage);
        
        if ($messageId) {
            $image->setMessageId($messageId);
        }
        
        $savedImage = $this->images->save($image);
        
        if ($savedImage) {
            return ["status" => "success", "message" => "Image enregistrée avec succès", "data" => $savedImage];
        } else {
            // Si l'enregistrement en base échoue, supprimer le fichier
            unlink($filePath);
            return ["status" => "error", "message" => "Échec de l'enregistrement des informations de l'image"];
        }
    }
    
    protected function processDeleteRequest(HttpRequest $request) {
        $user = $this->getUserFromToken($request);
        if (!$user) {
            return ["status" => "error", "message" => "Utilisateur non authentifié"];
        }
        
        if ($request->getId()) {
            // Supprimer une image spécifique
            $image = $this->images->find($request->getId());
            
            if (!$image) {
                return ["status" => "error", "message" => "Image non trouvée"];
            }
            
            // Vérifier si l'utilisateur a accès au ticket associé à cette image
            $ticket = $this->tickets->find($image->getTicketId());
            $isAdmin = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
            $isCreator = $image->getUserId() == $user->getId();
            
            if (!$isAdmin && !$isCreator) {
                return ["status" => "error", "message" => "Vous n'avez pas les droits pour supprimer cette image"];
            }
            
            // Supprimer l'image de la base de données
            $deleted = $this->images->delete($image->getId());
            
            if ($deleted) {
                // Supprimer le fichier physique
                $filePath = $this->imageStoragePath . $image->getTicketId() . '/' . $image->getFilename();
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
                
                return ["status" => "success", "message" => "Image supprimée avec succès"];
            } else {
                return ["status" => "error", "message" => "Échec de la suppression de l'image"];
            }
        } else {
            // Cas où on pourrait supprimer toutes les images d'un ticket
            $ticketId = $request->getParam('ticketId');
            
            if (!$ticketId) {
                return ["status" => "error", "message" => "ID du ticket non spécifié"];
            }
            
            // Vérifier si l'utilisateur est administrateur
            if (!$this->permissions->hasPermission($user->getId(), 'AdminAccess')) {
                return ["status" => "error", "message" => "Vous n'avez pas les droits pour supprimer toutes les images d'un ticket"];
            }
            
            // Supprimer toutes les images du ticket
            $images = $this->images->findByTicketId($ticketId);
            $this->images->deleteByTicketId($ticketId);
            
            // Supprimer les fichiers physiques
            $ticketFolder = $this->imageStoragePath . $ticketId . '/';
            if (file_exists($ticketFolder)) {
                $files = glob($ticketFolder . '*');
                foreach ($files as $file) {
                    if (is_file($file)) {
                        unlink($file);
                    }
                }
                // Supprimer le dossier
                rmdir($ticketFolder);
            }
            
            return ["status" => "success", "message" => "Toutes les images du ticket ont été supprimées"];
        }
    }
    
    // Vérifier si l'utilisateur a accès à un ticket (pour voir/modifier)
    private function checkTicketAccess($user, $ticket) {
        // Si l'utilisateur est l'auteur du ticket
        if ($user->getId() == $ticket->getUserId()) {
            return true;
        }
        
        // Si l'utilisateur est administrateur
        if ($this->permissions->hasPermission($user->getId(), 'AdminAccess')) {
            return true;
        }
        
        // Si l'utilisateur a des droits techniques sur le service concerné
        $serviceCode = $this->getServiceCodeFromName($ticket->getServiceIntervenantName());
        if ($serviceCode && $this->permissions->hasPermission($user->getId(), $serviceCode . 'Ticket')) {
            return true;
        }
        
        return false;
    }
    
    // Extraire le code du service à partir du nom
    private function getServiceCodeFromName($serviceName) {
        if (!$serviceName) {
            return null;
        }
        
        if (stripos($serviceName, 'Informatique') !== false) {
            return 'Informatique';
        } else if (stripos($serviceName, 'Technique') !== false) {
            return 'Technique';
        } else if (stripos($serviceName, 'Économat') !== false || stripos($serviceName, 'Economat') !== false) {
            return 'Économat';
        }
        
        return null;
    }
    
    // Vérifier si une chaîne est une image base64 valide
    private function isValidBase64Image($data) {
        if (!is_string($data)) {
            return false;
        }
        
        // Vérifier le format base64 avec en-tête data URL
        if (!preg_match('/^data:image\/(jpeg|png|gif|webp);base64,/', $data)) {
            return false;
        }
        
        return true;
    }
    
    // Extraire le type MIME et les données binaires d'une image base64
    private function parseBase64Image($data) {
        // Extraire le type MIME
        $matches = [];
        preg_match('/^data:(image\/\w+);base64,/', $data, $matches);
        $imageType = $matches[1];
        
        // Extraire les données binaires
        $base64Data = preg_replace('/^data:image\/\w+;base64,/', '', $data);
        $imageData = base64_decode($base64Data);
        
        return [$imageType, $imageData];
    }
    
    // Obtenir l'extension de fichier à partir du type MIME
    private function getExtensionFromMimeType($mimeType) {
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp'
        ];
        
        return $extensions[$mimeType] ?? 'jpg';
    }
    
    // Méthode pour servir une image (URL: /ticketimage/serve/{id})
    public function serveImage($imageId) {
        $image = $this->images->find($imageId);
        
        if (!$image) {
            header("HTTP/1.0 404 Not Found");
            echo "Image non trouvée";
            return;
        }
        
        $filePath = $this->imageStoragePath . $image->getTicketId() . '/' . $image->getFilename();
        
        if (!file_exists($filePath)) {
            header("HTTP/1.0 404 Not Found");
            echo "Fichier image non trouvé";
            return;
        }
        
        // Définir le type de contenu
        header('Content-Type: ' . $image->getMimeType());
        header('Content-Disposition: inline; filename="' . $image->getOriginalName() . '"');
        header('Content-Length: ' . filesize($filePath));
        
        // Désactiver la mise en cache
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        
        // Envoyer le fichier au client
        readfile($filePath);
        exit;
    }
}
