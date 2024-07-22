#!/bin/bash

docker-compose down -v
docker-compose -f "docker-compose-test.yml" up --renew-anon-volumes --build --force-recreate --abort-on-container-exit
