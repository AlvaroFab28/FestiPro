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
            // Chuquisaca
            ['department_id' => 1, 'name' => 'Sucre', 'is_active' => true],
            ['department_id' => 1, 'name' => 'Monteagudo', 'is_active' => true],
            ['department_id' => 1, 'name' => 'Camargo', 'is_active' => true],
            ['department_id' => 1, 'name' => 'Padilla', 'is_active' => true],
            // La Paz
            ['department_id' => 2, 'name' => 'La Paz', 'is_active' => true],
            ['department_id' => 2, 'name' => 'El Alto', 'is_active' => true],
            ['department_id' => 2, 'name' => 'Viacha', 'is_active' => true],
            ['department_id' => 2, 'name' => 'Caranavi', 'is_active' => true],
            // Cochabamba
            ['department_id' => 3, 'name' => 'Cochabamba', 'is_active' => true],
            ['department_id' => 3, 'name' => 'Quillacollo', 'is_active' => true],
            ['department_id' => 3, 'name' => 'Sacaba', 'is_active' => true],
            ['department_id' => 3, 'name' => 'Punata', 'is_active' => true],
            // Oruro
            ['department_id' => 4, 'name' => 'Oruro', 'is_active' => true],
            ['department_id' => 4, 'name' => 'Huanuni', 'is_active' => true],
            ['department_id' => 4, 'name' => 'Challapata', 'is_active' => true],
            // Potosí
            ['department_id' => 5, 'name' => 'Potosí', 'is_active' => true],
            ['department_id' => 5, 'name' => 'Uyuni', 'is_active' => true],
            ['department_id' => 5, 'name' => 'Tupiza', 'is_active' => true],
            ['department_id' => 5, 'name' => 'Villazón', 'is_active' => true],
            // Tarija
            ['department_id' => 6, 'name' => 'Tarija', 'is_active' => true],
            ['department_id' => 6, 'name' => 'Yacuiba', 'is_active' => true],
            ['department_id' => 6, 'name' => 'Bermejo', 'is_active' => true],
            ['department_id' => 6, 'name' => 'Villa Montes', 'is_active' => true],
            // Santa Cruz
            ['department_id' => 7, 'name' => 'Santa Cruz de la Sierra', 'is_active' => true],
            ['department_id' => 7, 'name' => 'Montero', 'is_active' => true],
            ['department_id' => 7, 'name' => 'Warnes', 'is_active' => true],
            ['department_id' => 7, 'name' => 'Cotoca', 'is_active' => true],
            // Beni
            ['department_id' => 8, 'name' => 'Trinidad', 'is_active' => true],
            ['department_id' => 8, 'name' => 'Riberalta', 'is_active' => true],
            ['department_id' => 8, 'name' => 'Guayaramerín', 'is_active' => true],
            // Pando
            ['department_id' => 9, 'name' => 'Cobija', 'is_active' => true],
            ['department_id' => 9, 'name' => 'Porvenir', 'is_active' => true],
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
        // Sembrado de datos masivos (Bolivia)
        // ==========================================

        // Obtener IDs de categorías y ciudades sembradas
        $categoryIds = DB::table('categories')->pluck('id')->toArray();
        $categoryMap = DB::table('categories')->pluck('name', 'id')->toArray();
        $cityIds = DB::table('cities')->pluck('id')->toArray();

        // Nombres y Apellidos comunes en Bolivia
        $firstNames = ['Juan', 'Pedro', 'Carlos', 'Luis', 'Miguel', 'José', 'David', 'Jorge', 'Alejandro', 'Fernando', 'Ana', 'María', 'Elizabeth', 'Gabriela', 'Patricia', 'Claudia', 'Sandra', 'Roxana', 'Camila', 'Sofía'];
        $lastNames = ['Mamani', 'Quispe', 'Choque', 'Flores', 'Condori', 'Rodriguez', 'Gomez', 'Fernandez', 'Lopez', 'Vargas', 'Guzman', 'Rojas', 'Zarate', 'Cardozo', 'Mendoza', 'Gutierrez', 'Sosa', 'Cruz', 'Perez', 'Chavez'];

        // Datos para bios según categoría
        $biosByCategory = [
            'DJs' => [
                'DJ profesional con más de 5 años de experiencia animando discotecas y eventos privados. Especialista en música latina, reggaetón y electro pop.',
                'Apasionado por mezclar ritmos retro y modernos. Llevo la mejor calidad de sonido y show de luces para que tu fiesta sea inolvidable.',
                'DJ productor especializado en bodas y quinceañeros. Amplio repertorio musical de todas las épocas para hacer bailar a todas las generaciones.'
            ],
            'Bandas de Rock' => [
                'Banda de rock alternativo cover. Tocamos los mejores éxitos del rock en español y en inglés de los 80, 90 y 2000 en vivo.',
                'Grupo tributo al rock clásico. Energía pura en el escenario con guitarra eléctrica, bajo, batería y voz líder. Ideal para pubs y fiestas privadas.',
                'Rock pop latino con arreglos propios. Llevamos toda la infraestructura acústica y técnica para un show en vivo potente y profesional.'
            ],
            'Magos' => [
                'Mago e ilusionista profesional. Shows familiares y corporativos con magia de cerca e ilusionismo de escenario adaptado para todo público.',
                'Llevo misterio y humor a tu evento. Magia interactiva donde los invitados son los protagonistas de los trucos de cartas, desapariciones y mentalismo.',
                'Espectáculo de magia infantil y de salón. Divertido, asombroso y totalmente seguro para cumpleaños y aniversarios.'
            ],
            'Animadores' => [
                'Animador y maestro de ceremonias profesional. Dinamismo, elegancia y excelente modulación de voz para dirigir bodas, corporativos y festivales.',
                'Especialista en animación de eventos infantiles, baby showers y activaciones de marca. Juegos interactivos y dinámicas de grupo divertidas.',
                'Conductor de eventos masivos con carisma único. Hago que tu público se conecte y disfrute al máximo de principio a fin.'
            ],
            'Payasos' => [
                'Payaso profesional con shows de globoflexia, malabares y chistes sanos para toda la familia. Diversión garantizada sin burlas.',
                'Show de payasitos musicales con magia cómica, concursos divertidos y premios para los niños. Llevamos sonido propio.',
                'Payaso y mimo especializado en fiestas de cumpleaños. Dinámicas infantiles tiernas y muy divertidas para los más pequeños.'
            ],
            'Grupos Musicales' => [
                'Grupo folklórico boliviano. Tocamos caporales, tinkus, cuecas y salay con instrumentos tradicionales en vivo (charango, quena, zampoña).',
                'Orquesta de cumbia y música tropical para bodas y aniversarios. Repertorio bailable con vientos metal, percusión y voces espectaculares.',
                'Mariachi profesional de música mexicana tradicional. Trajes típicos, trompetas y violines para serenatas, cumpleaños y reconciliaciones.'
            ]
        ];

        // Nombres artísticos según categoría
        $artisticPrefixes = [
            'DJs' => ['DJ ', 'DeeJay ', 'Mixmaster ', 'Beatmaker '],
            'Bandas de Rock' => ['Los ', 'Grupo ', 'Banda ', 'Proyecto '],
            'Magos' => ['Mago ', 'El Gran ', 'Ilusionista ', 'Mister '],
            'Animadores' => ['Animador ', 'MC ', 'Showman ', 'Presentador '],
            'Payasos' => ['Payaso ', 'Payasita ', 'Clown ', 'Show de '],
            'Grupos Musicales' => ['Grupo ', 'Orquesta ', 'Mariachi ', 'Los ']
        ];

        $artisticRoots = [
            'DJs' => ['Wilmer', 'Carlitos', 'Fuego', 'Flow', 'Neon', 'Eclipse', 'BASS', 'Impacto', 'Bolivia'],
            'Bandas de Rock' => ['Eclipse', 'Fénix', 'Metalúrgica', 'Ruta 66', 'Sopocachi', 'Equipetrol', 'Distorsión', 'Resistencia'],
            'Magos' => ['Byron', 'Karim', 'Leo', 'Alejandro', 'Misterio', 'Fantasía', 'David', 'Zack'],
            'Animadores' => ['Robertito', 'Marcelo', 'Gabriel', 'Estrellita', 'Kiko', 'Pato', 'Daniela'],
            'Payasos' => ['Tallarín', 'Pinpin', 'Chispita', 'Bombita', 'Pirueta', 'Caramelo', 'Juguetón'],
            'Grupos Musicales' => ['Sentimiento', 'Fusión', 'Sol de Bolivia', 'Tropicana', 'Kantus', 'Andino', 'Sabotaje', 'Sensación']
        ];

        // 1. Sembrar 20 Anfitriones
        $hostUsers = [];
        for ($i = 1; $i <= 20; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $hostId = Str::uuid()->toString();
            
            // Fechas de creación aleatorias en el último año
            $createdAt = Carbon::now()->subDays(rand(1, 365));

            DB::table('users')->insert([
                'id' => $hostId,
                'name' => "$firstName $lastName",
                'email' => "anfitrion{$i}@festipro.com",
                'password' => Hash::make('password123'),
                'role' => 'anfitrion',
                'is_admin' => false,
                'whatsapp_number' => '+591' . rand(60000000, 79999999),
                'avatar_url' => null,
                'banned_at' => null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            $hostUsers[] = (object)[
                'id' => $hostId,
                'name' => "$firstName $lastName",
                'created_at' => $createdAt
            ];
        }

        // 2. Sembrar 48 Talentos y sus Perfiles
        $talentProfiles = [];
        $talentProfileIds = [];
        
        for ($i = 1; $i <= 48; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $talentId = Str::uuid()->toString();
            $createdAt = Carbon::now()->subDays(rand(1, 365));

            DB::table('users')->insert([
                'id' => $talentId,
                'name' => "$firstName $lastName",
                'email' => "talento{$i}@festipro.com",
                'password' => Hash::make('password123'),
                'role' => 'talento',
                'is_admin' => false,
                'whatsapp_number' => '+591' . rand(60000000, 79999999),
                'avatar_url' => null,
                'banned_at' => null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            // Crear Perfil de Talento
            $profileId = Str::uuid()->toString();
            $categoryId = $categoryIds[array_rand($categoryIds)];
            $categoryName = $categoryMap[$categoryId];
            $cityId = $cityIds[array_rand($cityIds)];

            // Generar Nombre Artístico Coherente
            $artPrefix = $artisticPrefixes[$categoryName][array_rand($artisticPrefixes[$categoryName])];
            $artRoot = $artisticRoots[$categoryName][array_rand($artisticRoots[$categoryName])];
            $artisticName = $artPrefix . $artRoot;
            
            // Evitar duplicados exactos añadiendo un número si es necesario
            if (in_array($artisticName, array_column($talentProfiles, 'artistic_name'))) {
                $artisticName .= " " . rand(2, 9);
            }

            // Seleccionar Bio correspondiente a la categoría
            $bioTemplates = $biosByCategory[$categoryName];
            $bio = $bioTemplates[array_rand($bioTemplates)];

            $basePrice = rand(3, 50) * 100; // Precios entre 300 y 5000 BOB
            $isAvailable = (rand(1, 10) <= 8); // 80% disponible
            $profileViews = rand(5, 600);

            DB::table('talent_profiles')->insert([
                'id' => $profileId,
                'user_id' => $talentId,
                'category_id' => $categoryId,
                'city_id' => $cityId,
                'artistic_name' => $artisticName,
                'bio' => $bio,
                'base_price' => $basePrice,
                'banner_url' => null,
                'youtube_link' => rand(1, 10) > 4 ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : null,
                'is_available' => $isAvailable,
                'profile_views' => $profileViews,
                'average_rating' => 0, // Se actualizará al final según reseñas
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            $talentProfiles[] = [
                'id' => $profileId,
                'artistic_name' => $artisticName,
                'category_id' => $categoryId,
                'city_id' => $cityId,
            ];
            $talentProfileIds[] = $profileId;
        }

        // 3. Sembrar 60 Eventos con Fechas Pasadas, Presentes y Futuras
        $eventTitles = [
            'Matrimonio Elegante', 'Fiesta de 15 Años (Quinceañera)', 'Cumpleaños Infantil Temático',
            'Aniversario de Bodas de Oro', 'Bautizo Familiar', 'Concierto en Pub Local',
            'Festival de Talentos Escolares', 'Evento Corporativo Fin de Año', 'Inauguración de Tienda Comercial',
            'Verbena Popular', 'Chura Tarijeña Privada', 'Fiesta Universitaria de Bienvenida',
            'Baby Shower de Ensueño', 'Peña Folklórica Cultural', 'Kermesse de Recaudación de Fondos'
        ];

        $eventDescriptions = [
            'DJs' => 'Buscamos un DJ dinámico para poner a bailar a todos los invitados. Queremos música variada: reggaetón clásico, cumbia boliviana y éxitos actuales.',
            'Bandas de Rock' => 'Buscamos una banda que toque covers de los 80 y 90. Contamos con espacio para el escenario y energía eléctrica estable en el salón.',
            'Magos' => 'Necesitamos un mago para entretener a niños y adultos durante la cena. Buscamos trucos interactivos y de buen humor.',
            'Animadores' => 'Buscamos un animador o maestro de ceremonias carismático para guiar el protocolo del evento y coordinar los juegos.',
            'Payasos' => 'Queremos un payaso divertido para un cumpleaños de 6 años. Que incluya globoflexia, juegos interactivos y mucha diversión para los pequeños.',
            'Grupos Musicales' => 'Buscamos un grupo folklórico o mariachi para amenizar la tarde y dar una hermosa serenata a los homenajeados.'
        ];

        for ($i = 1; $i <= 60; $i++) {
            $host = $hostUsers[array_rand($hostUsers)];
            $categoryId = $categoryIds[array_rand($categoryIds)];
            $categoryName = $categoryMap[$categoryId];
            $cityId = $cityIds[array_rand($cityIds)];

            // Generar fechas: 25 pasadas, 10 cercanas (hoy o esta semana), 25 futuras
            if ($i <= 25) {
                // Pasadas (hace 1 a 6 meses)
                $eventDate = Carbon::now()->subDays(rand(5, 180));
                // Eventos pasados suelen estar cerrado o cancelado
                $status = rand(1, 10) <= 8 ? 'cerrado' : 'cancelado';
            } elseif ($i <= 35) {
                // Cercanas (esta semana o próximas 2 semanas)
                $eventDate = Carbon::now()->addDays(rand(-2, 14));
                $status = rand(1, 10) <= 9 ? 'abierto' : 'cerrado';
            } else {
                // Futuras (próximos 1 a 6 meses)
                $eventDate = Carbon::now()->addDays(rand(15, 180));
                $status = rand(1, 10) <= 9 ? 'abierto' : 'cancelado';
            }

            $baseTitle = $eventTitles[array_rand($eventTitles)];
            $cityName = DB::table('cities')->where('id', $cityId)->value('name');
            $title = "$baseTitle en $cityName";
            $description = $eventDescriptions[$categoryName];
            $budget = rand(5, 80) * 100; // Presupuestos entre 500 y 8000 BOB
            $eventId = Str::uuid()->toString();

            DB::table('events')->insert([
                'id' => $eventId,
                'host_id' => $host->id,
                'category_id' => $categoryId,
                'city_id' => $cityId,
                'title' => $title,
                'description' => $description,
                'event_date' => $eventDate->toDateString(),
                'estimated_budget' => $budget,
                'status' => $status,
                'created_at' => $eventDate->copy()->subDays(rand(5, 20)),
                'updated_at' => $eventDate->copy()->subDays(rand(1, 4)),
            ]);
        }

        // 4. Sembrar Reseñas (Garantizando Restricción de Negocio)
        // Cada anfitrión puede calificar a un perfil de talento como MÁXIMO una vez.
        $reviewComments = [
            'Excelente presentación, puntualidad impecable y muy profesional. Totalmente recomendado.',
            'Muy buen show, divirtió a todos los niños de principio a fin. Gracias por el carisma.',
            'Excelente música, supo leer muy bien al público y mantuvo la pista llena toda la noche.',
            'La calidad de sonido fue fantástica y la interpretación en vivo espectacular. 10 de 10.',
            'Buen show de magia de cerca. Sorprendió mucho a los adultos. Muy educado.',
            'Gran animación, muy dinámico y con excelentes dinámicas de juego.',
            'Muy divertido y chistes aptos para todas las edades. Llegó un poco tarde pero compensó con el show.',
            'Hermosa serenata, muy puntuales y los trajes impecables. Volvería a contratarlos.',
            'Buena música pero el sonido falló un poco al principio. A pesar de eso, muy amables.',
            'Espectáculo asombroso, los trucos nos dejaron con la boca abierta. Muy buena interacción.',
        ];

        // Crearemos unas 80 reseñas distribuidas aleatoriamente entre los 20 anfitriones
        // Asegurando que la tupla (host_id, talent_profile_id) sea única.
        $usedPairs = [];
        $reviewsCount = 0;
        $maxAttempts = 300; // Para evitar bucles infinitos en caso de saturación

        while ($reviewsCount < 80 && $maxAttempts > 0) {
            $maxAttempts--;
            $host = $hostUsers[array_rand($hostUsers)];
            $talentProfileId = $talentProfileIds[array_rand($talentProfileIds)];
            
            $pairKey = "{$host->id}_{$talentProfileId}";
            if (in_array($pairKey, $usedPairs)) {
                continue;
            }

            $usedPairs[] = $pairKey;
            $rating = rand(3, 5); // Calificaciones realistas de 3 a 5
            $comment = $reviewComments[array_rand($reviewComments)];
            $reviewCreatedAt = Carbon::now()->subDays(rand(1, 90));

            DB::table('reviews')->insert([
                'id' => Str::uuid()->toString(),
                'host_id' => $host->id,
                'talent_profile_id' => $talentProfileId,
                'rating' => $rating,
                'comment' => $comment,
                'created_at' => $reviewCreatedAt,
            ]);

            $reviewsCount++;
        }

        // 5. Calcular y Actualizar la Calificación Promedio de los Talentos
        foreach ($talentProfileIds as $profileId) {
            $averageRating = DB::table('reviews')
                ->where('talent_profile_id', $profileId)
                ->avg('rating');

            if ($averageRating) {
                DB::table('talent_profiles')
                    ->where('id', $profileId)
                    ->update(['average_rating' => round($averageRating, 2)]);
            }
        }

        // 6. Sembrar Historial de Logs Administrativos (Admin Logs)
        $adminActions = [
            ['action' => 'Banear Usuario', 'target_type' => 'User', 'details' => 'Usuario suspendido por comportamiento inadecuado en el catálogo.'],
            ['action' => 'Desbanear Usuario', 'target_type' => 'User', 'details' => 'Baneo levantado tras disculpas y aclaración del malentendido.'],
            ['action' => 'Crear Categoría', 'target_type' => 'Category', 'details' => 'Nueva categoría "Grupos Musicales" creada con éxito.'],
            ['action' => 'Actualizar Categoría', 'target_type' => 'Category', 'details' => 'Ícono y estado de la categoría de Rock actualizados.'],
            ['action' => 'Baneo Preventivo', 'target_type' => 'User', 'details' => 'Baneo preventivo por sospecha de cuenta clonada en proceso de revisión.'],
        ];

        for ($k = 0; $k < 12; $k++) {
            $logAction = $adminActions[array_rand($adminActions)];
            $logDate = Carbon::now()->subDays(rand(2, 180));
            
            DB::table('admin_logs')->insert([
                'id' => Str::uuid()->toString(),
                'admin_id' => $adminId,
                'action' => $logAction['action'],
                'target_type' => $logAction['target_type'],
                'target_id' => rand(10, 50) > 25 ? Str::uuid()->toString() : null, // ID aleatorio simulado
                'details' => $logAction['details'],
                'created_at' => $logDate,
            ]);
        }
    }
}
