all: build up
build:
	@docker build --network=host -t base -f base/Dockerfile .
	@docker compose build
up:
	@docker compose up -d
	@echo "\nhttps://localhost:8443/"
down:
	@docker compose down
re: down up
rebuild: down build up
clean:
	@docker compose down -v
fclean:
	@docker compose down -v --rmi local

ps:
	@docker compose ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
destroy:
	@docker stop $$(docker ps -aq) || true
	@docker rm $$(docker ps -aq) || true
	@docker rmi -f $$(docker images -aq) || true
	@docker volume prune -f
	@docker network prune -f
	@docker system prune -a -f --volumes
	@docker compose down -v --rmi local

status:
	@docker ps -a
	@docker images -a
	@docker volume ls
	@docker network ls

.PHONY: all build up down fclean re ps clean destroy
