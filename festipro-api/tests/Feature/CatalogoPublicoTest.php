<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Modules\Autenticacion\Models\User;
use App\Modules\Talento\Models\TalentProfile;
use App\Modules\Anfitrion\Models\Event;
use App\Global\Models\Category;
use App\Global\Models\City;

class CatalogoPublicoTest extends TestCase
{
    use RefreshDatabase;

    private $category1;
    private $category2;
    private $city1;
    private $city2;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Crear Departamentos en BD
        DB::table('departments')->insert([
            ['id' => 1, 'name' => 'La Paz']
        ]);

        // 2. Crear Ciudades en BD
        DB::table('cities')->insert([
            ['id' => 1, 'department_id' => 1, 'name' => 'La Paz', 'is_active' => true],
            ['id' => 2, 'department_id' => 1, 'name' => 'El Alto', 'is_active' => true]
        ]);

        $this->city1 = City::find(1);
        $this->city2 = City::find(2);

        // 3. Crear Categorías en BD
        DB::table('categories')->insert([
            ['id' => 1, 'name' => 'DJs', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'Bandas de Rock', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]
        ]);

        $this->category1 = Category::find(1);
        $this->category2 = Category::find(2);
    }

    /**
     * Test: Listar talentos con filtros dinámicos y paginación.
     */
    public function test_listar_talentos_con_filtros_y_paginacion()
    {
        // Crear Usuarios y Perfiles
        $user1 = User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Juan Perez',
            'email' => 'juan@perez.com',
            'password' => Hash::make('password'),
            'role' => 'talento',
        ]);
        $profile1 = TalentProfile::create([
            'user_id' => $user1->id,
            'category_id' => $this->category1->id,
            'city_id' => $this->city1->id,
            'artistic_name' => 'DJ Juan',
            'bio' => 'La mejor música electrónica',
            'base_price' => 1500.00,
            'is_available' => true,
        ]);

        $user2 = User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Pedro Gomez',
            'email' => 'pedro@gomez.com',
            'password' => Hash::make('password'),
            'role' => 'talento',
        ]);
        $profile2 = TalentProfile::create([
            'user_id' => $user2->id,
            'category_id' => $this->category2->id,
            'city_id' => $this->city2->id,
            'artistic_name' => 'Pedro Rock',
            'bio' => 'Band de rock clasico boliviano',
            'base_price' => 3000.00,
            'is_available' => true,
        ]);

        // Talento no disponible (Debe ser excluido de la lista)
        $user3 = User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Rene Oculto',
            'email' => 'rene@oculto.com',
            'password' => Hash::make('password'),
            'role' => 'talento',
        ]);
        $profile3 = TalentProfile::create([
            'user_id' => $user3->id,
            'category_id' => $this->category1->id,
            'city_id' => $this->city1->id,
            'artistic_name' => 'DJ Oculto',
            'bio' => 'No disponible',
            'base_price' => 1000.00,
            'is_available' => false,
        ]);

        // 1. Obtener todos los talentos (sin filtros)
        $response = $this->getJson('/api/talentos');
        $response->assertStatus(200)
                 ->assertJsonStructure(['status', 'message', 'data' => ['data', 'current_page', 'total']])
                 ->assertJsonCount(2, 'data.data'); // Solo DJ Juan y Pedro Rock

        // 2. Filtrar por categoría
        $response = $this->getJson('/api/talentos?categoria=' . $this->category1->id);
        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data.data')
                 ->assertJsonPath('data.data.0.artistic_name', 'DJ Juan');

        // 3. Filtrar por ciudad
        $response = $this->getJson('/api/talentos?ciudad=' . $this->city2->id);
        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data.data')
                 ->assertJsonPath('data.data.0.artistic_name', 'Pedro Rock');

        // 4. Filtrar por búsqueda de texto
        $response = $this->getJson('/api/talentos?q=rock');
        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data.data')
                 ->assertJsonPath('data.data.0.artistic_name', 'Pedro Rock');

        // 5. Filtrar por rango de precio
        $response = $this->getJson('/api/talentos?precio_min=1000&precio_max=2000');
        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data.data')
                 ->assertJsonPath('data.data.0.artistic_name', 'DJ Juan');
    }

    /**
     * Test: Obtener perfil individual y validar incremento de contador de vistas.
     */
    public function test_obtener_perfil_publico_individual_y_aumentar_vistas()
    {
        $user = User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Carlos Gomez',
            'email' => 'carlos@gomez.com',
            'password' => Hash::make('password'),
            'role' => 'talento',
        ]);
        $profile = TalentProfile::create([
            'user_id' => $user->id,
            'category_id' => $this->category1->id,
            'city_id' => $this->city1->id,
            'artistic_name' => 'Carlos Metal',
            'bio' => 'Heavy Metal boliviano',
            'base_price' => 2000.00,
            'is_available' => true,
            'profile_views' => 10,
        ]);

        // Consultar el perfil
        $response = $this->getJson('/api/talentos/' . $profile->id);
        $response->assertStatus(200)
                 ->assertJsonPath('data.artistic_name', 'Carlos Metal')
                 ->assertJsonPath('data.profile_views', 11); // Incrementado en 1 de 10 a 11 en el objeto devuelto

        // Consultar de nuevo en la base de datos para verificar persistencia
        $this->assertEquals(11, TalentProfile::find($profile->id)->profile_views);

        // Probar obtener por user_id
        $response = $this->getJson('/api/talentos/' . $user->id);
        $response->assertStatus(200)
                 ->assertJsonPath('data.artistic_name', 'Carlos Metal')
                 ->assertJsonPath('data.profile_views', 12); // Incrementado en 1 más (11 a 12)
    }

    /**
     * Test: Listar eventos excluyendo cerrados o cancelados y aplicando filtros.
     */
    public function test_listar_eventos_excluyendo_no_abiertos()
    {
        $host = User::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Anfitrion Uno',
            'email' => 'host@uno.com',
            'password' => Hash::make('password'),
            'role' => 'anfitrion',
        ]);

        // Evento Abierto
        $event1 = Event::create([
            'host_id' => $host->id,
            'category_id' => $this->category1->id,
            'city_id' => $this->city1->id,
            'title' => 'Boda Rockera',
            'description' => 'Buscamos una banda para boda',
            'event_date' => now()->addDays(10)->toDateString(),
            'estimated_budget' => 5000.00,
            'status' => 'abierto',
        ]);

        // Evento Cerrado (Excluido)
        $event2 = Event::create([
            'host_id' => $host->id,
            'category_id' => $this->category1->id,
            'city_id' => $this->city1->id,
            'title' => 'Fiesta Privada Cerrada',
            'description' => 'Fiesta de cumpleaños',
            'event_date' => now()->addDays(5)->toDateString(),
            'estimated_budget' => 1500.00,
            'status' => 'cerrado',
        ]);

        // Evento Cancelado (Excluido)
        $event3 = Event::create([
            'host_id' => $host->id,
            'category_id' => $this->category2->id,
            'city_id' => $this->city2->id,
            'title' => 'Concierto de Metal Cancelado',
            'description' => 'Cancelado por lluvia',
            'event_date' => now()->addDays(12)->toDateString(),
            'estimated_budget' => 8000.00,
            'status' => 'cancelado',
        ]);

        // 1. Obtener eventos (solo abiertos)
        $response = $this->getJson('/api/eventos');
        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data.data')
                 ->assertJsonPath('data.data.0.title', 'Boda Rockera');

        // 2. Filtrar por categoría del evento abierto
        $response = $this->getJson('/api/eventos?categoria=' . $this->category1->id);
        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data.data');

        // 3. Filtrar por búsqueda de texto
        $response = $this->getJson('/api/eventos?q=Boda');
        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data.data');
    }
}
