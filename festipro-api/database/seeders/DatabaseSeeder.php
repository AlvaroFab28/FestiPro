<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Sembrar Categorías Esenciales
        $categories = [
            ['name' => 'DJs', 'icon_url' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Bandas de Rock', 'icon_url' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Magos', 'icon_url' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Animadores', 'icon_url' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Payasos', 'icon_url' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
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
        DB::table('users')->insert([
            'id' => Str::uuid()->toString(),
            'name' => 'Admin FestiPro',
            'email' => 'admin@festipro.com',
            'password' => Hash::make('admin123'),
            'role' => null,
            'is_admin' => true,
            'whatsapp_number' => null,
            'avatar_url' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
