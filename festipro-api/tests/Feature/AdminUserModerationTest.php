<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Modules\Autenticacion\Models\User;
use Laravel\Sanctum\Sanctum;

class AdminUserModerationTest extends TestCase
{
    use RefreshDatabase;

    private $admin;
    private $regularUser;
    private $superAdmin;
    private $superAdminEmail = 'founder@festipro.com';

    protected function setUp(): void
    {
        parent::setUp();

        // Configurar la variable de entorno para el super admin
        config(['app.super_admin_email' => $this->superAdminEmail]);
        // Para que coincida con env('SUPER_ADMIN_EMAIL') en el controlador,
        // nos aseguramos de que env('SUPER_ADMIN_EMAIL') retorne este valor.
        putenv("SUPER_ADMIN_EMAIL={$this->superAdminEmail}");
        $_ENV['SUPER_ADMIN_EMAIL'] = $this->superAdminEmail;
        $_SERVER['SUPER_ADMIN_EMAIL'] = $this->superAdminEmail;

        // Crear un administrador
        $this->admin = User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'testadmin@festipro.com',
            'password' => Hash::make('password'),
            'role' => 'anfitrion',
            'is_admin' => true,
        ]);

        // Crear un usuario regular
        $this->regularUser = User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Regular User',
            'email' => 'regular@festipro.com',
            'password' => Hash::make('password'),
            'role' => 'talento',
            'is_admin' => false,
        ]);

        // Crear el Super Administrador
        $this->superAdmin = User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Super Admin User',
            'email' => $this->superAdminEmail,
            'password' => Hash::make('password'),
            'role' => 'anfitrion',
            'is_admin' => true,
        ]);
    }

    protected function tearDown(): void
    {
        // Limpiar la variable de entorno
        putenv('SUPER_ADMIN_EMAIL');
        parent::tearDown();
    }

    public function test_admin_can_ban_and_unban_a_regular_user()
    {
        Sanctum::actingAs($this->admin);

        // Banear al usuario
        $response = $this->patchJson("/api/admin/usuarios/{$this->regularUser->id}/ban");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Usuario suspendido con éxito.');

        $this->regularUser->refresh();
        $this->assertNotNull($this->regularUser->banned_at);

        // Desbanear al usuario
        $response = $this->patchJson("/api/admin/usuarios/{$this->regularUser->id}/ban");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Suspensión del usuario levantada con éxito.');

        $this->regularUser->refresh();
        $this->assertNull($this->regularUser->banned_at);
    }

    public function test_admin_cannot_ban_super_admin()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->patchJson("/api/admin/usuarios/{$this->superAdmin->id}/ban");
        $response->assertStatus(403)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'No se puede suspender al Súper Administrador.');

        $this->superAdmin->refresh();
        $this->assertNull($this->superAdmin->banned_at);
    }

    public function test_admin_can_toggle_role_of_regular_user()
    {
        Sanctum::actingAs($this->admin);

        // Convertir en administrador
        $response = $this->patchJson("/api/admin/usuarios/{$this->regularUser->id}/rol");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Rol de administrador asignado con éxito.');

        $this->regularUser->refresh();
        $this->assertTrue($this->regularUser->is_admin);

        // Quitar rol de administrador
        $response = $this->patchJson("/api/admin/usuarios/{$this->regularUser->id}/rol");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Rol de administrador revocado con éxito.');

        $this->regularUser->refresh();
        $this->assertFalse($this->regularUser->is_admin);
    }

    public function test_admin_cannot_revoke_own_role()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->patchJson("/api/admin/usuarios/{$this->admin->id}/rol");
        $response->assertStatus(403)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'No puedes revocar tu propio rol de administrador.');

        $this->admin->refresh();
        $this->assertTrue($this->admin->is_admin);
    }

    public function test_admin_cannot_ban_themselves()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->patchJson("/api/admin/usuarios/{$this->admin->id}/ban");
        $response->assertStatus(403)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'No puedes suspenderte a ti mismo.');

        $this->admin->refresh();
        $this->assertNull($this->admin->banned_at);
    }

    public function test_admin_cannot_revoke_super_admin_role()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->patchJson("/api/admin/usuarios/{$this->superAdmin->id}/rol");
        $response->assertStatus(403)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'No se puede revocar el rol de administrador al Súper Administrador.');

        $this->superAdmin->refresh();
        $this->assertTrue($this->superAdmin->is_admin);
    }

    public function test_regular_user_cannot_access_moderation_endpoints()
    {
        Sanctum::actingAs($this->regularUser);

        // Intentar banear
        $this->patchJson("/api/admin/usuarios/{$this->admin->id}/ban")
            ->assertStatus(403)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'Acceso denegado. Se requieren permisos de administrador.');

        // Intentar cambiar rol
        $this->patchJson("/api/admin/usuarios/{$this->admin->id}/rol")
            ->assertStatus(403)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'Acceso denegado. Se requieren permisos de administrador.');
    }

    public function test_banned_user_cannot_login()
    {
        // Banear al usuario regular
        $this->regularUser->banned_at = now();
        $this->regularUser->save();

        // Intentar iniciar sesión
        $response = $this->postJson('/api/login', [
            'email' => 'regular@festipro.com',
            'password' => 'password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonPath('errors.email.0', 'Tu cuenta ha sido suspendida.');
    }

    public function test_non_banned_user_can_login()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'regular@festipro.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'user',
                    'token'
                ]
            ]);
    }

    public function test_admin_user_list_contains_is_super_admin_flag()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/admin/usuarios');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertNotEmpty($data);

        foreach ($data as $user) {
            if ($user['email'] === $this->superAdminEmail) {
                $this->assertTrue($user['is_super_admin'], "Super Admin user should have is_super_admin set to true");
            } else {
                $this->assertFalse($user['is_super_admin'], "Regular user should have is_super_admin set to false");
            }
        }
    }
}

