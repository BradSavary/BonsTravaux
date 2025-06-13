<?php

class User implements JsonSerializable {
   
    protected $id;
    private $username;
    private $password;
    private $last_ip;
    private $site;
    private $permissions = [];
    private $default_service_id;
    private $is_lock = false;

    public function __construct($id) {
        $this->id = $id;
    }

    public function getId() {
        return $this->id;
    }

    public function jsonSerialize(): mixed {
        return [
            'id' => $this->id,
            "username"=> $this->username,
            "password"=> null,
            "last_ip"=> $this->last_ip,
            "site"=> $this->site,
            "permissions"=>$this->permissions,
            "default_service_id" => $this->default_service_id,
            "is_lock" => $this->is_lock
        ];
    }
  
    public function getUsername(){
        return $this->username;
    }

    public function setUsername($username){
        $this->username = $username;
    }

    public function getPassword(){
        return $this->password;
    }
    
    public function setPassword($password){
        $this->password = $password;
    }

    public function getLastIp(){
        return $this->last_ip;
    }

    public function setLastIp($last_ip){
        $this->last_ip = $last_ip;
    }

    public function getSite(){
        return $this->site;
    }

    public function setSite($site){
        $this->site = $site;
    }

    public function getPermissions() {
        return $this->permissions;
    }
    
    public function setPermissions(array $permissions) {
        $this->permissions = $permissions;
        return $this;
    }
    
    public function hasPermission($permission) {
        return in_array($permission, $this->permissions);
    }
    
    public function addPermission($permission) {
        if (!in_array($permission, $this->permissions)) {
            $this->permissions[] = $permission;
        }
        return $this;
    }
    
    public function removePermission($permission) {
        $key = array_search($permission, $this->permissions);
        if ($key !== false) {
            unset($this->permissions[$key]);
            $this->permissions = array_values($this->permissions);
        }
        return $this;
    }

    public function getDefaultServiceId() {
        return $this->default_service_id;
    }

    public function setDefaultServiceId($default_service_id) {
        $this->default_service_id = $default_service_id;
        return $this;
    }
    
    public function getIsLock() {
        return $this->is_lock;
    }

    public function setIsLock($is_lock) {
        $this->is_lock = (bool)$is_lock;
        return $this;
    }
}