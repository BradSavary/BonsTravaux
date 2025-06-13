<?php

require_once "Entity.php";

class TicketStatusHistory extends Entity {
    private $ticket_id;
    private $user_id;
    private $username;
    private $old_status;
    private $new_status;
    private $date_changement;
    private $transferred_to_service_id;
    private $transfer_type;
    private $service_name;
    private $intervenant_id;
    private $intervenant_username;
    
    public function __construct($id) {
        parent::__construct($id);
    }
    
    public function getTicketId() {
        return $this->ticket_id;
    }
    
    public function setTicketId($ticket_id) {
        $this->ticket_id = $ticket_id;
        return $this;
    }
    
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
    
    public function getOldStatus() {
        return $this->old_status;
    }
    
    public function setOldStatus($old_status) {
        $this->old_status = $old_status;
        return $this;
    }
    
    public function getNewStatus() {
        return $this->new_status;
    }
    
    public function setNewStatus($new_status) {
        $this->new_status = $new_status;
        return $this;
    }
    
    public function getDateChangement() {
        return $this->date_changement;
    }
    
    public function setDateChangement($date_changement) {
        $this->date_changement = $date_changement;
        return $this;
    }

    public function getTransferredToServiceId() {
    return $this->transferred_to_service_id;
    }

    public function setTransferredToServiceId($transferred_to_service_id) {
        $this->transferred_to_service_id = $transferred_to_service_id;
        return $this;
    }

    public function getTransferType() {
        return $this->transfer_type;
    }

    public function setTransferType($transfer_type) {
        $this->transfer_type = $transfer_type;
        return $this;
    }

    public function getServiceName() {
        return $this->service_name;
    }    public function setServiceName($service_name) {
        $this->service_name = $service_name;
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
    public function jsonSerialize(): array {
    $json = parent::jsonSerialize();
    $json['ticket_id'] = $this->ticket_id;
    $json['user_id'] = $this->user_id;
    $json['username'] = $this->username;
    $json['old_status'] = $this->old_status;
    $json['new_status'] = $this->new_status;
    $json['date_changement'] = $this->date_changement;
    $json['transferred_to_service_id'] = $this->transferred_to_service_id;
    $json['transfer_type'] = $this->transfer_type;
    $json['service_name'] = $this->service_name;
    $json['intervenant_id'] = $this->intervenant_id;
    $json['intervenant_username'] = $this->intervenant_username;
    return $json;
}
}