#!/usr/bin/python3
# -*- coding: utf-8 -*-

import yaml
import shutil 
import pandas as pd
from pathlib import Path, PosixPath
from urllib.parse import urlparse

class color:
    PURPLE = "\033[95m"
    CYAN = "\033[96m"
    DARKCYAN = "\033[36m"
    BLUE = "\033[94m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"
    END = "\033[0m"

cantidadVideos = 0
cantidadSeries = 0
cantidadPendientes = 0

def main():
    print("Iniciando Generador Descripciones")
    folderNoche = Path(Path().resolve())
    while folderNoche.name != "1.NocheProgramacion":
        folderNoche = folderNoche.parent
        if folderNoche.name == "":
            raise Exception("No se encontro Folder de NocheProgramacion") 

    print("Folder NocheProgramacion; ", folderNoche.name)
    shutil.rmtree(folderNoche.joinpath("_actualizado"), ignore_errors=True)

    archivoConfig = Path(folderNoche, "_scripts/config.md")
    print("Archivo Config", archivoConfig)
    config = leerArchivo(archivoConfig)
    for folderActual in config.get("folder"):
        buscarFolder(folderNoche.joinpath(folderActual), folderNoche)
    mostarEstadisticas()


def leerDescripcion(nombre):
    if not Path.exists(nombre):
        print()
        print(nombre)
        print(f"No exite el Archivo {nombre.name}")
        return None
    
    with open(nombre, encoding="utf-8") as archivo:
        if str(nombre).endswith(".md"):
            texto = archivo.read()
            texto = texto.split("---")[2].strip()
            return texto
        
    return None


def leerArchivo(nombre):
    if not Path.exists(nombre):
        print()
        print(nombre)
        print(f"No exite el Archivo {nombre.name}")
        # quit()
        return None
    
    # TODO revisas se se puede leer
    # if not procesarArchivo(nombre):
    #     return None

    with open(nombre, encoding="utf-8") as archivo:
        if str(nombre).endswith(".md"):
            # TODO Capturar error en caso de carga
            try:
                data = yaml.load_all(archivo, Loader=yaml.SafeLoader)
                return list(data)[0]
            except ValueError as error:
                print(f"Error con el Valor en {nombre.name}: {error}")
                quit()  
            except yaml.scanner.ScannerError as error:
                print(f"Error con el formato {nombre.name}: {error}")
                quit()
                pass
        elif str(nombre).endswith(".txt"):
            return archivo.read()
        
    return None

def SalvarArchivo(Archivo: str, data):
    """Sobre escribe data en archivo."""
    if type(Archivo) not in [str, PosixPath]:
        raise TypeError("Los Path tiene que ser str o PosixPath")

    RutaArchivo = Path(Archivo).parent
    RutaArchivo.mkdir(parents=True, exist_ok=True)
    with open(Archivo, "w+") as f:
        f.write(data)

def procesarArchivo(archivo):

    if not archivo.exists():
        return False
    
    with open(archivo) as f:
        data = f.read()

    return data.__contains__("actualizado: true")

def dataPendiente(data, video, ruta):
    global cantidadPendientes
    if data.get("pendiente") is not None:
            cantidadPendientes += 1
            # TODO agregar colors
            print(f"{color.RED}Data Pendiente Alerta{color.END}")
            print(f"Video: {video.get('title')}")
            print(f"Data: {data.get('title')}")
            print(f"URL: {ruta.name}")
            print()
            return True
    return False

