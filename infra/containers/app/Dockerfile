FROM python:3.12.9-slim-bookworm
WORKDIR /usr/src/app

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1

COPY app/requirements.txt /tmp/app-requirements.txt

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl build-essential python3-dev \
	&& rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r /tmp/app-requirements.txt

EXPOSE "5000"

# Run the Flask adapter by default
CMD ["python3", "/usr/src/app/app/adapter/api.py"]
