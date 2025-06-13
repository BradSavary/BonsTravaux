<?php

require_once "Controller.php";
require_once "Repository/UserRepository.php";
require_once "Repository/UserPermissionRepository.php";


class UserController extends Controller {

    private UserRepository $users;
    private UserPermissionRepository $permissions;
    private string $secretKey = "votre_clé_secrète_très_complexe_à_changer_en_production";
    private int $tokenExpiration = 3600; // 1 heure en secondes
    private $ldapServer = "ldap://10.84.15.1:389"; // LDAP server address
    private $ldapDomain = "hl-stleonard.fr"; // LDAP domain name 


    public function __construct() {
        $this->users = new UserRepository();
        $this->permissions = new UserPermissionRepository();
    }
    
    private function setError($message, $code = 400) {
        http_response_code($code);
        return ["status" => "error", "message" => $message, "code" => $code];
    }

    /**
     * Détermine le site en fonction de l'adresse IP
     */
    private function determineSiteFromIP($ip) {
        // Extraire seulement les parties numériques de l'IP
        if (preg_match('/(\d+\.\d+\.\d+\.\d+)/', $ip, $matches)) {
            $ip = $matches[0];
        }
        
        $ipParts = explode('.', $ip);
        
        if (count($ipParts) !== 4) {
            return "Inconnu";
        }
        
        // Saint Leonard: 10.84.xxx.xxx
        if ($ipParts[0] == '10' && $ipParts[1] == '84') {
            return "Saint Leonard";
        }
        
        // Bujaleuf: 10.85.xxx.xxx
        if ($ipParts[0] == '10' && $ipParts[1] == '85') {
            return "Bujaleuf";
        }
        
        // Cas particulier: 10.xxx.188.xxx => À déterminer
        if ($ipParts[0] == '10' && $ipParts[2] == '188') {
            return "À déterminer";
        }
        
        // Valeur par défaut
        return "Inconnu";
    }
    
