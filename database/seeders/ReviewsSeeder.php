<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReviewsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $reviews = [
            [
                'name' => 'John Doe',
                'comment' => 'Excellent service! My car looks brand new. Highly recommended.',
                'rating' => 5,
                'is_displayed' => 1,
                'is_verified' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Jane Smith',
                'comment' => 'The attention to detail is amazing. The staff is professional and friendly.',
                'rating' => 5,
                'is_displayed' => 1,
                'is_verified' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Michael Chen',
                'comment' => 'Best car wash in town. Fast, efficient, and great value for money.',
                'rating' => 5,
                'is_displayed' => 1,
                'is_verified' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sarah Johnson',
                'comment' => 'I love the premium service. My interior has never been cleaner!',
                'rating' => 5,
                'is_displayed' => 1,
                'is_verified' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'David Wilson',
                'comment' => 'Superb quality. They really care about the vehicles they work on.',
                'rating' => 5,
                'is_displayed' => 1,
                'is_verified' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Emily Brown',
                'comment' => 'Very satisfied with the results. Will definitely come back again.',
                'rating' => 5,
                'is_displayed' => 1,
                'is_verified' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Robert Miller',
                'comment' => 'Professional staff and top-notch equipment. Five stars!',
                'rating' => 5,
                'is_displayed' => 1,
                'is_verified' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Lisa Garcia',
                'comment' => 'Great experience from start to finish. My car shines like a diamond.',
                'rating' => 5,
                'is_displayed' => 1,
                'is_verified' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'James Taylor',
                'comment' => 'The ceramic coating they applied is fantastic. Water just beads off!',
                'rating' => 5,
                'is_displayed' => 1,
                'is_verified' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Maria Rodriguez',
                'comment' => 'Excellent customer service and very thorough cleaning. Highly impressed.',
                'rating' => 5,
                'is_displayed' => 1,
                'is_verified' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($reviews as $review) {
            DB::table('reviews')->updateOrInsert(
                ['name' => $review['name'], 'comment' => $review['comment']],
                $review
            );
        }
    }
}
