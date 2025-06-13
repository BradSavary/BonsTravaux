<?php

require_once "Entity.php";

class ServiceIntervenant extends Entity {
    private $name;
    
    public function __construct($id) {
        parent::__construct($id);
    }
    
    public function getName() {
        return $this->name;
    }
    
    public function setName($name) {
        $this->name = $name;
        return $this;
    }

    public function getId() {
        return $this->id;
    }
    
    public function jsonSerialize(): array {
        $json = parent::jsonSerialize();
        $json['name'] = $this->name;
        return $json;
    }
}