#!/bin/bash
# ========================================================
# AWS EC2 Automated Setup Script
# Lost & Found Web Application Deployment
# Supported OS: Amazon Linux 2023 / Ubuntu 22.04 LTS
# ========================================================

set -e

echo "=========================================="
echo "🚀 Starting AWS EC2 Setup for Lost & Found"
echo "=========================================="

# 1. Update OS Packages
if [ -f /etc/amazon-linux-release ]; then
    echo "Detected Amazon Linux 2023..."
    sudo dnf update -y
    sudo dnf install -y docker git amazon-cloudwatch-agent nginx
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker ec2-user
elif [ -f /etc/lsb-release ]; then
    echo "Detected Ubuntu..."
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y docker.io docker-compose git nginx
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker ubuntu
fi

# 2. Install Docker Compose v2 if not present
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

echo "Docker version: $(docker --version)"
echo "Setup complete! Please log out and back in to apply Docker group permissions."
