package logger

import (
	"log"
	"os"
)

var Log *log.Logger

func init() {
	Log = log.New(os.Stdout, "[TRAEFIK-LOG-DASHBOARD] ", log.LstdFlags|log.Lshortfile)
}