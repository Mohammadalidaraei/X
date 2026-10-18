<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

$request = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Ensure route parsing works reliably regardless of subdirectory deployment
// .htaccess provides the relative route in $_GET['route'] if configured
if (isset($_GET['route'])) {
    $route = rtrim($_GET['route'], '/');
} else {
    // Fallback for direct PHP built-in server (e.g., `php -S localhost:8000`)
    $path = parse_url($request, PHP_URL_PATH);
    $route = ltrim(str_replace('/api/', '/', $path), '/');
}

$input = json_decode(file_get_contents('php://input'), true);

session_start();

function getLoggedInUserId() {
    return isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
}

// Simple Router
if ($route === 'register' && $method === 'POST') {
    require_once 'AuthController.php';
    register($pdo, $input);
} elseif ($route === 'login' && $method === 'POST') {
    require_once 'AuthController.php';
    login($pdo, $input);
} elseif ($route === 'logout' && $method === 'POST') {
    session_destroy();
    echo json_encode(["message" => "Logged out successfully"]);
} elseif ($route === 'me' && $method === 'GET') {
    require_once 'AuthController.php';
    me($pdo);
} elseif ($route === 'tweets' && $method === 'GET') {
    require_once 'TweetController.php';
    getTweets($pdo);
} elseif ($route === 'tweets' && $method === 'POST') {
    require_once 'TweetController.php';
    createTweet($pdo, $input);
} else {
    http_response_code(404);
    echo json_encode(["error" => "Route not found"]);
}
