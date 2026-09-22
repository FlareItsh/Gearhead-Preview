<?php

use Inertia\Testing\AssertableInertia as Assert;

test('landing page loads successfully and renders welcome page', function () {
    $response = $this->get('/');

    $response->assertStatus(200)
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
        );
});
