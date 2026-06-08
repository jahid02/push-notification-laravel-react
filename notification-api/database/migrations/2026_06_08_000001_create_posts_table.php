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
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->string('title', 255);
            $table->text('body');
            $table->string('image_url', 500)->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            // Index for listing posts by author efficiently
            $table->index('author_id');
            $table->index('published_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
