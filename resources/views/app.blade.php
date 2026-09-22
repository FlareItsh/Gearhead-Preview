<!DOCTYPE html>
<html class="scroll-smooth" lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Inline script to detect and apply saved theme preference immediately before rendering --}}
    <script>
        (function() {
            // First check localStorage for user's saved preference
            const savedAppearance = localStorage.getItem('appearance');
            let appearance = savedAppearance || '{{ $appearance ?? 'system' }}';

            // Determine if dark mode should be applied
            const isDark = appearance === 'dark' || 
                          (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

            // Apply dark class and color scheme immediately
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            
            document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        * {
            font-family: "DM Sans", sans-serif;
        }
    </style>

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <link rel="icon" href="/car.png" sizes="any">
    <link rel="icon" href="/car.svg" type="image/svg+xml">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
        rel="stylesheet">

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @inertiaHead
</head>

<body class="bg-background custom-scrollbar antialiased">
    @inertia
</body>

</html>