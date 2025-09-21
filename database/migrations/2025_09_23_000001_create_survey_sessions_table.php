<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('survey_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->json('answers_json')->nullable();
            $table->json('meta_json')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['survey_id', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_sessions');
    }
};