    /**
     * Récupère l'adresse IP du client
     */
    private function getClientIP() {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            // Pour gérer les proxys
            return $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            return $_SERVER['REMOTE_ADDR'];
        }
    }

    protected function processPostRequest(HttpRequest $request) {
        $jsonData = $request->getJson();
        $data = json_decode($jsonData, true);
        
        if (!$data) {
            return $this->setError("Données JSON invalides");
        }
        
        // Traiter la connexion
        if ($request->getId() === "login") {
            if (!isset($data['username']) || !isset($data['password'])) {
                return $this->setError("Nom d'utilisateur et mot de passe requis", 400);
            }
            
            $username = $data['username'];
            $password = $data['password'];
            
            // Récupérer l'adresse IP du client
            $clientIP = $this->getClientIP();
            
            // Déterminer le site en fonction de l'IP
            $site = $this->determineSiteFromIP($clientIP);
            
            // 1. Vérifier d'abord dans la base de données locale
            $user = $this->users->findByUsername($username);
            
            if ($user && password_verify($password, $user->getPassword())) {
                // Mettre à jour l'IP et le site de l'utilisateur
                $user->setLastIp($clientIP);
                $user->setSite($site);
                $this->users->update($user);
                
                // Utilisateur trouvé dans la base de données, on génère un token
                return $this->generateTokenResponse($user);
            }
            
            // 2. Si non trouvé ou mot de passe incorrect, essayer LDAP
            $ldapUser = $this->authenticateWithLDAP($username, $password);
            
            if ($ldapUser) {
                // L'utilisateur est authentifié par LDAP, on l'ajoute à la BDD
                $newUser = new User(null);
                $newUser->setUsername($username);
                // On stocke un hash du mot de passe, jamais en clair
                $newUser->setPassword(password_hash($password, PASSWORD_DEFAULT));
                $newUser->setLastIp($clientIP);
                $newUser->setSite($site);
                
                $savedUser = $this->users->save($newUser);
                if ($savedUser) {
                    return $this->generateTokenResponse($savedUser);
                } else {
                    return $this->setError("Erreur lors de l'enregistrement de l'utilisateur", 500);
                }
            }
            
            return $this->setError("Identifiants invalides", 401);
        }
        
        // Vérification de token
        if ($request->getId() === "verify") {
            if (!isset($data['token'])) {
                return $this->setError("Token requis", 400);
            }
            
            $userInfo = $this->verifyTokenAndGetUser($data['token']);
            if ($userInfo) {
                // Récupérer l'utilisateur pour obtenir ses informations complètes
                $user = $this->users->find($userInfo['id']);
                
                // Mettre à jour l'IP et le site si l'utilisateur est trouvé
                if ($user) {
                    $clientIP = $this->getClientIP();
                    $site = $this->determineSiteFromIP($clientIP);
                    
                    // Ne mettre à jour que si l'IP a changé
                    if ($user->getLastIp() !== $clientIP) {
                        $user->setLastIp($clientIP);
                        $user->setSite($site);
                        $this->users->update($user);
                    }
                    
                    // Ajouter les informations de site et d'IP à la réponse
                    $userInfo['last_ip'] = $user->getLastIp();
                    $userInfo['site'] = $user->getSite();
                }
                
                return [
                    "status" => "success",
                    "user" => $userInfo
                ];
            }
            
            return $this->setError("Token invalide ou expiré", 401);
        }

        // Créer un nouvel utilisateur (accessible uniquement aux administrateurs)
            if ($request->getId() === "create") {
                // Vérifier si l'utilisateur est authentifié et a les droits d'administration
                $headers = getallheaders();
                $token = null;
                
                if (isset($headers['Authorization'])) {
                    $authHeader = $headers['Authorization'];
                    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                        $token = $matches[1];
                    }
                }
                
                if (!$token) {
                    return $this->setError("Non authentifié", 401);
                }
                
                $userInfo = $this->verifyTokenAndGetUser($token);
                if (!$userInfo || !isset($userInfo['id'])) {
                    return $this->setError("Token invalide", 401);
                }
                
                // Vérifier si l'utilisateur a les droits d'administration
                $user = $this->users->find($userInfo['id']);
                $hasAdminAccess = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
                
                if (!$hasAdminAccess) {
                    return $this->setError("Droits d'administration requis", 403);
                }
                
                // Valider les données
                if (!isset($data['username']) || trim($data['username']) === '') {
                    return $this->setError("Nom d'utilisateur requis", 400);
                }
                
                if (!isset($data['password']) || trim($data['password']) === '') {
                    return $this->setError("Mot de passe requis", 400);
                }
                
                // Vérifier si l'utilisateur existe déjà
                $existingUser = $this->users->findByUsername($data['username']);
                if ($existingUser) {
                    return $this->setError("Un utilisateur avec ce nom existe déjà", 400);
                }
                
                // Créer l'utilisateur
                $newUser = new User(null);
                $newUser->setUsername($data['username']);
                
                // Hasher le mot de passe
                $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
                $newUser->setPassword($hashedPassword);
                
                // Définir le site si fourni, sinon il sera déterminé à la connexion
                if (isset($data['site']) && trim($data['site']) !== '') {
                    $newUser->setSite($data['site']);
                }
                
                // Sauvegarder l'utilisateur
                $savedUser = $this->users->save($newUser);
                
                if ($savedUser) {
                    return [
                        "status" => "success", 
                        "message" => "Utilisateur créé avec succès",
                        "data" => [
                            "id" => $savedUser->getId(),
                            "username" => $savedUser->getUsername(),
                            "site" => $savedUser->getSite()
                        ]
                    ];
                }
                
                return $this->setError("Erreur lors de la création de l'utilisateur", 500);
            }




        
        return $this->setError("Opération non prise en charge", 404);
    }
    
