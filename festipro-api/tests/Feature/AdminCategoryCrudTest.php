<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

        Storage::fake('public');
    }

    public function test_non_admin_cannot_access_category_crud_endpoints()
    {
        Sanctum::actingAs($this->regularUser);

        // Store Category
        $response = $this->postJson('/api/admin/categorias', [
            'name' => 'New Category',
            'icon' => UploadedFile::fake()->image('icon.png')
        ]);
        $response->assertStatus(403);

        // Create a dummy category first
        $category = Category::create([
            'name' => 'Dummy Category',
            'icon_url' => '/storage/categories/dummy.png',
            'is_active' => true
        ]);

        // Update Category
        $response = $this->postJson("/api/admin/categorias/{$category->id}", [
            'name' => 'Updated Name',
            'icon' => UploadedFile::fake()->image('icon2.png')
        ]);
        $response->assertStatus(403);

        // Toggle Category
        $response = $this->patchJson("/api/admin/categorias/{$category->id}/toggle");
        $response->assertStatus(403);
    }

    public function test_admin_can_create_category_with_icon()
    {
        Sanctum::actingAs($this->adminUser);

        $file = UploadedFile::fake()->image('icon.png');

        $response = $this->postJson('/api/admin/categorias', [
            'name' => 'Magos',
            'icon' => $file
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Magos');

        $category = Category::where('name', 'Magos')->first();
        $this->assertNotNull($category);
        $this->assertTrue($category->is_active);

        // Assert the file was stored
        $storedPath = str_replace('/storage/', '', $category->icon_url);
        Storage::disk('public')->assertExists($storedPath);
    }

    public function test_admin_can_update_category_name_and_icon()
    {
        Sanctum::actingAs($this->adminUser);

        // First create a category
        $file1 = UploadedFile::fake()->image('old_icon.png');
        $storeResponse = $this->postJson('/api/admin/categorias', [
            'name' => 'Acrobatas',
            'icon' => $file1
        ]);
        $category = Category::find($storeResponse->json('data.id'));
        $oldStoredPath = str_replace('/storage/', '', $category->icon_url);
        Storage::disk('public')->assertExists($oldStoredPath);

        // Now update name and change icon
        $file2 = UploadedFile::fake()->image('new_icon.png');
        
        $updateResponse = $this->postJson("/api/admin/categorias/{$category->id}", [
            'name' => 'Acrobatas y Payasos',
            'icon' => $file2
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Acrobatas y Payasos');

        $updatedCategory = Category::find($category->id);
        $newStoredPath = str_replace('/storage/', '', $updatedCategory->icon_url);

        // Verify the old file was deleted and the new one was stored
        Storage::disk('public')->assertMissing($oldStoredPath);
        Storage::disk('public')->assertExists($newStoredPath);
        $this->assertNotEquals($oldStoredPath, $newStoredPath);
    }

    public function test_admin_can_update_category_name_only_without_replacing_icon()
    {
        Sanctum::actingAs($this->adminUser);

        // First create a category
        $file = UploadedFile::fake()->image('icon.png');
        $storeResponse = $this->postJson('/api/admin/categorias', [
            'name' => 'Cantantes',
            'icon' => $file
        ]);
        $category = Category::find($storeResponse->json('data.id'));
        $oldIconUrl = $category->icon_url;

        // Now update name only
        $updateResponse = $this->postJson("/api/admin/categorias/{$category->id}", [
            'name' => 'Cantantes Solistas'
        ]);

        $updateResponse->assertStatus(200);
        
        $updatedCategory = Category::find($category->id);
        $this->assertEquals('Cantantes Solistas', $updatedCategory->name);
        $this->assertEquals($oldIconUrl, $updatedCategory->icon_url);
        
        // Verify the file still exists
        $storedPath = str_replace('/storage/', '', $oldIconUrl);
        Storage::disk('public')->assertExists($storedPath);
    }

    public function test_admin_can_toggle_category_active_state()
    {
        Sanctum::actingAs($this->adminUser);

        $category = Category::create([
            'name' => 'Malabaristas',
            'icon_url' => '/storage/categories/dummy.png',
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
}
