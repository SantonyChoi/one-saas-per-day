FROM elixir:1.16-alpine

# Update package repository
RUN echo "http://dl-cdn.alpinelinux.org/alpine/v3.19/main" > /etc/apk/repositories && \
    echo "http://dl-cdn.alpinelinux.org/alpine/v3.19/community" >> /etc/apk/repositories && \
    apk update

# Install build dependencies
RUN apk add --no-cache build-base npm git python3 inotify-tools

# Install hex and rebar
RUN mix local.hex --force && \
    mix local.rebar --force

WORKDIR /app

# Create app user
RUN adduser -D app && \
    chown -R app:app /app

# Copy application code
COPY --chown=app:app app .

# Install dependencies and compile
RUN mix deps.get --force && mix deps.compile

# Create Heroicons directory structure
RUN mkdir -p /app/deps/heroicons/optimized/24/outline && \
    mkdir -p /app/deps/heroicons/optimized/24/solid && \
    mkdir -p /app/deps/heroicons/optimized/20/solid && \
    mkdir -p /app/deps/heroicons/optimized/16/solid && \
    touch /app/deps/heroicons/optimized/24/outline/.keep && \
    touch /app/deps/heroicons/optimized/24/solid/.keep && \
    touch /app/deps/heroicons/optimized/20/solid/.keep && \
    touch /app/deps/heroicons/optimized/16/solid/.keep

USER app

CMD ["mix", "phx.server"] 