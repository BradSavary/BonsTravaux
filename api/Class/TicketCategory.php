<?php

require_once "Entity.php";

class TicketCategory extends Entity {
    private $name;
    private $service_id;
    private $created_at;
    
    public function __construct($id) {
        parent::__construct($id);
    }
    
    public function getId() {
        return $this->id;
    }
    
    public function getName() {
        return $this->name;
    }
    
    public function setName($name) {
        $this->name = $name;
        return $this;
    }
    
    public function getServiceId() {
        return $this->service_id;
    }
    
    public function setServiceId($service_id) {
        $this->service_id = $service_id;
        return $this;
    }
    
    public function getCreatedAt() {
        return $this->created_at;
    }
    
    public function setCreatedAt($created_at) {
        $this->created_at = $created_at;
        return $this;
    }
    
    public function jsonSerialize(): array {
        $json = parent::jsonSerialize();
        $json['name'] = $this->name;
        $json['service_id'] = $this->service_id;
        $json['created_at'] = $this->created_at;
        return $json;
    }
}