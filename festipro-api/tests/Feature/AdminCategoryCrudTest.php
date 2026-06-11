<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Modules\Autenticacion\Models\User;
use App\Global\Models\Category;
use Laravel\Sanctum\Sanctum;

class AdminCategoryCrudTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Admin user
        $this->adminUser = User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin User',
            'email' => 'admin@festipro.com',
            'password' => Hash::make('password'),
            'role' => 'anfitrion',
            'is_admin' => true,
        ]);

        // Create Regular user
        $this->regularUser = User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Regular User',
            'email' => 'regular@festipro.com',
            'password' => Hash::make('password'),
            'role' => 'talento',
            'is_admin' => false,
        ]);
    }

    public function test_non_admin_cannot_access_category_crud_endpoints()
    {
        Sanctum::actingAs($this->regularUser);

        // Store Category
        $response = $this->postJson('/api/admin/categorias', [
            'name' => 'New Category',
            'icon_class' => 'ph-star'
        ]);
        $response->assertStatus(403);

        // Create a dummy category first
        $category = Category::create([
            'name' => 'Dummy Category',
            'icon_class' => 'ph-sparkle',
            'is_active' => true
        ]);

        // Update Category
        $response = $this->postJson("/api/admin/categorias/{$category->id}", [
            'name' => 'Updated Name',
            'icon_class' => 'ph-guitar'
        ]);
        $response->assertStatus(403);

        // Toggle Category
        $response = $this->patchJson("/api/admin/categorias/{$category->id}/toggle");
        $response->assertStatus(403);
    }

    public function test_admin_can_create_category_with_icon_class()
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/admin/categorias', [
            'name' => 'Magos',
            'icon_class' => 'ph-magic-wand'
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Magos')
            ->assertJsonPath('data.icon_class', 'ph-magic-wand');

        $category = Category::where('name', 'Magos')->first();
        $this->assertNotNull($category);
        $this->assertTrue($category->is_active);
        $this->assertEquals('ph-magic-wand', $category->icon_class);
    }

    public function test_admin_can_update_category_name_and_icon_class()
    {
        Sanctum::actingAs($this->adminUser);

        // First create a category
        $storeResponse = $this->postJson('/api/admin/categorias', [
            'name' => 'Acrobatas',
            'icon_class' => 'ph-star'
        ]);
        $category = Category::find($storeResponse->json('data.id'));

        // Now update name and change icon_class
        $updateResponse = $this->postJson("/api/admin/categorias/{$category->id}", [
            'name' => 'Acrobatas y Payasos',
            'icon_class' => 'ph-mask-happy'
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Acrobatas y Payasos')
            ->assertJsonPath('data.icon_class', 'ph-mask-happy');

        $updatedCategory = Category::find($category->id);
        $this->assertEquals('Acrobatas y Payasos', $updatedCategory->name);
        $this->assertEquals('ph-mask-happy', $updatedCategory->icon_class);
    }

    public function test_admin_can_toggle_category_active_state()
    {
        Sanctum::actingAs($this->adminUser);

        $category = Category::create([
            'name' => 'Malabaristas',
            'icon_class' => 'ph-star',
            'is_active' => true
        ]);

        // Toggle to inactive (false)
        $response = $this->patchJson("/api/admin/categorias/{$category->id}/toggle");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.is_active', false);

        $this->assertFalse(Category::find($category->id)->is_active);

        // Toggle back to active (true)
        $response = $this->patchJson("/api/admin/categorias/{$category->id}/toggle");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.is_active', true);

        $this->assertTrue(Category::find($category->id)->is_active);
    }

    public function test_admin_can_delete_category()
    {
        Sanctum::actingAs($this->adminUser);

        $category = Category::create([
            'name' => 'Malabaristas',
            'icon_class' => 'ph-star',
            'is_active' => true
        ]);

        $response = $this->deleteJson("/api/admin/categorias/{$category->id}");
        $response->assertStatus(200);

        $this->assertNull(Category::find($category->id));
    }
}
