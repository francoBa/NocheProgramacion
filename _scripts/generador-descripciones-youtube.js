/*
Generador de Descripcion para video de Youtube 
Para sistema de NocheProgramacion
*/

const fs = require("fs");
const path = require("path");
const yaml = require("yaml-front-matter");
const {
  ObtenerDataVideo,
  BuscarVideoRecursivamente,
  ReiniciarFolder,
  ObtenerURLYoutube,
} = require("./funciones");

function ImprimirData(Titulo, CantidadLink, CantidadTotal) {
  Porcentaje = parseFloat((100 * CantidadLink) / CantidadTotal).toFixed(2);
  console.log(`${Titulo}: ${CantidadLink} ${Porcentaje}%`);
}

function AgregarSeoMostar(descripcion, Cantidad, Actualizar) {
  let Lineas = descripcion.split(/\n/);
  let LongitudLinea = 90;

  if (descripcion.length <= LongitudLinea) {
    descripcion += `\n`;
  }

  if (descripcion.length <= LongitudLinea * 2 && Lineas.length <= 2) {
    descripcion += `👇 👇 HAZ CLICK 👇 👇\n`;
    if (Actualizar) Cantidad.SeoMostarActivo++;
    Cantidad.SeoMostar++;
  } else if (Lineas[0].length <= LongitudLinea * 2) {
    let D = Lineas[0];
    D += `\n👇 👇 HAZ CLICK 👇 👇`;
    for (var i = 1; i < Lineas.length; i++) {
      D += `\n` + Lineas[i];
    }
    descripcion = D;
    if (Actualizar) Cantidad.SeoMostarActivo++;
    Cantidad.SeoMostar++;
  }
  return descripcion;
}

