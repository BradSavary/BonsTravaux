<?php

class Entity implements JsonSerializable {
   
    protected $id;

    public function __construct($id) {
        $this->id = $id;
    }

    public function jsonSerialize(): array {
        return [
            'id' => $this->id
        ];
    }
}