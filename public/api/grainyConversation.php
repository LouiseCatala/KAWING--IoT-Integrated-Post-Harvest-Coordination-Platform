<?php
declare(strict_types=1);

function normalizeGrainyConversation(mixed $rawConversation): array {
    if (!is_array($rawConversation) || $rawConversation === [] || count($rawConversation) > 20) {
        throw new InvalidArgumentException('A valid Grainy conversation is required.');
    }
    $conversation = [];
    foreach ($rawConversation as $turn) {
        if (!is_array($turn)) continue;
        $role = (string) ($turn['role'] ?? '');
        $content = trim((string) ($turn['content'] ?? ''));
        if ($role === 'system') throw new InvalidArgumentException('System instructions are not allowed in Grainy conversations.');
        if (!in_array($role, ['user', 'assistant'], true) || $content === '') continue;
        $contentLimit = $conversation === [] && $role === 'user' ? 40000 : 6000;
        if (mb_strlen($content) > $contentLimit) $content = mb_substr($content, 0, $contentLimit);
        $conversation[] = ['role' => $role, 'content' => $content];
    }
    if ($conversation === []) throw new InvalidArgumentException('The Grainy conversation is empty.');
    return $conversation;
}
