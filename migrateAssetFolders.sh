#!/bin/bash

# Pfad zum Basisverzeichnis, in dem die flachen Ordner liegen
BASE_DIR="/home/daniel/tsvneos/Web/_Resources/Persistent"

# Wechsle in das Verzeichnis
cd "$BASE_DIR"

# Durchlaufe alle Ordner im Basisverzeichnis
for folder in */ ; do
    # Entferne den Schrägstrich vom Ordnernamen
    folder="${folder%/}"

    # Prüfe, ob die Länge des Ordnernamens mindestens 4 Zeichen beträgt
    if [ ${#folder} -ge 4 ]; then
        # Extrahiere die ersten vier Zeichen
        subdir="${folder:0:1}/${folder:1:1}/${folder:2:1}/${folder:3:1}"

        # Erstelle die neue Verzeichnisstruktur, falls noch nicht vorhanden
        mkdir -p "$subdir"

        # Verschiebe den aktuellen Ordner in den neuen Unterordner
        mv "$folder" "$subdir/$folder"
    fi
done

echo "Die Umstrukturierung wurde abgeschlossen."
