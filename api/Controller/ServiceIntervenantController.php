<?php

require_once "Controller.php";
require_once "Repository/ServiceIntervenantRepository.php";

class ServiceIntervenantController extends Controller {
    private ServiceIntervenantRepository $services;
    
    public function __construct() {
        $this->services = new ServiceIntervenantRepository();
    }
    
    protected function processGetRequest(HttpRequest $request) {
        // Récupérer un service par son ID
        if ($request->getId()) {
            $service = $this->services->find($request->getId());
            if ($service) {
                return ["status" => "success", "data" => $service];
            }
            return ["status" => "error", "message" => "Service intervenant non trouvé"];
        }
        
        // Récupérer tous les services
        $services = $this->services->findAll();
        return ["status" => "success", "data" => $services];
    }
    
    protected function processPostRequest(HttpRequest $request) {
        $jsonData = $request->getJson();
        $data = json_decode($jsonData, true);
        
        if (!$data || !isset($data['name'])) {
            return ["status" => "error", "message" => "Nom du service requis"];
        }
        
        $service = new ServiceIntervenant(null);
        $service->setName($data['name']);
        
        $savedService = $this->services->save($service);
        if ($savedService) {
            return ["status" => "success", "message" => "Service intervenant créé", "data" => $savedService];
        }
        
        return ["status" => "error", "message" => "Erreur lors de la création du service intervenant"];
    }
    
    protected function processPutRequest(HttpRequest $request) {
        if (!$request->getId()) {
            return ["status" => "error", "message" => "ID du service requis"];
        }
        
        $service = $this->services->find($request->getId());
        if (!$service) {
            return ["status" => "error", "message" => "Service intervenant non trouvé"];
        }
        
        $jsonData = $request->getJson();
        $data = json_decode($jsonData, true);
        
        if (!$data || !isset($data['name'])) {
            return ["status" => "error", "message" => "Nom du service requis"];
        }
        
        $service->setName($data['name']);
        
        if ($this->services->update($service)) {
            return ["status" => "success", "message" => "Service intervenant mis à jour", "data" => $service];
        }
        
        return ["status" => "error", "message" => "Erreur lors de la mise à jour du service intervenant"];
    }
    
    protected function processDeleteRequest(HttpRequest $request) {
        if (!$request->getId()) {
            return ["status" => "error", "message" => "ID du service requis"];
        }
        
        if ($this->services->delete($request->getId())) {
            return ["status" => "success", "message" => "Service intervenant supprimé"];
        }
        
        return ["status" => "error", "message" => "Erreur lors de la suppression du service intervenant"];
    }
}