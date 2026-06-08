<?php

return [
    'secret' => env('JWT_SECRET', '3b92f758784a9e557bfa3dbb07cf034c4424699564f89d3d0fca8a410b0f7193'),
    'algo' => env('JWT_ALGO', 'HS256'),
    'ttl' => (int) env('JWT_TTL', 3600),
    'refresh_ttl' => (int) env('JWT_REFRESH_TTL', 1209600),
];
