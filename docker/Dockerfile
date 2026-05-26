FROM php:8.3-apache

# Recibir UID/GID desde docker-compose
ARG UID
ARG GID

# Alinear www-data con el usuario del host
RUN groupmod -g ${GID} www-data \
 && usermod -u ${UID} -g ${GID} www-data

# Asegurar permisos correctos
RUN chown -R www-data:www-data /var/www/html

# Extensión recomendada por PHPMailer
RUN apt-get update \
 && apt-get install -y --no-install-recommends libonig-dev libzip-dev git unzip \
 && docker-php-ext-install mbstring zip \
 && rm -rf /var/lib/apt/lists/*

# mod_rewrite/headers + permitir .htaccess
RUN a2enmod rewrite headers \
 && sed -ri 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf

# Composer (solo para resolver dependencias en local)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html/cont-leg-test