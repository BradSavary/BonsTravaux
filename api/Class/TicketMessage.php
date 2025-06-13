<?php

require_once "Entity.php";

class TicketMessage extends Entity {
    private $ticket_id;
    private $user_id;
    private $username;
    private $message;
    private $timestamp;
    private $is_status_change = false;
    private $status_type = null;
    
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
    
    public function getMessage() {
        return $this->message;
    }
    
    public function setMessage($message) {
        $this->message = $message;
        return $this;
    }
    
    public function getTimestamp() {
        return $this->timestamp;
    }
    
    public function setTimestamp($timestamp) {
        $this->timestamp = $timestamp;
        return $this;
    }
      public function isStatusChange() {
        return $this->is_status_change;
    }
    
    public function setIsStatusChange($is_status_change) {
        $this->is_status_change = $is_status_change;
        return $this;
    }
    
    public function getStatusType() {
        return $this->status_type;
    }
    
    public function setStatusType($status_type) {
        $this->status_type = $status_type;
        return $this;
    }
    
    public function jsonSerialize(): array {
        $json = parent::jsonSerialize();
        $json['ticket_id'] = $this->ticket_id;
        $json['user_id'] = $this->user_id;
        $json['username'] = $this->username;
        $json['message'] = $this->message;
        $json['timestamp'] = $this->timestamp;
        $json['is_status_change'] = $this->is_status_change;
        $json['status_type'] = $this->status_type;
        return $json;
    }
}