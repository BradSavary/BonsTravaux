<?php

class EmailSender {
    
    /**
     * Encode un en-tête d'email conformément à la RFC 2047
     * 
     * @param string $string La chaîne à encoder
     * @return string La chaîne encodée
     */
    private static function mimeEncodeHeader($string) {
        if (preg_match('/[\x80-\xff]/', $string)) {
            return "=?UTF-8?B?" . base64_encode($string) . "?=";
        }
        return $string;
    }
    
    /**
     * Envoie un email de test pour vérifier la configuration
     * 
     * @param string $to L'adresse email du destinataire
     * @return bool Succès ou échec de l'envoi
     */    public static function sendTestEmail($to) {
        $subject = "Test du systeme de notification par email";
        $message = "
        <html>
        <body>
            <h2>Test de configuration email</h2>
            <p>Ceci est un email de test pour vérifier que le système de notification fonctionne correctement.</p>
            <p>Si vous recevez cet email, la configuration est bonne.</p>
            <p>Date et heure d'envoi: " . date('d/m/Y H:i:s') . "</p>
        </body>
        </html>
        ";
          // Préparer les en-têtes avec MIME encoding pour les parties non-ASCII
        $senderName = self::mimeEncodeHeader("Système de Tickets");
        
        // En-têtes de l'email
        $headers = "From: $senderName <ticket@chimb.fr>\r\n";
        $headers .= "Reply-To: ticket@chimb.fr\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        
        // Encoder le sujet avec MIME encoding
        $subject = self::mimeEncodeHeader($subject);
        
        // Écrire l'email complet dans un fichier temporaire (en-têtes + message)
        $tmpFile = tempnam(sys_get_temp_dir(), 'mail_');
        $emailContent = "From: $senderName <ticket@chimb.fr>\r\n";
        $emailContent .= "To: " . $to . "\r\n";
        $emailContent .= "Subject: " . $subject . "\r\n";
        $emailContent .= "MIME-Version: 1.0\r\n";
        $emailContent .= "Content-Type: text/html; charset=UTF-8\r\n";
        $emailContent .= "Reply-To: ticket@chimb.fr\r\n\r\n";
        $emailContent .= $message;
        file_put_contents($tmpFile, $emailContent);
          // Utiliser directement sendmail avec l'option -f pour définir explicitement l'expéditeur
        // On utilise -oi pour éviter que sendmail ne s'arrête à un point seul sur une ligne
        $command = "/usr/sbin/sendmail -t -oi -f ticket@chimb.fr < " . escapeshellarg($tmpFile);
        
        // Exécuter la commande
        $result = shell_exec($command . " 2>&1");
        
        // Ajouter des logs détaillés pour le débogage
        error_log("TEST EMAIL: Commande email exécutée: " . $command);
        error_log("TEST EMAIL: Email envoyé à: " . $to);
        error_log("TEST EMAIL: Contenu du fichier email: " . substr($emailContent, 0, 500) . "...");
        
        if ($result !== null) {
            error_log("TEST EMAIL: Résultat de la commande sendmail: " . $result);
        }
        
        // Nettoyer le fichier temporaire
        @unlink($tmpFile);
        
        // Le résultat de sendmail est généralement vide si tout s'est bien passé
        if ($result === null) {
            error_log("TEST EMAIL: Email de test envoyé via sendmail à: " . $to);
            return true;
        } else {
            error_log("TEST EMAIL: Potentielle erreur lors de l'envoi du test: " . $result);
            return false;
        }
    }
    
