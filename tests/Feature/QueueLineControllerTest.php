<?php

use App\Models\QueueLine;
use App\Models\ServiceOrder;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('active queues can be fetched in correct order', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($user);

    // Create some queue lines
    $order1 = ServiceOrder::factory()->create([
        'user_id' => $user->user_id,
        'order_date' => now()->subMinutes(10),
        'order_type' => 'W',
    ]);
    $order2 = ServiceOrder::factory()->create([
        'user_id' => $user->user_id,
        'order_date' => now(),
        'order_type' => 'W',
    ]);

    $queue1 = QueueLine::create([
        'service_order_id' => $order1->service_order_id,
        'status' => 'waiting',
        'created_at' => now()->subMinutes(10), // Older
    ]);

    $queue2 = QueueLine::create([
        'service_order_id' => $order2->service_order_id,
        'status' => 'waiting',
        'created_at' => now(), // Newer
    ]);

    $response = $this->getJson('/api/queues/active');

    $response->assertStatus(200);

    // Ensure the order is by created_at ascending
    $queues = $response->json();
    expect($queues)->toHaveCount(2);
    expect($queues[0]['queue_line_id'])->toBe($queue1->queue_line_id);
    expect($queues[1]['queue_line_id'])->toBe($queue2->queue_line_id);
});
