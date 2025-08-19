FROM python:3.9-slim

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /src/backend-app

COPY . .

RUN pip3 install --no-cache-dir .

CMD [ "start-server", "--host", "0.0.0.0" ]
