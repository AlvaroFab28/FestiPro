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
        Schema::create('talent_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->foreignId('city_id')->constrained('cities')->restrictOnDelete();
            
            $table->string('artistic_name');
            $table->text('bio');
            $table->decimal('base_price', 10, 2)->default(0);
            $table->string('banner_url')->nullable();
            $table->string('youtube_link')->nullable();
            
            $table->boolean('is_available')->default(true);
            $table->unsignedInteger('profile_views')->default(0);
            $table->decimal('average_rating', 3, 2)->default(0);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('talent_profiles');
    }
};
