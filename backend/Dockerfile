# ================================
# Backend Dockerfile for Railway
# ================================

# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install git (required for some go modules)
RUN apk add --no-cache git ca-certificates tzdata

# Copy go mod files first (better caching)
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build the application with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w -X main.Version=1.0.0" \
    -o main ./cmd/main.go

# ================================
# Runtime stage (minimal image)
# ================================
FROM alpine:3.19

WORKDIR /app

# Install ca-certificates for HTTPS and tzdata for timezones
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy binary from builder
COPY --from=builder /app/main .

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port (Railway uses PORT env variable)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8000}/health || exit 1

# Run the application
CMD ["./main"]
