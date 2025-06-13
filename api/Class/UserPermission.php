<?php

class UserPermission implements JsonSerializable {
    private $user_id;
    private $permission;
    
    public function __construct($user_id, $permission) {
        $this->user_id = $user_id;
        $this->permission = $permission;
    }
    
    public function getUserId() {
        return $this->user_id;
    }
    
    public function getPermission() {
        return $this->permission;
    }
    
    public function jsonSerialize(): array {
        return [
            'user_id' => $this->user_id,
            'permission' => $this->permission
        ];
    }
}