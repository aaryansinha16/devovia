#!/bin/bash

# Find all files with " 2" in their name and remove them
find . -name "* 2.*" -type f -print -delete

echo "Cleaned up duplicate files"
