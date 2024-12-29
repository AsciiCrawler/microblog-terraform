#!/bin/bash

# Define the paths
BASE_DIR=$(pwd)
SHARED_DIST="$BASE_DIR/services/shared/dist"
SERVICES_DIR="$BASE_DIR/services"

# Check if the shared dist folder exists
if [ ! -d "$SHARED_DIST" ]; then
  echo "Shared dist folder not found: $SHARED_DIST"
  exit 1
fi

build_shared() {
  local CURRENT_DIR=$1
  cd "$CURRENT_DIR"
  rm -rf ./node_modules
  rm -rf ./dist
  npm install || { echo "npm install failed in $dir"; exit 1; }
  npm run build || { echo "npm run build failed in $dir"; exit 1; }
  cd - > /dev/null || { echo "Failed to return to the root directory"; exit 1; }
}

copy_dist_to_microservices() {
  local CURRENT_DIR=$1

  for ITEM in "$CURRENT_DIR"/*; do
    if [ -d "$ITEM" ]; then
      # Exclude the shared folder
      if [[ "$(basename "$ITEM")" == "shared" ]]; then
        continue
      fi

      # If the folder contains a package.json, it's a microservice
      if [ -f "$ITEM/package.json" ]; then
        # Define the target path
        TARGET="$ITEM/shared"

        # Remove the old dist folder if it exists
        if [ -d "$TARGET" ]; then
          echo "Removing old dist folder in $ITEM"
          rm -rf "$TARGET"
        fi

        # Copy the shared dist folder into the service
        echo "Copying dist folder to $ITEM"
        cp -r "$SHARED_DIST" "$TARGET"
      else
        copy_dist_to_microservices "$ITEM"
      fi
    fi
  done
}

build_microservices() {
  local CURRENT_DIR=$1

  for ITEM in "$CURRENT_DIR"/*; do
    if [ -d "$ITEM" ]; then
      # If the folder contains a package.json, it's a microservice
      if [ -f "$ITEM/package.json" ]; then
        echo "Processing $ITEM..."
        cd "$ITEM" || { echo "Failed to enter directory $ITEM"; exit 1; }

        rm -rf ./node_modules
        rm -rf ./dist
        
        npm install || { echo "npm install failed in $dir"; exit 1; }
        npm run build || { echo "npm run build failed in $dir"; exit 1; }
        
        cd - > /dev/null || { echo "Failed to return to the root directory"; exit 1; }
      else
        build_microservices "$ITEM"
      fi
    fi
  done

  # for ITEM in "$CURRENT_DIR"/*; do
  #   if [ -d "$ITEM" ]; then
  #     # If the folder contains a package.json, it's a microservice
  #     if [ -f "$ITEM/package.json" ]; then
  #       # Define the target path
  #       TARGET="$ITEM/shared"

  #       # Remove the old dist folder if it exists
  #       if [ -d "$TARGET" ]; then
  #         echo "Removing old dist folder in $ITEM"
  #         rm -rf "$TARGET"
  #       fi

  #       # Copy the shared dist folder into the service
  #       echo "Copying dist folder to $ITEM"
  #       cp -r "$SHARED_DIST" "$TARGET"
  #     else
  #       # Recurse into subfolders
  #       copy_dist_to_microservices "$ITEM"
  #     fi
  #   fi
  # done
}


echo "Build shared"
build_shared "$BASE_DIR/services/shared"

echo "Copy shared to folders"
copy_dist_to_microservices "$SERVICES_DIR"

echo "Build microservices"
build_microservices "$SERVICES_DIR"

echo "Done..."
echo "Script by AsciiCrawler"