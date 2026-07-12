.PHONY: dev down logs shell lint typecheck format test e2e db-generate db-push db-seed db-studio reset

dev:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f web

shell:
	docker compose exec web bash

lint:
	docker compose exec web npm run lint

typecheck:
	docker compose exec web npm run typecheck

format:
	docker compose exec web npm run format

test:
	docker compose exec web npm run test

e2e:
	docker compose exec web npm run test:e2e

db-generate:
	docker compose exec web npm run db:generate

db-push:
	docker compose exec web npm run db:push

db-seed:
	docker compose exec web npm run db:seed

db-studio:
	docker compose exec web npm run db:studio

reset:
	docker compose down -v
	docker compose up --build -d
