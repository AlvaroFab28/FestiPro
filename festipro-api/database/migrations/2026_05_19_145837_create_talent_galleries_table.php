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
        Schema::create('talent_galleries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('talent_profile_id')->constrained('talent_profiles')->cascadeOnDelete();
            $table->string('image_url');
            
            $table->timestamp('created_at')->useCurrent(); // Solo creado_el
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('talent_galleries');
    }
};
