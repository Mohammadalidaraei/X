<?php

function getTweets($pdo) {
    $stmt = $pdo->query("
        SELECT t.id, t.content, t.created_at, u.username, u.full_name, u.avatar_url
        FROM tweets t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
        LIMIT 50
    ");
    $tweets = $stmt->fetchAll();
    echo json_encode($tweets);
}

function createTweet($pdo, $input) {
    $userId = getLoggedInUserId();
    if (!$userId) {
        http_response_code(401);
        echo json_encode(["error" => "Unauthorized"]);
        return;
    }

    if (!isset($input['content']) || trim($input['content']) === '') {
        http_response_code(400);
        echo json_encode(["error" => "Tweet content cannot be empty"]);
        return;
    }

    $stmt = $pdo->prepare("INSERT INTO tweets (user_id, content) VALUES (?, ?)");
    try {
        $stmt->execute([$userId, $input['content']]);
        $tweetId = $pdo->lastInsertId();

        // Fetch the newly created tweet to return it
        $stmt = $pdo->prepare("
            SELECT t.id, t.content, t.created_at, u.username, u.full_name, u.avatar_url
            FROM tweets t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ?
        ");
        $stmt->execute([$tweetId]);
        $tweet = $stmt->fetch();

        http_response_code(201);
        echo json_encode($tweet);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to create tweet"]);
    }
}
