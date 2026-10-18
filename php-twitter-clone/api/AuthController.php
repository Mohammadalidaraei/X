<?php

function register($pdo, $input) {
    if (!isset($input['username'], $input['email'], $input['password'], $input['full_name'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields"]);
        return;
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$input['username'], $input['email']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Username or email already exists"]);
        return;
    }

    $hash = password_hash($input['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)");

    try {
        $stmt->execute([$input['username'], $input['email'], $hash, $input['full_name']]);
        http_response_code(201);
        echo json_encode(["message" => "User registered successfully"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to register user"]);
    }
}

function login($pdo, $input) {
    if (!isset($input['username'], $input['password'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing username or password"]);
        return;
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$input['username']]);
    $user = $stmt->fetch();

    if ($user && password_verify($input['password'], $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        echo json_encode([
            "message" => "Login successful",
            "user" => [
                "id" => $user['id'],
                "username" => $user['username'],
                "full_name" => $user['full_name'],
                "avatar_url" => $user['avatar_url']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Invalid credentials"]);
    }
}

function me($pdo) {
    $userId = getLoggedInUserId();
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["error" => "Unauthorized"]);
        return;
    }

    $stmt = $pdo->prepare("SELECT id, username, email, full_name, avatar_url, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if ($user) {
        echo json_encode($user);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "User not found"]);
    }
}
