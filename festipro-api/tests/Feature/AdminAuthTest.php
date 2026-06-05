<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Modules\Autenticacion\Models\User;
use App\Global\Models\Category;
use Laravel\Sanctum\Sanctum;

class AdminAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear categorías de prueba
        DB::table('categories')->insert([
            ['id' => 1, 'name' => 'Magos', 'is_active' => true],
            ['id' => 2, 'name' => 'Payasos', 'is_active' => false],
        ]);
    }

    public function test_admin_routes_reject_unauthenticated_requests()
    {
        $this->getJson('/api/admin/usuarios')
            ->assertStatus(401);

        $this->getJson('/api/admin/categorias')
            ->assertStatus(401);
    }

    public function test_admin_routes_reject_non_admin_users()
    {
        $user = User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Regular User',
            'email' => 'regular@festipro.com',
            'password' => Hash::make('password'),
            'role' => 'talento',
            'is_admin' => false,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/admin/usuarios')
            ->assertStatus(403)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'Acceso denegado. Se requieren permisos de administrador.');

        $this->getJson('/api/admin/categorias')
            ->assertStatus(403)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'Acceso denegado. Se requieren permisos de administrador.');
    }

    public function test_admin_routes_allow_admin_users()
    {
        $admin = User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin@festipro.com',
            'password' => Hash::make('password'),
            'role' => 'anfitrion',
            'is_admin' => true,
        ]);

        Sanctum::actingAs($admin);

        // GET usuarios
        $responseUsuarios = $this->getJson('/api/admin/usuarios');
        $responseUsuarios->assertStatus(200)
            ->assertJsonPath('status', 'success');
        
        $this->assertCount(1, $responseUsuarios->json('data'));

        // GET categorias (debe devolver todas, incluyendo la inactiva)
        $responseCategorias = $this->getJson('/api/admin/categorias');
        $responseCategorias->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertCount(2, $responseCategorias->json('data'));
    }
}
