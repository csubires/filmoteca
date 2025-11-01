COMPOSE		= srcs/docker-compose.yml
DIR_DATA	= /home/csubires/data

all:
	@mkdir -p "$(DIR_DATA)/mariadb" "$(DIR_DATA)/wordpress"
	@docker compose -f $(COMPOSE) up --build -d

up:
	@docker compose $(COMPOSE) up -d

down:
	@docker compose -f $(COMPOSE) down

clean:
	@docker compose -f $(COMPOSE) down -v

fclean: clean
	@docker stop $$(docker ps -qa) 2>/dev/null || true
	@docker rm $$(docker ps -qa) 2>/dev/null || true
	@docker rmi -f $$(docker images -qa) 2>/dev/null || true
	@docker volume rm $$(docker volume ls -q) 2>/dev/null || true
	@docker network rm $$(docker network ls -q) 2>/dev/null || true
	@sudo rm -rf $(DIR_DATA) 2>/dev/null || true
	@docker compose -f $(COMPOSE) down -v --rmi all 2>/dev/null || true

re: fclean all

status:
	@docker ps -a  | grep -E "nginx|mariadb|wordpress" || true
	@docker images | grep -E "nginx|mariadb|wordpress" || true
	@docker volume ls | grep -E "nginx|mariadb|wordpress" || true
	@docker network ls | grep -E inception || true

.PHONY: all clean fclean re up down status
