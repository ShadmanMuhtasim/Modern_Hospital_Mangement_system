FROM php:8.4-fpm

# System deps
RUN apt-get update && apt-get install -y \
    git unzip curl gnupg2 ca-certificates apt-transport-https \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# Add Microsoft repo key (no apt-key) + repo list
RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/keyrings/microsoft.gpg \
    && chmod 644 /etc/apt/keyrings/microsoft.gpg \
    && echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/microsoft-prod.list

# Install ODBC driver + tools
RUN apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 mssql-tools18 \
    && echo 'export PATH="$PATH:/opt/mssql-tools18/bin"' >> /etc/profile \
    && rm -rf /var/lib/apt/lists/*

# PHP sqlsrv extensions
RUN pecl install sqlsrv pdo_sqlsrv \
    && docker-php-ext-enable sqlsrv pdo_sqlsrv

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www