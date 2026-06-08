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
        Schema::create('notification_recipients', function (Blueprint $table) {
            $table->id();

            $table->foreignId('notification_id')
                  ->constrained('notifications')
                  ->onDelete('cascade');

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->foreignId('device_token_id')
                  ->constrained('device_tokens')
                  ->onDelete('cascade');

            // Per-device delivery status
            $table->enum('status', ['pending', 'sent', 'failed'])->default('pending');

            // FCM message ID returned from the FCM API on success
            $table->string('fcm_message_id')->nullable();

            // Error detail returned from FCM on failure
            $table->text('error_message')->nullable();

            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            // Indexes for fast lookups and reporting
            $table->index('notification_id');
            $table->index('user_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_recipients');
    }
};
