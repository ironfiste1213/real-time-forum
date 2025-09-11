package main

import (
	"log"
	"net/http"
)

func main() {

	fs := http.FileServer(http.Dir("frontend"))

http.Handle("/static/", http.StripPrefix("/static/", fs))

http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "frontend/index.html")
})

log.Println("Server started on http://localhost:8080")

err := http.ListenAndServe(":8080", nil)
if err != nil {
    log.Fatal(err)
}

}
