<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('surveys', function (Blueprint $t) {
            $t->timestamp('start_at')->nullable()->after('published_at');
            $t->timestamp('end_at')->nullable()->after('start_at');
        });
    }

    public function down(): void {
        Schema::table('surveys', function (Blueprint $t) {
            $t->dropColumn(['start_at', 'end_at']);
        });
    }
};
