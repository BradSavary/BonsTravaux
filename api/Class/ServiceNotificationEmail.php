<?php

require_once "Entity.php";

class ServiceNotificationEmail extends Entity {
    private $service_id;
    private $permission_type;
    private $email;
    private $enabled;
    private $service_name; // Pour afficher le nom du service (pas stocké en BDD)
    
    public function __construct($id) {
        parent::__construct($id);
        $this->enabled = true;
    }

    public function getId() {
        return $this->id;
    }
    
    public function getServiceId() {
        return $this->service_id;
    }
    
    public function setServiceId($service_id) {
        $this->service_id = $service_id;
        return $this;
    }
    
    public function getPermissionType() {
        return $this->permission_type;
    }
    
    public function setPermissionType($permission_type) {
        $this->permission_type = $permission_type;
        return $this;
    }
    
    public function getEmail() {
        return $this->email;
    }
    
    public function setEmail($email) {
        $this->email = $email;
        return $this;
    }
    
    public function isEnabled() {
        return (bool)$this->enabled;
    }
    
    public function setEnabled($enabled) {
        $this->enabled = (bool)$enabled;
        return $this;
    }
    
    public function getServiceName() {
        return $this->service_name;
    }
    
    public function setServiceName($service_name) {
        $this->service_name = $service_name;
        return $this;
    }
    
    public function jsonSerialize(): array {
        $json = parent::jsonSerialize();
        $json['service_id'] = $this->service_id;
        $json['permission_type'] = $this->permission_type;
        $json['email'] = $this->email;
        $json['enabled'] = $this->enabled;
        
        // Ajouter le nom du service s'il est disponible
        if ($this->service_name) {
            $json['service_name'] = $this->service_name;
        }
        
        return $json;
    }
}
