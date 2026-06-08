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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reader_id')
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->foreignId('author_id')
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->timestamps();

            // Prevent a reader from subscribing to the same author twice
            $table->unique(['reader_id', 'author_id']);

            // Indexes for fast lookup in both directions
            $table->index('reader_id');
            $table->index('author_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
