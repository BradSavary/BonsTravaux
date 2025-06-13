<?php

require_once "Entity.php";

class TicketImage extends Entity {
    private $ticket_id;
    private $user_id;
    private $username;
    private $filename;
    private $original_name;
    private $mime_type;
    private $file_size;
    private $created_at;
    private $in_message;
    private $message_id;
    
    public function __construct($id) {
        parent::__construct($id);
    }

    public function getId() {
        return $this->id;
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
    
    public function getFilename() {
        return $this->filename;
    }
    
    public function setFilename($filename) {
        $this->filename = $filename;
        return $this;
    }
    
    public function getOriginalName() {
        return $this->original_name;
    }
    
    public function setOriginalName($original_name) {
        $this->original_name = $original_name;
        return $this;
    }
    
    public function getMimeType() {
        return $this->mime_type;
    }
    
    public function setMimeType($mime_type) {
        $this->mime_type = $mime_type;
        return $this;
    }
    
    public function getFileSize() {
        return $this->file_size;
    }
    
    public function setFileSize($file_size) {
        $this->file_size = $file_size;
        return $this;
    }
    
    public function getCreatedAt() {
        return $this->created_at;
    }
    
    public function setCreatedAt($created_at) {
        $this->created_at = $created_at;
        return $this;
    }
    
    public function isInMessage() {
        return $this->in_message;
    }
    
    public function setInMessage($in_message) {
        $this->in_message = $in_message ? 1 : 0;
        return $this;
    }
    
    public function getMessageId() {
        return $this->message_id;
    }
    
    public function setMessageId($message_id) {
        $this->message_id = $message_id;
        return $this;
    }
    
    public function jsonSerialize(): array {
        $json = parent::jsonSerialize();
        $json['ticket_id'] = $this->ticket_id;
        $json['user_id'] = $this->user_id;
        $json['username'] = $this->username;
        $json['filename'] = $this->filename;
        $json['original_name'] = $this->original_name;
        $json['mime_type'] = $this->mime_type;
        $json['file_size'] = $this->file_size;
        $json['created_at'] = $this->created_at;
        $json['in_message'] = $this->in_message;
        $json['message_id'] = $this->message_id;
        return $json;
    }
}