def esUrl(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except ValueError:
        return False
    
def buscaURLYoutube(url, nocheprogramacion):
    urlVideo = nocheprogramacion.joinpath(f"_{url}.md")
    if Path.exists(urlVideo):
        dataVideo = leerArchivo(urlVideo)
        return f"https://youtu.be/{dataVideo.get('video_id')}"
    urlIndex = nocheprogramacion.joinpath(f"_{url}/index.md")
    if Path.exists(urlIndex):
        print("urlIndex ", urlVideo)
        dataVideo = leerArchivo(urlVideo)
        return f"https://www.youtube.com/playlist?list={dataVideo.get('playlist_id')}"
    return "Muy Pronto"

def buscarFolder(folder, nocheprogramacion):
    global cantidadVideos
    global cantidadSeries

    if type(folder) not in [str, PosixPath]:
        raise TypeError("Los Path tiene que ser str o PosixPath")
    if not folder.exists():
        return
    
    archivoIndex = folder.joinpath("index.md")
    if not procesarArchivo(archivoIndex):
        return
    dataIndex = leerArchivo(archivoIndex)
    idPlayList = dataIndex.get("playlist_id") 
    
    archivoRedes = nocheprogramacion.joinpath("_scripts/redes.txt")
    dataRedes = leerArchivo(archivoRedes)

    listaVideos = []
    for archivo in Path.iterdir(folder):
        rutaActual = folder.joinpath(archivo)
        
        
        if Path.is_dir(rutaActual):
            buscarFolder(rutaActual, nocheprogramacion)
        if Path.is_file(rutaActual):
            if not procesarArchivo(rutaActual) or rutaActual.name == "index.md":
                continue
            listaVideos.append(rutaActual.name)
        
    listaVideos.sort()
 
    for id in range(len(listaVideos)): 
        rutaVideo =  folder.joinpath(listaVideos[id])
        # print(rutaVideo.name)
        dataVideo = leerArchivo(rutaVideo)
        descripcionVideo = leerDescripcion(rutaVideo)
        if id > 1:
            dataVideoAnterior = leerArchivo(folder.joinpath(listaVideos[id-1]))
        else:
            dataVideoAnterior = None    
        if id < len(listaVideos) -1:
            dataVideoSiquiente = leerArchivo(folder.joinpath(listaVideos[id+1]))
        else:
            dataVideoSiquiente = None

        cantidadVideos += 1
        dataFecha = dataVideo.get("date")
        fechaVideo = pd.to_datetime(dataFecha)
        anno = fechaVideo.year
        mes = fechaVideo.month
        url = f"_actualizado/{anno}/{mes}/{dataVideo.get('video_id')}.txt"

        descripcion = ""

        # Descripcions
        # TODO agreegar separador de descripciones
        descripcion += descripcionVideo
        descripcion += "\n\n"

        # ADS
        if dataVideo.get("ads"):
            for ads in dataVideo.get("ads"):
                if dataPendiente(ads, dataVideo, rutaVideo):
                    continue
                descripcion += f"\n{ads.get('ads')} {ads.get('url')}\n"

        # Remake
        if dataVideo.get("remake"):
            urlRemake = dataVideo.get("remake")
            urlRemake = buscaURLYoutube(urlRemake, nocheprogramacion)
            descripcion = f"⚠️ Existe una NUEVA versión de este Video aqui 👉👉🏼👉🏾 {urlRemake} 👈🏾👈🏼👈\n\n" + descripcion

        # Correciones
        if dataVideo.get("log"):
            descripcion += "\n⚠️ Correcciones ⚠️:\n"
            for correcion in dataVideo.get("log"):
                if dataPendiente(correcion, dataVideo, rutaVideo):
                    continue
                descripcion += f"  ♦️ {correcion.get('title')}\n"
                
        # Siquiente y Anterior Video
        if idPlayList:
            # Video Anterior
            if dataVideoAnterior is not None:
                if idPlayList is not None:
                    descripcion += f"👈 Anterior Video {dataVideoAnterior.get('title')}: https://youtu.be/{dataVideoAnterior.get('video_id')}?list={idPlayList}\n"
                else:
                    descripcion += f"👈 Anterior Video {dataVideoAnterior.get('title')}: https://youtu.be/{dataVideoAnterior.get('video_id')}\n"
            
            # Video Siquiente
            if dataVideoSiquiente is not None:
                if idPlayList is not None:
                    descripcion += f"👉 Siguiente Video {dataVideoSiquiente.get('title')}: https://youtu.be/{dataVideoSiquiente.get('video_id')}?list={idPlayList}\n"
                else:
                    descripcion += f"👉 Siguiente Video {dataVideoSiquiente.get('title')}: https://youtu.be/{dataVideoSiquiente.get('video_id')}\n"

            # Lista de Reproduccion
            descripcion += f"🎥 Playlist({dataIndex.get('title')}): https://www.youtube.com/playlist?list={idPlayList}\n";
    
        # Videos Relecionados
        if dataVideo.get("videos"):
            descripcion += "\nVideos mencionados:\n"
            for video in dataVideo.get("videos"):
                if dataPendiente(video, dataVideo, rutaVideo):
                    continue
                if video.get("video_id"):
                    descripcion += f" 🎞 {video.get('title')}: https://youtu.be/{video.get('video_id')}\n"
                elif video.get("url"):
                    if esUrl(video.get("url")):
                        descripcion += f" 🎞 ${video.get('title')}: {video.get('video_id')}\n"
                    else:
                        pass
                        # TODO buscar video en referencia
                        descripcion += f" 🎞  "

        # NocheProgramacion y Adjuntos

        # Links
        if dataVideo.get("links"):
            descripcion += "\nLink referencia:\n"
            for links in dataVideo.get("links"):
                if dataPendiente(links, dataVideo, rutaVideo):
                    continue
                descripcion += f" 🔗 {links.get('title')} {links.get('url')}\n"

        # Compones y Links Amazon

        # Extra
        if dataVideo.get("custom_sections"): 
            pass

        # Indice
        if dataVideo.get("topics"): 
            descripcion += "\n🕓 Índice:\n"
            for indice in dataVideo.get("topics"):
                descripcion += f"{indice.get('time')} {indice.get('title')}\n"

        # Redes Sosociales
        if dataRedes:
            descripcion += "\n"
            descripcion += dataRedes

        # Colabodores
        
        # Tags
        descripcion += "\n#ChepeCarlos"

        # Miembros

        # CTA Miembros
        descripcion += "\n"
        descripcion += "\n🔭 Agrega tu nombre, Únete tú también https://www.youtube.com/@chepecarlo/join 🔭"
        descripcion += "\n👊 Avances Exclusivo para Miembros: https://nocheprogramacion.com/miembros 👊"
     
        # Salvar archivo
        SalvarArchivo(nocheprogramacion.joinpath(url), descripcion)

    cantidadSeries += 1

def mostarEstadisticas():
    global cantidadVideos
    global cantidadSeries
    global cantidadPendientes
    print()
    print(f"Cantidad Totales Procesadas")
    print(f"Video: {color.GREEN}{cantidadVideos}{color.END}")
    print(f"Series: {cantidadSeries}")
    print(f"Pendientes: {color.RED}{cantidadPendientes}{color.END} Falta")

if __name__ == "__main__":
    main()
   