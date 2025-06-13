    /**
     * Traite la suppression d'un ticket
     * Cette méthode gère à la fois la suppression du ticket et des images associées
     */
    protected function processDeleteRequest(HttpRequest $request) {
        $user = $this->getUserFromToken($request);
        
        if (!$user) {
            return ["status" => "error", "message" => "Utilisateur non authentifié", "code" => 401];
        }
        
        $ticketId = $request->getId();
        
        if (!$ticketId) {
            return ["status" => "error", "message" => "ID du ticket non spécifié", "code" => 400];
        }
        
        // Vérifier si l'utilisateur a le droit de supprimer ce ticket
        $ticket = $this->tickets->find($ticketId);
        
        if (!$ticket) {
            return ["status" => "error", "message" => "Ticket non trouvé", "code" => 404];
        }
        
        // Vérifier si l'utilisateur est admin ou l'auteur du ticket
        $isAdmin = $this->permissions->hasPermission($user->getId(), 'AdminAccess');
        $isAuthor = $ticket->getUserId() == $user->getId();
        
        if (!$isAdmin && !$isAuthor) {
            return ["status" => "error", "message" => "Vous n'avez pas les droits pour supprimer ce ticket", "code" => 403];
        }
        
        try {
            // Supprimer d'abord les images associées
            $ticketImages = $this->images->findByTicketId($ticketId);
            
            // Supprimer les fichiers image physiques
            $imageUploadPath = "uploads/tickets/{$ticketId}/";
            if (file_exists($imageUploadPath)) {
                $files = glob($imageUploadPath . '*');
                foreach ($files as $file) {
                    if (is_file($file)) {
                        unlink($file);
                    }
                }
                // Supprimer le dossier
                rmdir($imageUploadPath);
            }
            
            // Supprimer le ticket (la suppression en cascade se fera pour les enregistrements liés)
            $result = $this->tickets->delete($ticketId);
            
            if ($result) {
                return [
                    "status" => "success", 
                    "message" => "Ticket supprimé avec succès", 
                    "data" => [
                        "ticket_id" => $ticketId,
                        "images_deleted" => count($ticketImages)
                    ]
                ];
            } else {
                return ["status" => "error", "message" => "Échec de la suppression du ticket", "code" => 500];
            }
        } catch (Exception $e) {
            error_log("Erreur lors de la suppression du ticket: " . $e->getMessage());
            return ["status" => "error", "message" => "Une erreur est survenue lors de la suppression du ticket", "code" => 500];
        }
    }
