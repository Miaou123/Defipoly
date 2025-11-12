#!/bin/bash

# Create upload directories
echo "Creating upload directory structure..."

# Main uploads directory
sudo mkdir -p /var/www/defipoly/uploads/{profiles,boards,cards}

# Set proper ownership (replace www-data with your web server user if different)
sudo chown -R www-data:www-data /var/www/defipoly/uploads

# Set proper permissions
sudo chmod -R 755 /var/www/defipoly/uploads

echo "Upload directories created successfully!"
echo "Structure:"
echo "  /var/www/defipoly/uploads/"
echo "  ├── profiles/  (profile pictures)"
echo "  ├── boards/    (board backgrounds)" 
echo "  └── cards/     (card backgrounds)"