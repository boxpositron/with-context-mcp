#!/bin/bash

# Start the WithContext MCP Server with environment variables loaded

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load environment variables from .env
if [ -f "$DIR/.env" ]; then
  export $(cat "$DIR/.env" | grep -v '^#' | xargs)
fi

# Start the MCP server
node "$DIR/dist/index.js"
