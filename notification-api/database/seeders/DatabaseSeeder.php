<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Administrators
        $admin = User::create([
            'name'     => 'System Admin',
            'email'    => 'admin@example.com',
            'password' => 'password123', // auto-hashed via casts
            'role'     => 'admin',
            'bio'      => 'Main administrator for the push notification system.',
        ]);

        // 2. Seed Authors
        $author1 = User::create([
            'name'     => 'Jane Doe',
            'email'    => 'author1@example.com',
            'password' => 'password123',
            'role'     => 'author',
            'bio'      => 'Writer covering backend architectures and Laravel ecosystem.',
        ]);

        $author2 = User::create([
            'name'     => 'John Smith',
            'email'    => 'author2@example.com',
            'password' => 'password123',
            'role'     => 'author',
            'bio'      => 'Frontend developer focusing on React and modern CSS.',
        ]);

        // 3. Seed Readers
        $reader1 = User::create([
            'name'     => 'Alice Johnson',
            'email'    => 'reader1@example.com',
            'password' => 'password123',
            'role'     => 'reader',
        ]);

        $reader2 = User::create([
            'name'     => 'Bob Miller',
            'email'    => 'reader2@example.com',
            'password' => 'password123',
            'role'     => 'reader',
        ]);

        $reader3 = User::create([
            'name'     => 'Charlie Davis',
            'email'    => 'reader3@example.com',
            'password' => 'password123',
            'role'     => 'reader',
        ]);

        // 4. Seed Subscriptions
        Subscription::create([
            'reader_id' => $reader1->id,
            'author_id' => $author1->id,
        ]);
        Subscription::create([
            'reader_id' => $reader1->id,
            'author_id' => $author2->id,
        ]);
        Subscription::create([
            'reader_id' => $reader2->id,
            'author_id' => $author1->id,
        ]);
        Subscription::create([
            'reader_id' => $reader3->id,
            'author_id' => $author2->id,
        ]);

        // 5. Seed Posts (we bypass event dispatcher here so that jobs don't try to send FCMs during seed)
        Post::withoutEvents(function () use ($author1, $author2) {
            Post::create([
                'author_id'    => $author1->id,
                'title'        => 'Getting Started with FCM v1 HTTP API',
                'body'         => 'Firebase Cloud Messaging (FCM) v1 is the recommended HTTP API for push notifications. In this guide, we cover project settings, OAuth2 service credentials, and constructing Android/iOS payloads.',
                'image_url'    => 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=800&auto=format&fit=crop',
                'published_at' => now()->subDays(2),
            ]);

            Post::create([
                'author_id'    => $author1->id,
                'title'        => 'Exploring Laravel 12 New Features',
                'body'         => 'Laravel 12 introduces powerful enhancements, including native type declarations, performance improvements in database queries, and optimized queue processing. Learn how to upgrade your existing APIs.',
                'image_url'    => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop',
                'published_at' => now()->subDay(),
            ]);

            Post::create([
                'author_id'    => $author2->id,
                'title'        => 'Mastering React Query for API State',
                'body'         => 'React Query simplifies data fetching, caching, and synchronization in React. We will build a dashboard page that reads from our Laravel backend, displaying real-time data with auto-refresh.',
                'image_url'    => 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop',
                'published_at' => now(),
            ]);
        });
    }
}
