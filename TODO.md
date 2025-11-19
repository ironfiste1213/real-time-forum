# TODO: Update all log.Printf statements

## Files to edit:
- [x] internal/repo/messages.go
- [x] internal/repo/comments.go
- [x] internal/repo/posts.go
- [x] internal/http/middleware.go
- [x] internal/ws/events.go
- [x] internal/http/handler/posts.go
- [x] internal/http/routes.go
- [x] internal/http/handler/websocket.go
- [x] internal/http/handler/auth.go
- [x] internal/http/handler/messages.go
- [x] internal/ws/client.go
- [x] internal/ws/hub.go

## Changes:
- [x] Remove any `pc, file, _, _ := runtime.Caller(0)` and `fn := runtime.FuncForPC(pc).Name()` lines.
- [x] Change log.Printf to format: `log.Printf("[filename:function] message", ...)`
- [x] Identify the function name for each log.Printf based on context.
- [x] Remove unused imports "runtime" and "filepath" from affected files.
