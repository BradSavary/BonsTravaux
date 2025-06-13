<?php

require_once "Entity.php";

class Ticket extends Entity {
    private $user_id;
    private $username;
    private $site;
    private $lieu_intervention;
    private $service_id;
    private $details;
    private $voir_avant_intervention;
    private $date_creation;
    private $statut;
    private $service_nom;
    private $service_intervenant_name;
    private $service_intervenant_id;
    private $intervenant_id;
    private $intervenant_username;
    private $category_id;
    private $category_name;
    
    public function __construct($id) {
        parent::__construct($id);
    }

    public function getId() {
        return $this->id;
    }
    
    // Getters et setters
    public function getUserId() {
        return $this->user_id;
    }
    
    public function setUserId($user_id) {
        $this->user_id = $user_id;
        return $this;
    }
    
    public function getUsername() {
        return $this->username;
    }
    
    public function setUsername($username) {
        $this->username = $username;
        return $this;
    }
    
    public function getSite() {
        return $this->site;
    }
    
    public function setSite($site) {
        $this->site = $site;
        return $this;
    }
    
    public function getServiceId() {
        return $this->service_id;
    }
    
    public function setServiceId($service_id) {
        $this->service_id = $service_id;
        return $this;
    }
    
    public function getDetails() {
        return $this->details;
    }
    
    public function setDetails($details) {
        $this->details = $details;
        return $this;
    }
    
    public function getVoirAvantIntervention() {
        return $this->voir_avant_intervention;
    }
    
    public function setVoirAvantIntervention($voir_avant_intervention) {
        $this->voir_avant_intervention = $voir_avant_intervention;
        return $this;
    }
    
    public function getDateCreation() {
        return $this->date_creation;
    }
    
    public function setDateCreation($date_creation) {
        $this->date_creation = $date_creation;
        return $this;
    }
    
    public function getStatut() {
        return $this->statut;
    }
    
    public function setStatut($statut) {
        $this->statut = $statut;
        return $this;
    }
    
    // Getters et setters pour les relations
    public function getServiceNom() {
        return $this->service_nom;
    }
    
    public function setServiceNom($service_nom) {
        $this->service_nom = $service_nom;
        return $this;
    }

    public function getLieuIntervention() {
        return $this->lieu_intervention;
    }

    public function setLieuIntervention($lieu_intervention) {
        $this->lieu_intervention = $lieu_intervention;
        return $this;
    }
    
    public function getServiceIntervenantName() {
        return $this->service_intervenant_name;
    }
    
    public function setServiceIntervenantName($service_intervenant_name) {
        $this->service_intervenant_name = $service_intervenant_name;
        return $this;
    }
    
    public function getServiceIntervenantId() {
        return $this->service_intervenant_id;
    }
    
    public function setServiceIntervenantId($service_intervenant_id) {
        $this->service_intervenant_id = $service_intervenant_id;
        return $this;
    }

    public function getIntervenantId() {
        return $this->intervenant_id;
    }
    
    public function setIntervenantId($intervenant_id) {
        $this->intervenant_id = $intervenant_id;
        return $this;
    }
    
    public function getIntervenantUsername() {
        return $this->intervenant_username;
    }
      public function setIntervenantUsername($intervenant_username) {
        $this->intervenant_username = $intervenant_username;
        return $this;
    }
    
    public function getCategoryId() {
        return $this->category_id;
    }
    
    public function setCategoryId($category_id) {
        $this->category_id = $category_id;
        return $this;
    }
    
    public function getCategoryName() {
        return $this->category_name;
    }
    
    public function setCategoryName($category_name) {
        $this->category_name = $category_name;
        return $this;
    }
    
    public function jsonSerialize(): array {
        $json = parent::jsonSerialize();
        $json['user_id'] = $this->user_id;
        $json['username'] = $this->username;
        $json['site'] = $this->site;
        $json['lieu_intervention'] = $this->lieu_intervention;
        $json['service_id'] = $this->service_id;
        $json['service_intervenant_id'] = $this->service_intervenant_id; 
        $json['details'] = $this->details;
        $json['voir_avant_intervention'] = $this->voir_avant_intervention;
        $json['date_creation'] = $this->date_creation;
        $json['statut'] = $this->statut;
        $json['intervenant_id'] = $this->intervenant_id;
        $json['intervenant_username'] = $this->intervenant_username;
          if ($this->service_nom) {
            $json['service_nom'] = $this->service_nom;
        }
        if ($this->service_intervenant_name) {
            $json['service_intervenant_name'] = $this->service_intervenant_name;
        }
        if ($this->category_id) {
            $json['category_id'] = $this->category_id;
            $json['category_name'] = $this->category_name;
        }
        
        return $json;
    }
}