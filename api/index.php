<?php

ini_set('display_errors', 1);
ini_set('max_execution_time', 120);

require_once "Class/HttpRequest.php";
require_once "Controller/UserController.php";
require_once "Controller/ServiceDemandeurController.php";
require_once "Controller/TicketController.php";
require_once "Controller/ServiceIntervenantController.php";
require_once "Controller/PermissionController.php";
require_once "Controller/TicketMessageController.php";
require_once "Controller/NotificationEmailController.php";
require_once "Controller/TicketCategoryController.php";
require_once "Controller/TicketImageController.php";
require_once "Controller/StatisticsController.php";

// objet HttpRequest qui contient toutes les infos utiles sur la requêtes (voir class/HttpRequest.php)
$request = new HttpRequest();

/**
 *  $router est notre "routeur" rudimentaire.
 * 
 *  C'est un tableau associatif qui associe à chaque nom de ressource 
 *  le Controller en charge de traiter la requête.
 *  Ici ProductController est le controleur qui traitera toutes les requêtes ciblant la ressource "products"
 *  On ajoutera des "routes" à $router si l'on a d'autres ressource à traiter.
 */
$router = [
    "user" => new UserController(),
    "services" => new ServiceDemandeurController(),
    "tickets" => new TicketController(),
    "service-intervenants" => new ServiceIntervenantController(),
    "permissions" => new PermissionController(),
    "ticket-messages" => new TicketMessageController(),
    "notification-emails" => new NotificationEmailController(),
    "ticket-categories" => new TicketCategoryController(),
    "ticket-images" => new TicketImageController(),
    "statistics" => new StatisticsController(),
];

// on récupère la ressource ciblée par la requête
$route = $request->getRessources();

// Route spéciale pour servir les images
if ($route === "ticketimage" && $request->getId() === "serve" && isset($_GET['id'])) {
    $imageController = new TicketImageController();
    $imageController->serveImage($_GET['id']);
    die();
}

if ( isset($router[$route]) ){ // si on a un controleur pour cette ressource
    $ctrl = $router[$route];  // on le récupère
    $json = $ctrl->jsonResponse($request); // et on invoque jsonResponse pour obtenir la réponse (json) à la requête (voir class/Controller.php et ProductController.php)
    if ($json){ 
        header("Content-type: application/json;charset=utf-8");
        echo $json;
    }
    else{
        http_response_code(404); // en cas de problème pour produire la réponse, on retourne un 404
    }
    die();
}
http_response_code(404); // si on a pas de controlleur pour traiter la requête -> 404
die();

?>