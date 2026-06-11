<?php

namespace App\Global\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageOptimizationService
{
    protected ImageManager $manager;

    public function __construct()
    {
        // Initialize the manager with the GD driver
        $this->manager = new ImageManager(new Driver());
    }

    /**
     * Optimize and store an uploaded image as WebP.
     *
     * @param UploadedFile $file The uploaded file.
     * @param string $directory Directory inside 'public' disk (e.g., 'talentos/avatars').
     * @param int|null $width Target width.
     * @param int|null $height Target height.
     * @param int $quality Compression quality (1-100).
     * @param string $fitMode 'cover' or 'scale'.
     * @return string The stored file path relative to storage public folder.
     */
    public function optimizeAndStore(
        UploadedFile $file,
        string $directory,
        ?int $width = null,
        ?int $height = null,
        int $quality = 85,
        string $fitMode = 'scale'
    ): string {
        // 1. Decode the image from file path
        $image = $this->manager->decode($file->getRealPath());

        // 2. Resize/Crop if target dimensions are set
        if ($width !== null || $height !== null) {
            if ($fitMode === 'cover') {
                $image->coverDown($width, $height);
            } else {
                $image->scaleDown($width, $height);
            }
        }

        // 3. Convert to WebP format using WebpEncoder
        $encoded = $image->encode(new \Intervention\Image\Encoders\WebpEncoder($quality));

        // 4. Generate unique filename
        $filename = Str::random(40) . '.webp';
        $fullPath = rtrim($directory, '/') . '/' . $filename;

        // 5. Store on the public disk
        Storage::disk('public')->put($fullPath, (string) $encoded);

        return $fullPath;
    }

    /**
     * Optimize an avatar image (cropped square, max 500x500).
     */
    public function optimizeAvatar(UploadedFile $file, string $directory): string
    {
        return $this->optimizeAndStore($file, $directory, 500, 500, 85, 'cover');
    }

    /**
     * Optimize a banner image (cropped banner, max 1200x400).
     */
    public function optimizeBanner(UploadedFile $file, string $directory): string
    {
        return $this->optimizeAndStore($file, $directory, 1200, 400, 85, 'cover');
    }

    /**
     * Optimize a gallery/portfolio image (scaled down to max 1200 width, maintains aspect ratio).
     */
    public function optimizeGallery(UploadedFile $file, string $directory): string
    {
        return $this->optimizeAndStore($file, $directory, 1200, null, 85, 'scale');
    }
}
