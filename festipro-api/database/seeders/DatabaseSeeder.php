<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Sembrar Categorías Esenciales
        $categories = [
            ['name' => 'DJs', 'icon_class' => 'ph-disc', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Bandas de Rock', 'icon_class' => 'ph-guitar', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Magos', 'icon_class' => 'ph-magic-wand', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Animadores', 'icon_class' => 'ph-microphone', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Payasos', 'icon_class' => 'ph-mask-happy', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Grupos Musicales', 'icon_class' => 'ph-users-three', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ];
        DB::table('categories')->insert($categories);

        // 2. Sembrar los 9 Departamentos de Bolivia
        $departments = [
            ['id' => 1, 'name' => 'Chuquisaca'],
            ['id' => 2, 'name' => 'La Paz'],
            ['id' => 3, 'name' => 'Cochabamba'],
            ['id' => 4, 'name' => 'Oruro'],
            ['id' => 5, 'name' => 'Potosí'],
            ['id' => 6, 'name' => 'Tarija'],
            ['id' => 7, 'name' => 'Santa Cruz'],
            ['id' => 8, 'name' => 'Beni'],
            ['id' => 9, 'name' => 'Pando'],
        ];
        DB::table('departments')->insert($departments);

        // 3. Sembrar Ciudades Principales e Intermedias
        $cities = [
            ['department_id' => 1, 'name' => 'Sucre', 'is_active' => true],
            ['department_id' => 2, 'name' => 'La Paz', 'is_active' => true],
            ['department_id' => 2, 'name' => 'El Alto', 'is_active' => true],
            ['department_id' => 3, 'name' => 'Cochabamba', 'is_active' => true],
            ['department_id' => 4, 'name' => 'Oruro', 'is_active' => true],
            ['department_id' => 5, 'name' => 'Potosí', 'is_active' => true],
            ['department_id' => 6, 'name' => 'Tarija', 'is_active' => true],
            ['department_id' => 7, 'name' => 'Santa Cruz de la Sierra', 'is_active' => true],
            ['department_id' => 8, 'name' => 'Trinidad', 'is_active' => true],
            ['department_id' => 9, 'name' => 'Cobija', 'is_active' => true],
        ];
        DB::table('cities')->insert($cities);

        // 4. Sembrar el Administrador Principal
        $adminId = Str::uuid()->toString();
        DB::table('users')->insert([
            'id' => $adminId,
            'name' => 'Admin FestiPro',
            'email' => 'admin@festipro.com',
            'password' => Hash::make('admin123'),
            'role' => null,
            'is_admin' => true,
            'whatsapp_number' => '+59170000000',
            'avatar_url' => null,
            'created_at' => now()->subMonths(6),
            'updated_at' => now()->subMonths(6),
        ]);

        // ==========================================
        // Sembrado de datos realistas (5 de cada uno)
        // ==========================================
        $categoryMap = DB::table('categories')->pluck('id', 'name')->toArray();
        $cityMap = DB::table('cities')->pluck('id', 'name')->toArray();

        // 5 Anfitriones
        $hostData = [
            ['name' => 'Valeria Céspedes', 'email' => 'anfitrion1@festipro.com', 'whatsapp' => '+59172011111'],
            ['name' => 'Roberto Mamani', 'email' => 'anfitrion2@festipro.com', 'whatsapp' => '+59173022222'],
            ['name' => 'Carla Mendoza', 'email' => 'anfitrion3@festipro.com', 'whatsapp' => '+59174033333'],
            ['name' => 'Diego Fernández', 'email' => 'anfitrion4@festipro.com', 'whatsapp' => '+59175044444'],
            ['name' => 'Andrea Quispe', 'email' => 'anfitrion5@festipro.com', 'whatsapp' => '+59176055555'],
        ];

        $hosts = [];
        foreach ($hostData as $idx => $data) {
            $hostId = Str::uuid()->toString();
            $createdAt = Carbon::now()->subDays(60 - ($idx * 5));
            DB::table('users')->insert([
                'id' => $hostId,
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password123'),
                'role' => 'anfitrion',
                'is_admin' => false,
                'whatsapp_number' => $data['whatsapp'],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            $hosts[] = (object)['id' => $hostId, 'name' => $data['name']];
        }

        // 5 Talentos
        $talentData = [
            [
                'name' => 'Juan Carlos Vargas', 'email' => 'talento1@festipro.com', 'whatsapp' => '+59177111111',
                'category' => 'DJs', 'city' => 'Santa Cruz de la Sierra',
                'artistic_name' => 'DJ Flow Bolivia', 'bio' => 'DJ profesional especializado en bodas y fiestas corporativas. Más de 10 años haciendo vibrar la pista de baile con ritmos latinos, electrónicos y cumbia boliviana.',
                'price' => 1500, 'available' => true
            ],
            [
                'name' => 'María René Suarez', 'email' => 'talento2@festipro.com', 'whatsapp' => '+59177222222',
                'category' => 'Grupos Musicales', 'city' => 'La Paz',
                'artistic_name' => 'Grupo Fusión Andina', 'bio' => 'Grupo musical folklórico. Llevamos el ritmo caporal, tinku y morenada a tu evento con instrumentos de viento, charango y guitarras electroacústicas.',
                'price' => 2500, 'available' => true
            ],
            [
                'name' => 'Luis Alberto Condori', 'email' => 'talento3@festipro.com', 'whatsapp' => '+59177333333',
                'category' => 'Payasos', 'city' => 'Cochabamba',
                'artistic_name' => 'Payaso Chispita', 'bio' => 'Diversión sana y garantizada para los más pequeños. Show de globoflexia, juegos interactivos, magia cómica y concursos divertidos. ¡El alma de la fiesta infantil!',
                'price' => 500, 'available' => false
            ],
            [
                'name' => 'Jorge Lora', 'email' => 'talento4@festipro.com', 'whatsapp' => '+59177444444',
                'category' => 'Bandas de Rock', 'city' => 'Sucre',
                'artistic_name' => 'Banda Retro Capital', 'bio' => 'Los mejores clásicos del rock en español e inglés en vivo. Tributos a Soda Stereo, Enanitos Verdes, Queen y más. Sonido profesional e iluminación incluidos.',
                'price' => 3000, 'available' => true
            ],
            [
                'name' => 'Fabiola Gutiérrez', 'email' => 'talento5@festipro.com', 'whatsapp' => '+59177555555',
                'category' => 'Animadores', 'city' => 'Tarija',
                'artistic_name' => 'Fabi Animadora', 'bio' => 'Maestra de ceremonias y animadora de eventos sociales. Elegancia, carisma y protocolo para bodas, 15 años y eventos corporativos de alto nivel.',
                'price' => 800, 'available' => true
            ],
        ];

        $talents = [];
        foreach ($talentData as $idx => $data) {
            $talentId = Str::uuid()->toString();
            $createdAt = Carbon::now()->subDays(50 - ($idx * 3));
            DB::table('users')->insert([
                'id' => $talentId,
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password123'),
                'role' => 'talento',
                'is_admin' => false,
                'whatsapp_number' => $data['whatsapp'],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            $profileId = Str::uuid()->toString();
            DB::table('talent_profiles')->insert([
                'id' => $profileId,
                'user_id' => $talentId,
                'category_id' => $categoryMap[$data['category']],
                'city_id' => $cityMap[$data['city']],
                'artistic_name' => $data['artistic_name'],
                'bio' => $data['bio'],
                'base_price' => $data['price'],
                'is_available' => $data['available'],
                'profile_views' => rand(10, 100),
                'average_rating' => 0,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            $talents[] = (object)['profile_id' => $profileId, 'name' => $data['artistic_name']];
        }

        // 5 Eventos (diferentes estados y fechas)
        $eventData = [
            [
                'title' => 'Boda de Plata en Urubó', 'city' => 'Santa Cruz de la Sierra', 'category' => 'DJs',
                'host_idx' => 0, 'status' => 'cerrado', 'event_date' => Carbon::now()->subDays(10),
                'budget' => 2000, 'desc' => 'Necesitamos un DJ con experiencia en bodas, con repertorio variado desde clásicos hasta música moderna para hacer bailar a todas las edades.'
            ],
            [
                'title' => 'Fiesta de 15 años', 'city' => 'La Paz', 'category' => 'Grupos Musicales',
                'host_idx' => 1, 'status' => 'abierto', 'event_date' => Carbon::now()->addDays(5),
                'budget' => 3500, 'desc' => 'Buscamos un grupo folklórico o musical tropical para animar una fiesta de 15 años. Queremos música alegre y bailable.'
            ],
            [
                'title' => 'Cumpleaños Infantil Temático', 'city' => 'Cochabamba', 'category' => 'Payasos',
                'host_idx' => 2, 'status' => 'cancelado', 'event_date' => Carbon::now()->addDays(15),
                'budget' => 600, 'desc' => 'Cumpleaños de 5 añitos, buscamos un show de payaso con magia y juegos. Preferiblemente sin maquillaje que asuste a los niños.'
            ],
            [
                'title' => 'Aniversario de Empresa', 'city' => 'Sucre', 'category' => 'Bandas de Rock',
                'host_idx' => 3, 'status' => 'abierto', 'event_date' => Carbon::now()->addDays(30),
                'budget' => 4000, 'desc' => 'Evento corporativo de fin de año. Buscamos una banda de rock pop que toque en vivo clásicos para amenizar la cena de gala.'
            ],
            [
                'title' => 'Inauguración de Sucursal', 'city' => 'Tarija', 'category' => 'Animadores',
                'host_idx' => 4, 'status' => 'abierto', 'event_date' => Carbon::now()->addDays(2),
                'budget' => 1000, 'desc' => 'Requerimos un animador carismático para atraer al público en la inauguración de nuestra nueva tienda, que interactúe con los transeúntes.'
            ],
        ];

        foreach ($eventData as $idx => $data) {
            $createdAt = Carbon::now()->subDays(40 - ($idx * 4)); // Siempre en el pasado
            DB::table('events')->insert([
                'id' => Str::uuid()->toString(),
                'host_id' => $hosts[$data['host_idx']]->id,
                'category_id' => $categoryMap[$data['category']],
                'city_id' => $cityMap[$data['city']],
                'title' => $data['title'],
                'description' => $data['desc'],
                'event_date' => $data['event_date']->toDateString(),
                'estimated_budget' => $data['budget'],
                'status' => $data['status'],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }

        // 5 Reseñas
        for ($i = 0; $i < 5; $i++) {
            $createdAt = Carbon::now()->subDays(20 - $i);
            DB::table('reviews')->insert([
                'id' => Str::uuid()->toString(),
                'host_id' => $hosts[$i]->id,
                'talent_profile_id' => $talents[$i]->profile_id,
                'rating' => [5, 4, 5, 3, 5][$i],
                'comment' => [
                    'Excelente servicio, el DJ fue muy profesional y la música estuvo genial.',
                    'Muy buen repertorio musical, aunque llegaron un poco sobre la hora.',
                    'Los niños se divirtieron muchísimo, muy recomendado.',
                    'Buena banda, pero el sonido estuvo un poco fuerte para el local.',
                    'Animación perfecta, muy carismática y mantuvo a todos atentos.'
                ][$i],
                'created_at' => $createdAt,
            ]);
            
            DB::table('talent_profiles')
                ->where('id', $talents[$i]->profile_id)
                ->update(['average_rating' => [5, 4, 5, 3, 5][$i]]);
        }

        // Logs Administrativos (5 logs)
        $adminActions = [
            ['action' => 'Aprobar Perfil', 'details' => 'El perfil de DJ Flow Bolivia ha sido revisado y aprobado.'],
            ['action' => 'Moderar Evento', 'details' => 'Se corrigió la categoría del evento "Fiesta de 15 años".'],
            ['action' => 'Notificación Masiva', 'details' => 'Se envió correo de bienvenida a los nuevos usuarios.'],
            ['action' => 'Actualizar Categoría', 'details' => 'Se actualizó el ícono de la categoría "Grupos Musicales".'],
            ['action' => 'Revisión Manual', 'details' => 'Se revisó la denuncia sobre el evento cancelado, sin novedad.'],
        ];

        foreach ($adminActions as $idx => $log) {
            DB::table('admin_logs')->insert([
                'id' => Str::uuid()->toString(),
                'admin_id' => $adminId,
                'action' => $log['action'],
                'target_type' => 'System',
                'target_id' => null,
                'details' => $log['details'],
                'created_at' => Carbon::now()->subDays(10 - $idx),
            ]);
        }
    }
}