    /**
     * Envoie un email de notification pour un nouveau ticket
     * 
     * @param string $to L'adresse email du destinataire
     * @param array $ticketData Les données du ticket
     * @return bool Succès ou échec de l'envoi
     */    public static function sendNewTicketNotification($to, $ticketData) {
        // Sujet de l'email (on prépare une version ASCII pour l'en-tête)
        $subject = "Nouveau ticket #" . $ticketData['id'] . " - " . $ticketData['service_nom'];

        // Construction du corps de l'email en HTML
        $message = "
        <html>
        <head>
            <title>Nouveau ticket créé</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 10px; border-bottom: 2px solid #dee2e6; }
                .ticket-info { margin: 20px 0; }
                .ticket-details { background-color: #f1f3f5; padding: 15px; border-radius: 4px; }
                .footer { margin-top: 30px; font-size: 12px; color: #6c757d; border-top: 1px solid #dee2e6; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>Nouveau ticket #" . $ticketData['id'] . "</h2>
                </div>
                
                <div class='ticket-info'>
                    <p>Un nouveau ticket a été créé et nécessite votre attention.</p>
                    
                    <div class='ticket-details'>
                        <p><strong>Service demandeur:</strong> " . $ticketData['service_nom'] . "</p>
                        <p><strong>Créé par:</strong> " . $ticketData['username'] . "</p>
                        <p><strong>Site:</strong> " . $ticketData['site'] . "</p>
                        <p><strong>Date de création:</strong> " . date('d/m/Y H:i', strtotime($ticketData['date_creation'])) . "</p>
                        <p><strong>Détails:</strong></p>
                        <p>" . nl2br(htmlspecialchars($ticketData['details'])) . "</p>
                    </div>
                </div>
                
                <div class='footer'>
                    <p>Cet email est envoyé automatiquement par le système de tickets. Merci de ne pas y répondre.</p>
                </div>
            </div>
        </body>
        </html>
        ";          // Préparer les en-têtes avec MIME encoding pour les parties non-ASCII
        $senderName = self::mimeEncodeHeader("Système de Tickets");
        
        // En-têtes de l'email
        $headers = "From: $senderName <ticket@chimb.fr>\r\n";
        $headers .= "Reply-To: ticket@chimb.fr\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        
        // Encoder le sujet avec MIME encoding
        $subject = self::mimeEncodeHeader($subject);
        
        // Écrire l'email complet dans un fichier temporaire (en-têtes + message)
        $tmpFile = tempnam(sys_get_temp_dir(), 'mail_');
        $emailContent = "From: $senderName <ticket@chimb.fr>\r\n"; // Placer le From en premier est important
        $emailContent .= "To: " . $to . "\r\n";
        $emailContent .= "Subject: " . $subject . "\r\n";
        $emailContent .= "MIME-Version: 1.0\r\n";
        $emailContent .= "Content-Type: text/html; charset=UTF-8\r\n";
        $emailContent .= "Reply-To: ticket@chimb.fr\r\n\r\n";
        $emailContent .= $message;
        file_put_contents($tmpFile, $emailContent);
          // Utiliser directement sendmail avec l'option -f pour définir explicitement l'expéditeur
        // On utilise -oi pour éviter que sendmail ne s'arrête à un point seul sur une ligne
        $command = "/usr/sbin/sendmail -t -oi -f ticket@chimb.fr < " . escapeshellarg($tmpFile);
          // Exécuter la commande
        $result = shell_exec($command . " 2>&1"); // Capturer également stderr pour les erreurs
        
        // Ajouter des logs détaillés pour le débogage
        error_log("Commande email exécutée: " . $command);
        error_log("Email envoyé à: " . $to);
        error_log("Contenu du fichier email: " . substr($emailContent, 0, 500) . "...");
        
        if ($result !== null) {
            error_log("Résultat de la commande sendmail: " . $result);
        }
        
        // Vérifier les permissions avec lesquelles s'exécute le script
        if (function_exists('posix_getpwuid') && function_exists('posix_geteuid')) {
            $currentUser = posix_getpwuid(posix_geteuid());
            error_log("Script exécuté en tant que: " . $currentUser['name']);
        }
        
        // Nettoyer le fichier temporaire
        @unlink($tmpFile);
        
        // Le résultat de sendmail est généralement vide si tout s'est bien passé
        if ($result === null) {
            error_log("Email de notification envoyé via sendmail à: " . $to);
            return true;
        } else {
            error_log("Potentielle erreur lors de l'envoi: " . $result);
            return false;
        }
    }
}
