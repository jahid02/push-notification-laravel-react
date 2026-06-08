<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();

            // Nullable: allows custom admin broadcasts without a post
            $table->foreignId('post_id')
                  ->nullable()
                  ->constrained('posts')
                  ->onDelete('set null');

            // The author or admin who triggered this notification
            $table->foreignId('sender_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->string('title', 255);
            $table->text('body');
            $table->string('image_url', 500)->nullable();

            // Extra key-value data payload for mobile clients (Flutter)
            $table->json('data')->nullable();

            // Delivery tracking counters
            $table->unsignedInteger('total_recipients')->default(0);
            $table->unsignedInteger('success_count')->default(0);
            $table->unsignedInteger('failure_count')->default(0);

            // Lifecycle status
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])
                  ->default('pending');

            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            // Indexes for history queries
            $table->index('sender_id');
            $table->index('status');
            $table->index('sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
