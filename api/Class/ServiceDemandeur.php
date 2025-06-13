<?php

require_once "Entity.php";

class ServiceDemandeur extends Entity {
    private $nom;
    
    public function __construct($id) {
        parent::__construct($id);
    }
    
    public function getNom() {
        return $this->nom;
    }
    
    public function setNom($nom) {
        $this->nom = $nom;
        return $this;
    }
    
    public function jsonSerialize(): array {
        $json = parent::jsonSerialize();
        $json['nom'] = $this->nom;
        return $json;
    }
}