protected function processGetRequest(HttpRequest $request) {
        // Récupérer les info utilisateur depuis le token dans l'en-tête
        if ($request->getId() === "current") {
            $headers = getallheaders();
            $token = null;
            
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
                if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                    $token = $matches[1];
                }
            }
            
            if (!$token) {
                return $this->setError("Token non fourni", 401);
            }
            
            $userInfo = $this->verifyTokenAndGetUser($token);
            if ($userInfo) {
                // Récupérer les permissions
                $userPermissions = $this->permissions->getUserPermissions($userInfo['id']);
                $userInfo['permissions'] = $userPermissions;
                
                return [
                    "status" => "success",
                    "user" => $userInfo
                ];
            }
            
            return $this->setError("Token invalide ou expiré", 401);
        }
        
        // Récupérer tous les utilisateurs (pour l'administration)
         if ($request->getId() === "all") {
            // Vérifier que l'utilisateur a la permission AdminAccess
            $headers = getallheaders();
            $token = null;
            
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
                if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                    $token = $matches[1];
                }
            }
            
            if (!$token) {
                return $this->setError("Token manquant", 401);
            }
            
            $userInfo = $this->verifyTokenAndGetUser($token);
            if (!$userInfo) {
                return $this->setError("Token invalide", 401);
            }
            
            // Vérifier si l'utilisateur a la permission AdminAccess
            if (!$this->permissions->hasPermission($userInfo['id'], 'AdminAccess')) {
                return $this->setError("Permission insuffisante", 403);
            }
            
            // Récupérer les paramètres de pagination, recherche et tri
            $page = intval($request->getParam('page') ?? 1);
            $perPage = intval($request->getParam('perPage') ?? 10);
            $search = $request->getParam('search') ?? '';
            $sortBy = $request->getParam('sortBy') ?? 'username';
            $sortDir = $request->getParam('sortDir') ?? 'asc';
            $permissionFilter = $request->getParam('permission') ?? '';
            
            // Limiter le nombre d'éléments par page entre 5 et 100
            $perPage = max(5, min(100, $perPage));
            
            // Obtenir le nombre total d'utilisateurs et les utilisateurs de la page actuelle
            $totalUsers = $this->users->countAll($search, $permissionFilter);
            $users = $this->users->findPaginated($page, $perPage, $search, $sortBy, $sortDir, $permissionFilter);
            
            // Récupérer toutes les permissions pour le filtre
            $allPermissions = $this->getAvailablePermissions();
            
            return [
                "status" => "success", 
                "data" => [
                    "users" => $users,
                    "pagination" => [
                        "currentPage" => $page,
                        "perPage" => $perPage,
                        "totalItems" => $totalUsers,
                        "totalPages" => ceil($totalUsers / $perPage)
                    ],
                    "filters" => [
                        "search" => $search,
                        "permission" => $permissionFilter,
                        "availablePermissions" => $allPermissions
                    ],
                    "sorting" => [
                        "sortBy" => $sortBy,
                        "sortDir" => $sortDir
                    ]
                ]
            ];
        }
        
        // Récupérer un utilisateur spécifique
        if ($request->getId()) {
            // Vérifier que l'utilisateur a la permission AdminAccess
            $headers = getallheaders();
            $token = null;
            
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
                if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                    $token = $matches[1];
                }
            }
            
            if (!$token) {
                return $this->setError("Token non fourni", 401);
            }
            
            $userInfo = $this->verifyTokenAndGetUser($token);
            if (!$userInfo) {
                return $this->setError("Token invalide ou expiré", 401);
            }
            
            // Vérifier si l'utilisateur a la permission AdminAccess
            if (!$this->permissions->hasPermission($userInfo['id'], 'AdminAccess')) {
                return $this->setError("Accès refusé", 403);
            }
            
            $user = $this->users->find($request->getId());
            if (!$user) {
                return $this->setError("Utilisateur non trouvé", 404);
            }
            
            return ["status" => "success", "data" => $user];
        }
        
        return $this->setError("Opération non prise en charge", 404);
    }
    
    private function generateToken($user) {
        // Créer le payload du token
        $payload = [
            'id' => $user->getId(),
            'username' => $user->getUsername(),
            'last_ip' => $user->getLastIp(),
            'site' => $user->getSite(),
            'exp' => time() + $this->tokenExpiration // Expiration après 1 heure
        ];
        
        // Encoder en Base64
        $base64Payload = base64_encode(json_encode($payload));
        
        // Générer la signature
        $signature = hash_hmac('sha256', $base64Payload, $this->secretKey);
        
        // Construire le token
        return $base64Payload . '.' . $signature;
    }
      private function generateTokenResponse($user) {
        $token = $this->generateToken($user);
        
        // Récupérer les permissions de l'utilisateur
        $userPermissions = $this->permissions->getUserPermissions($user->getId());
        
        return [
            "status" => "success",
            "message" => "Authentification réussie",
            "token" => $token,
            "id" => $user->getId(),
            "username" => $user->getUsername(),
            "last_ip" => $user->getLastIp(),
            "site" => $user->getSite(),
            "permissions" => $userPermissions,
            "default_service_id" => $user->getDefaultServiceId(),
            "is_lock" => $user->getIsLock()
        ];
    }
    
    private function verifyToken($token) {
        try {
            if (empty($token)) {
                error_log("Token vide");
                return false;
            }
            
            $parts = explode('.', $token);
            if (count($parts) !== 2) {
                error_log("Format de token invalide");
                return false;
            }
            
            $base64Payload = $parts[0];
            $signature = $parts[1];
            
            $expectedSignature = hash_hmac('sha256', $base64Payload, $this->secretKey);
            if (!hash_equals($expectedSignature, $signature)) {
                error_log("Signature de token invalide");
                return false;
            }
            
            $jsonPayload = base64_decode($base64Payload);
            $payload = json_decode($jsonPayload, true);
            
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                error_log("Token expiré");
                return false;
            }
            
            return $payload;
        } catch (Exception $e) {
            error_log("Erreur lors de la vérification du token: " . $e->getMessage());
            return false;
        }
    }
    
     public function verifyTokenAndGetUser($token) {
        $payload = $this->verifyToken($token);
        if (!$payload || !isset($payload['id'])) {
            return false;
        }
        
        // Récupérer l'utilisateur depuis la base de données
        $user = $this->users->find($payload['id']);
        if (!$user) {
            return false;
        }
        
        // Récupérer les permissions de l'utilisateur
        $userPermissions = $this->permissions->getUserPermissions($user->getId());
          // Retourner les infos utilisateur (sans le mot de passe)
        return [
            'id' => $user->getId(),
            'username' => $user->getUsername(),
            'last_ip' => $user->getLastIp(),
            'site' => $user->getSite(),
            'permissions' => $userPermissions,
            'default_service_id' => $user->getDefaultServiceId(),
            'is_lock' => $user->getIsLock()
        ];
    }
    
    private function authenticateWithLDAP($username, $password) {
        // Vérifier que l'extension LDAP est bien activée
        if (!function_exists('ldap_connect')) {
            error_log("L'extension LDAP n'est pas activée sur ce serveur.");
            return false;
        }
        
        $ldapConn = ldap_connect($this->ldapServer);
        
        if (!$ldapConn) {
            error_log("Échec de connexion au serveur LDAP");
            return false;
        }
        
        // Définir les options LDAP
        ldap_set_option($ldapConn, LDAP_OPT_PROTOCOL_VERSION, 3);
        ldap_set_option($ldapConn, LDAP_OPT_REFERRALS, 0);
        
        // Format du DN pour la connexion
        $ldapRdn = $username . '@' . $this->ldapDomain;
        
        // Tentative d'authentification
        try {
            $bind = @ldap_bind($ldapConn, $ldapRdn, $password);
            
            if ($bind) {
                // Utilisateur authentifié avec succès
                // On peut éventuellement rechercher plus d'informations sur l'utilisateur ici
                
                ldap_unbind($ldapConn);
                return true;
            }
            
            ldap_unbind($ldapConn);
            return false;
        } catch (Exception $e) {
            error_log("Erreur LDAP: " . $e->getMessage());
            if ($ldapConn) {
                ldap_unbind($ldapConn);
            }
            return false;
        }
    }
    private function getAvailablePermissions() {
        // Vous pouvez récupérer cette liste depuis la base de données si nécessaire
        return [
            ['value' => 'AdminAccess', 'label' => 'Accès Administration'],
            ['value' => 'InformatiqueTicket', 'label' => 'Tickets Informatiques'],
            ['value' => 'TechniqueTicket', 'label' => 'Tickets Techniques'],
            ['value' => 'EconomatTicket', 'label' => 'Tickets Économat'],
            ['value' => 'view_statistics', 'label' => 'Accès aux Statistiques']
        ];
    }

