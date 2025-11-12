#!/bin/bash

# Create local upload directories
echo "Creating local upload directory structure..."

# Create uploads directory in the backend folder
mkdir -p ./uploads/{profiles,boards,cards}

# Set proper permissions for local development
chmod -R 755 ./uploads

echo "Local upload directories created successfully!"
echo "Structure:"
echo "  ./uploads/"
echo "  ├── profiles/  (profile pictures)"
echo "  ├── boards/    (board backgrounds)" 
echo "  └── cards/     (card backgrounds)"