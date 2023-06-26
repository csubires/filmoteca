#!/bin/bash
#2023.3.18

# Colours
declare -A PALETTE
PALETTE[w]="\e[97m"
PALETTE[r]="\e[91m"
PALETTE[g]="\e[92m"
PALETTE[y]="\e[93m"
PALETTE[b]="\e[94m"
PALETTE[v]="\e[95m"
PALETTE[c]="\e[96m"
PALETTE[o]="\e[33m"
PALETTE[n]="\e[1m"
PALETTE[u]="\e[04m"
PALETTE[t]="\t\e[1;42;97m"

# w: Blanco
# r: Rojo
# g: Verde
# b: Azul
# y: Amarillo
# v: Violeta
# c: Cian
# o: Naranaja
# n: Negrita
# u: Delineado
# t: Título

# Colorear cada mensaje pasado por parametro
function lg_prt() {
	# Como mínimo tiene que tener 3 argumentos. namescript, colors, mensajes 
	if [[ ! "$2" ]]; then 
		echo -e "${PALETTE[r]} Error (lg_prt), Número de argumentos insuficientes\033[0m\e[0m"
		return 1
	fi
	
	# Controlar que el número de colores sea igual que el de mensajes
	colors=$(printf "$1%${#@}s\n" | tr ' ' 'b')

	# Colorear cada mensaje quitando los 2 primeros argumentos
	i=0
	for arg in "${@:2}"; do
    	echo -ne "${PALETTE[${colors:$i:1}]} $arg \033[0m\e[0m"
    	i=$[$i+1]
	done
	echo
}

# Variables globales
# DIR="/mnt/hgfs/COMPRESS/"	# Carpeta de media
DIR="./../filmoteca/www/images/covers"	# Carpeta de media


# Se ejecuta al pulsar Ctrl+C
trap ctrl_c INT

function ctrl_c() {
    lg_prt "y" "[▲] Saliendo con interrupción"
	exit 1
}


# ----------------------------------------------------------------------------- 

clear

if [ -d "${DIR}" ]; then
	cd "${DIR}"
	lg_prt "yw" "\n\t[▲] Estas en el directorio:" "$(pwd)"
else
	lg_prt "ryr" "[✖] La carpeta" "\"$DIR\"" "no está disponible"
	exit 1
fi

# ----------------------------------------------------------------------------- 

init_size=$(du -bsh | awk '{print $1}')		# Tamaño inicial de la carpeta

# ----------------------------------------------------------------------------- BUSCAR DUPLICADAS

# Encontrar archivos duplicados
function findDuple(){
	lg_prt "yw" "\n\t[▲] Estas en el directorio:" "$(pwd)"
	lg_prt "wtw" "\n" "BUSCAR ARCHIVOS DUPLICADOS" "\n"

	# Pedir confirmación
	read -p "¿Estas seguro? (S/N): " -n 1 -r
	[[ $REPLY =~ ^[Ss]$ ]] && lg_prt "w" " \n" || return 0
	clear

	lg_prt "v" "Buscando archivos duplicados..."
	fdupes -S -r . 
	# lg_prt "v" "Buscando archivos con doble extensión..."
	# ls *.*.*
	lg_prt "g" "\n[✔] Tarea finalizada correctamente"
	return 0
}

# ----------------------------------------------------------------------------- BORRAR EXIF

# Eliminar los datos EXIT de las imagenes jpg, jpeg, png, bmp
function removeEXIT(){
	lg_prt "yw" "\n\t[▲] Estas en el directorio:" "$(pwd)"
	lg_prt "wtw" "\n" "BORRAR METADATOS EXIF DE IMAGENES" "\n"
	# Pedir confirmación
	read -p "¿Estas seguro? (S/N): " -n 1 -r
	[[ $REPLY =~ ^[Ss]$ ]] && lg_prt "w" " \n"  || return 0
	clear

	find . -type f -iregex ".*\.jpg\|.*\.jpeg\|.*\.png\|.*\.bmp" ! -name "*_cmp*" -print0 | while read -d $'\0' file; do 
		# BORRAR if [[ $file != *"_cmp"* ]]; then		# Descartar si ya ha sido anteriormente procesado
		mogrify -verbose -strip "$file"
		#fi		
	done 

	lg_prt "g" "\n[✔] Tarea finalizada correctamente"
	return 0
}

# ----------------------------------------------------------------------------- REDIMENSIONAR

# Redimensionar archivos jpg, jpeg, png, bmp masivamente con dimensiones de 500px
function resizeJPG(){
	lg_prt "yw" "\n\t[▲] Estas en el directorio:" "$(pwd)"
	lg_prt "wtw" "\n" "REDIMENSIONAR IMAGENES A x500px" "\n"
	# Pedir confirmación
	read -p "¿Estas seguro? (S/N): " -n 1 -r
	[[ $REPLY =~ ^[Ss]$ ]] && lg_prt "w" " \n" || return 0
	clear

	lg_prt "v"  "Redimensionando imagenes a 500px..."
	find . -type f -iregex ".*\.jpg\|.*\.jpeg\|.*\.png\|.*\.bmp" ! -name "*_cmp*" -exec sh -c 'identify -format "%[fx:(h>500)]\n" "$0" | grep -q 1' {} \; -print0 | xargs -0 mogrify -verbose -resize 'x500'

	lg_prt "g" "\n[✔] Tarea finalizada correctamente"
	return 0
}

# ----------------------------------------------------------------------------- COMPRIMIR

# Ejecuta la reducción
function reduceMedia() {
	lg_prt "yw" "\n\t[▲] Estas en el directorio:" "$(pwd)"
	lg_prt "wtw" "\n" "REDUCIR IMAGENES" "\n"
	# Pedir confirmación
	read -p "¿Estas seguro? (S/N): " -n 1 -r
	[[ $REPLY =~ ^[Ss]$ ]] && lg_prt "w" " \n" || return 0
	clear

	lg_prt "v"  "Comprimiendo imagenes con perdida..."
	find . -type f -iregex ".*\.jpg\|.*\.jpeg\|.*\.png\|.*\.bmp" ! -name "*_cmp*" -print0 | while read -d $'\0' file; do 
		# BORRAR if [[ $file != *"_cmp"* ]]; then		# Descartar si ya ha sido anteriormente procesado
		mogrify -verbose -quality 60 "$file"
		mv "${file}" "${file%.*}_cmp.jpg" 
		#fi		
	done 

	lg_prt "g" "\n[✔] Tarea finalizada correctamente"

}

# Ejecutar las funciones
findDuple
removeEXIT
resizeJPG
reduceMedia

end_size=$(du -bsh | awk '{print $1}') # Tamaño final de la carpeta
lg_prt "wywy" "\n Tamaño Inicial:" "\t$init_size" "\n Tamaño Final:" "\t$end_size"