async function CrearDescripciones(videos) {
  let CantidadVideos = videos.length;
  let ActivadoAdsGlobal = false;
  let Cantidad = new Object();
  Cantidad.Colaboradores = 0;
  Cantidad.SeoMostar = 0;
  Cantidad.SeoMostarActivo = 0;
  Cantidad.Miembros = 0;
  Cantidad.ParaMiembros = 0;
  Cantidad.Links = 0;
  Cantidad.Codigo = 0;
  Cantidad.Indice = 0;
  Cantidad.Piezas = 0;
  Cantidad.Remake = 0;
  Cantidad.Costun = 0;
  Cantidad.Ads = 0;
  Cantidad.Video = 0;
  Cantidad.NuevoSistema = 0;

  await ReiniciarFolder("./descripciones");
  await ReiniciarFolder("./actualizado");

  for (let i = 0; i < videos.length; i++) {
    const data = videos[i].data;
    const pageURL = videos[i].pageURL;
    const playlist = videos[i].playlist;

    let descripcion = "";

    if (data.para_miembros) {
      Cantidad.ParaMiembros++;
      descripcion += `🦾 Contenido Para Miembros del Canal ChepeCarlos 🦾

👉 Quieres verlo, unete aqui: https://www.youtube.com/alswnet/join 👈

Este Video sera publico y accesible por toda la comunidad en el futuro.

🔭 Mira todos los video disponible para Miembros en: https://nocheprogramacion.com/miembros`;
    } else {
      // Descripcion
      let content = data.__content.trim();
      descripcion += `${content}\n`;

      descripcion = AgregarSeoMostar(descripcion, Cantidad, data.actualizado);

      const AdsGlobal = path.join(__dirname, "ads.txt");
      try {
        if (fs.existsSync(AdsGlobal)) {
          ActivadoAdsGlobal = true;
          let ADS = fs.readFileSync(AdsGlobal);
          descripcion += `\n${ADS}`;
        }
      } catch (err) {
        console.error(err);
      }

      // ADS
      if (data.ads) {
        Cantidad.Ads++;
        for (let i = 0; i < data.ads.length; ++i) {
          descripcion += `\n${data.ads[i].title} ${data.ads[i].url}\n`;
        }
      }

      // Remake
      if (data.remake) {
        Cantidad.Remake++;
        url = ObtenerURLYoutube(data.remake);
        descripcion += `Existe una verción NUEVA 👀 o actualizada de este video: ${url}\n`;
      }

      // TODO: Mejor Algorititmo
      // Siquiente Video / Playlist
      let SiquienteVideo;
      let NombreSiquienteVideo;
      if (i !== videos.length - 1) {
        if (
          pageURL.substring(0, pageURL.lastIndexOf("/")) ===
          videos[i + 1].pageURL.substring(
            0,
            videos[i + 1].pageURL.lastIndexOf("/")
          )
        ) {
          SiquienteVideo = videos[i + 1].data.video_id;
          NombreSiquienteVideo = videos[i + 1].data.title;
        } else {
          SiquienteVideo = false;
        }
      } else {
        SiquienteVideo = false;
      }

      // Siquiente video
      if (SiquienteVideo) {
        descripcion += `\n👉 Siguiente Video "${NombreSiquienteVideo}" : https://youtu.be/${SiquienteVideo} 👈\n`;
      }

      // Serie
      if (playlist) {
        let NombrePlaylist = videos[i].playlistName;
        descripcion += `\n🎥 Playlist(${NombrePlaylist}): https://www.youtube.com/playlist?list=${playlist}\n`;
      }

      // Videos
      if (data.videos) {
        Cantidad.Video++;
        descripcion += "\nVideo mencionados:\n";
        for (let i = 0; i < data.videos.length; ++i) {
          if (data.videos[i].video_id) {
            descripcion += `🎞 ${data.videos[i].title}: https://youtu.be/${data.videos[i].video_id}\n`;
          } else if (data.videos[i].url) {
            let url = data.videos[i].url;
            if (/https?:\/\/.*/.test(url)) {
              descripcion += `🎞 ${data.videos[i].title}: ${url}\n`;
            } else {
              url = ObtenerURLYoutube(data.videos[i].url);
              descripcion += `🎞 ${data.videos[i].title}: ${url}\n`;
            }
          }
        }
      }

      // Codigo
      if (data.repository || data.web_editor) {
        Cantidad.Codigo++;
        descripcion += `\n💻 Código: https://nocheprogramacion.com/${pageURL}.html\n`;
      } else {
        descripcion += `\n🖥 Articulo: https://nocheprogramacion.com/${pageURL}.html\n`;
      }

      // Links
      if (data.links) {
        Cantidad.Links++;
        descripcion += "\nLink referencie:\n";
        for (let i = 0; i < data.links.length; ++i) {
          const url = data.links[i].url;
          if (/https?:\/\/.*/.test(url)) {
            descripcion += `🔗 ${data.links[i].title}: ${url}\n`;
          } else {
            descripcion += `🔗 ${data.links[i].title}: https://nocheprogramacion.com/${url}\n`;
          }
        }
      }

      // Link de piesas
      if (data.piezas) {
        Cantidad.Piezas++;
        descripcion += "\nComponentes electrónicos:\n";
        for (let i = 0; i < data.piezas.length; ++i) {
          const url = data.piezas[i].url;
          if (url) {
            if (/https?:\/\/.*/.test(url)) {
              descripcion += `🤖 ${data.piezas[i].title}: ${url}\n`;
            } else {
              descripcion += `🤖 ${data.piezas[i].title}: https://nocheprogramacion.com${url}\n`;
            }
          } else {
            descripcion += `🤖 ${data.piezas[i].title}\n`;
          }
        }
      }

      // Partes Extras
      if (data.custom_sections) {
        Cantidad.Costun++;
        descripcion += `\nLink Extras:\n`;
        for (let i = 0; i < data.custom_sections.length; ++i) {
          if (data.custom_sections[i].title) {
            descripcion += `✪ ${data.custom_sections[i].title}:\n`;
            for (let j = 0; j < data.custom_sections[i].items.length; ++j) {
              const url = data.custom_sections[i].items[j].url;
              const title = data.custom_sections[i].items[j].title;
              descripcion += `  `;
              if (/https?:\/\/.*/.test(url)) {
                descripcion += `➤ ${title}: ${url}\n`;
              } else {
                descripcion += `➤ ${title}: https://nocheprogramacion.com${url}\n`;
              }
            }
          }
        }
      }

      // Indice del video
      if (data.topics) {
        Cantidad.Indice++;
        descripcion += "\n🕓 Indice:\n";
        for (let i = 0; i < data.topics.length; ++i) {
          descripcion += `${data.topics[i].time} ${data.topics[i].title}\n`;
        }
      }

      // Links Generales
      descripcion += "\nLinks:";
      descripcion += `
    👏🏽 Subscribe: https://www.youtube.com/alswnet?sub_confirmation=1
    ☕ Donar un café: https://nocheprogramacion.com/cafe
    💬 Discord: https://nocheprogramacion.com/discord
    🚂 Sitio Web: http://nocheprogramacion.com
    🐦 Redes Sociales: http://nocheprogramacion.com/links\n`;

      // Agradecer a colaboradores
      if (data.actualizado) {
        if (data.colaboradores) {
          Cantidad.Colaboradores++;
          descripcion += "\nCreado con los Aliados:\n";
          for (let i = 0; i < data.colaboradores.length; ++i) {
            descripcion += `  🧙🏼‍♂️ ${data.colaboradores[i].title} - ${data.colaboradores[i].colaborador}\n`;
          }
        }
      }

      //Miembros
      if (data.miembros) {
        Cantidad.Miembros++;
        descripcion += "\n🦾 Creado gracias al Apóyo de:\n";
        Maker_Uno = data.miembros[0]["Maker_Uno"];
        for (let i = 0; i < Maker_Uno.length; ++i) {
          descripcion += `${Maker_Uno[i].title}`;
          if (i < Maker_Uno.length - 1) {
            descripcion += `, `;
          } else {
            descripcion += `.`;
          }
        }
        descripcion += `\n🔭 Agrega tu nombre, Unete tu tambien https://www.youtube.com/alswnet/join 🔭`;
      } else {
        descripcion += `\n🔭 Quieres apoyar, comviertete en Miembro https://www.youtube.com/alswnet/join 🔭`;
      }
    }
    // if (data.tags) {
    //   descripcion += `\n\n#ALSW`;
    //   for (let i = 0; i < data.tags.length; ++i) {
    //     descripcion += ` #` + data.tags[i];
    //   }
    //   // descripcion += `\n`;
    // }

    // descripcion += `\nEsta descripción fue auto-generada. Si ves algún problema, por favor reportarlo en https://github.com/alswnet/NocheProgramacion/issues/new`;

    let NombreArchivo = `${data.video_id}`;
    if (data.video_number) {
      NombreArchivo = `${data.video_number}_${NombreArchivo}`;
    }
    if (data.course_number) {
      NombreArchivo = `${data.course_number}.${NombreArchivo}`;
    }

    if (data.actualizado) {
      Cantidad.NuevoSistema++;
      fs.writeFileSync(`actualizado/${data.video_id}.txt`, descripcion);
    }

    let tipo = videos[i].pageURL.split("/")[0];
    NombreArchivo = `${tipo}_${NombreArchivo}`;

    fs.writeFileSync(`descripciones/${NombreArchivo}.txt`, descripcion);
    fs.writeFileSync(`descripciones/Zen_${data.video_id}.txt`, descripcion);
  }

  console.log(`Cantidad total videos: ${CantidadVideos}`);
  ImprimirData("Miembros", Cantidad.Miembros, CantidadVideos);
  ImprimirData("Para Miembros", Cantidad.ParaMiembros, CantidadVideos);
  ImprimirData("Colaboradores", Cantidad.Colaboradores, CantidadVideos);
  ImprimirData("Links", Cantidad.Links, CantidadVideos);
  ImprimirData("Indices", Cantidad.Indice, CantidadVideos);
  ImprimirData("Piezas", Cantidad.Piezas, CantidadVideos);
  ImprimirData("Extras", Cantidad.Costun, CantidadVideos);
  ImprimirData("Videos", Cantidad.Video, CantidadVideos);
  ImprimirData("Codigo", Cantidad.Codigo, CantidadVideos);
  ImprimirData("Remake", Cantidad.Remake, CantidadVideos);
  ImprimirData("Ads", Cantidad.Ads, CantidadVideos);
  ImprimirData("SeoMostar", Cantidad.SeoMostar, CantidadVideos);
  ImprimirData("SeoMostar Activos", Cantidad.SeoMostarActivo, CantidadVideos);
  ImprimirData("Nuevo Sistema", Cantidad.NuevoSistema, CantidadVideos);
  console.log(`Ads Global: ${ActivadoAdsGlobal}`);
}

(() => {
  console.log(
    "💫 Generador de descripcion de NocheProgramacion para Youtube 💫"
  );
  CrearDescripciones(ObtenerDataVideo());
})();
