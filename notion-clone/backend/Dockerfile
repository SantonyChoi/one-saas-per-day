FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY *.go ./

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -o main .

# Create a smaller image for the final application
FROM alpine:latest

# Install required dependencies for SQLite
RUN apk --no-cache add ca-certificates libc6-compat

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/main .

# Copy the .env file
COPY .env ./

# Create data directory
RUN mkdir -p /app/data

# Expose the port
EXPOSE 4000

# Run the application
CMD ["./main"] 