protected function processPutRequest(HttpRequest $request) {
    // Vérification si l'utilisateur est authentifié
    $headers = getallheaders();
    $token = null;
    
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
        }
    }
    
    if (!$token) {
        return $this->setError("Token d'authentification requis", 401);
    }
    
    $userInfo = $this->verifyTokenAndGetUser($token);
    if (!$userInfo) {
        return $this->setError("Token invalide ou expiré", 401);
    }
    
    // Récupérer les données JSON du corps de la requête
    $jsonData = $request->getJson();
    $data = json_decode($jsonData, true);
    
    error_log("UserController::processPutRequest - Données reçues: " . json_encode($data));
    
    // Action pour mettre à jour le service par défaut
    if ($request->getId() === "default-service") {
        error_log("Traitement de la requête de mise à jour du service par défaut");
        
        if (!$data || !isset($data['serviceId'])) {
            return $this->setError("ID de service requis", 400);
        }
        
        $serviceId = $data['serviceId'];
        $userId = $userInfo['id'];
        
        error_log("Mise à jour du service par défaut pour l'utilisateur $userId avec service $serviceId");
        
        if ($this->users->updateDefaultService($userId, $serviceId)) {
            $user = $this->users->find($userId);
            error_log("Mise à jour réussie");
            return ["status" => "success", "message" => "Service par défaut mis à jour", "data" => $user];
        }
        
        error_log("Échec de la mise à jour du service par défaut");
        return $this->setError("Erreur lors de la mise à jour du service par défaut", 500);
    }
    
    // Vérifier si l'utilisateur est authentifié et a les droits
        $headers = getallheaders();
        $token = null;
        
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }
        
        if (!$token) {
            return $this->setError("Non authentifié", 401);
        }
        
        // Vérifier le token
        $userInfo = $this->verifyTokenAndGetUser($token);
        if (!$userInfo) {
            return $this->setError("Token invalide", 401);
        }
        
        // Vérifier si l'utilisateur a les droits d'administration
        if (!$this->permissions->hasPermission($userInfo['id'], 'AdminAccess')) {
            return $this->setError("Droits d'administration requis", 403);
        }          // Endpoint pour basculer le statut de verrouillage d'un utilisateur
        if ($request->getId() && $request->getParam('action') === 'toggleLock') {
            // Récupérer l'ID de l'utilisateur
            $userId = $request->getId();
              // Obtenir les données JSON
            $data = json_decode($request->getJson(), true);
            
            if (!isset($data['is_lock'])) {
                return $this->setError("Le statut de verrouillage doit être spécifié", 400);
            }
            
            // Ensure we have a proper boolean value, not empty string
            $is_lock = !empty($data['is_lock']) && $data['is_lock'] !== '' ? (bool) $data['is_lock'] : false;
            
            // Récupérer l'utilisateur
            $user = $this->users->find($userId);
            if (!$user) {
                return $this->setError("Utilisateur non trouvé", 404);
            }
              // Mettre à jour le statut de verrouillage
            $user->setIsLock($is_lock);
            $success = $this->users->update($user);
            
            if ($success) {
                // Récupérer l'utilisateur à jour depuis la BDD pour confirmer l'état
                $updatedUser = $this->users->find($userId);
                return [
                    "status" => "success",
                    "message" => "Statut de verrouillage mis à jour avec succès",
                    "data" => [
                        "id" => $updatedUser->getId(),
                        "username" => $updatedUser->getUsername(),
                        "is_lock" => $updatedUser->getIsLock()
                    ]
                ];
            }
            
            return $this->setError("Erreur lors de la mise à jour du statut de verrouillage", 500);
        }
    
    return $this->setError("Action non reconnue", 400);
}






}