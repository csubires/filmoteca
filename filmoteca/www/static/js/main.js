import { Handler_connection } from './connection.js';
import { showMessage } from './utils.js';

window.addEventListener('load', function () {
    const cnt = new Handler_connection();
    const movieForm = document.querySelector('#form-editor')
    const screenBlock = document.querySelector('#screen-block')
    const searchForm = document.querySelector('#form-search')

    let beforeFillForm = false              // Para no volver a rellenar los datalist

    // Código de país a icono de bandera unicode
    const flag = c => String.fromCodePoint(...[...c.toUpperCase()].map(x=>0x1f1a5+x.charCodeAt()))

    // Mostrar o esconder un elemento DOM
    const showAndHidde = (obj, visibility, zIndex) => {
        obj.style.visibility = visibility
        obj.style.zIndex = zIndex
    }

    // Colección de funciones para asociar a eventos
    const callbackCollection = {
        // CARTA - Al clickar en una carta mostrar información adicional y controles de administración
        'info-film': async (e) => {
            const cardInfoFilm = document.querySelector(`#card-info-film-${e.target.dataset.idFilm}`)
            movieForm && fillDataList()     // Rellenar datalists y selects si es admin
            // Si no ha sido rellenado con anterioridad (evitar repetir petición)
            if (e.target.dataset.filled == undefined) {
                // Obtener información adicional de una película
                let params = `{"id_movie": ${e.target.dataset.idFilm}}`     // Mandar como texto, formato json tiene ""
                let dataJson = await cnt.send('GET', `/api/extra_info_movie/${params}`)
                // Solo se muestra una película (data[0])
                dataJson = dataJson.data[0]
                if (dataJson) {
                    cardInfoFilm.insertAdjacentHTML('afterbegin', `
                    
                    <strong>${dataJson.realtitle}</strong>
                    <img src="/covers/${dataJson.id_genre}${dataJson.urlpicture}">
                    <a target="_blank" href="https://www.filmaffinity.com${dataJson.urldesc}">
                    <span><i class="icon-file"></i>${dataJson.extension}</span>
                    <span><i class="icon-film"></i>${dataJson.quality}</span>
                    <span><i class="icon-database"></i>${dataJson.hdd_code}</span>
                    <span><i class="icon-hdd"></i>${dataJson.size_str}</span>
                    </a>
                    <div class="country"><i>${dataJson.flag}</i><span>${dataJson.country}</span></div>
                    `)
                }
            }
            // Hacer visible la carta info
            showAndHidde(cardInfoFilm, 'visible', 4)    // Traer la tarjeta de información al frente
            e.target.dataset.filled = ''                // Establecer atributo para evitar repetir petición
        },

        // BOTÓN - Rellenar formulario de edición de película
        'show-dialog-edit': (e) =>  {
            e.preventDefault()
            movieForm.dataset.idFilm = e.target.dataset.idFilm
            fillFormEdit()
            document.querySelector('#dialog-edit').showModal()
        },

        // BOTÓN - Cerrar ventana de dialogo
        'close-dialog': (e) => {
            e.target.closest('dialog').close('cancel')
        },

        // BOTÓN - Cerrar ventana padre
        'close': (e) =>  {
            screenBlock && showAndHidde(screenBlock, 'hidden', -1)
            showAndHidde(e.target.parentElement, 'hidden', -1)
        },

        // BOTÓN - Salvar código de un país
        'edit-country': async (e) =>  {    
            let code = (document.querySelector(`#input-country-${e.target.dataset.idCountry}`).value).toLowerCase() || 'n/a'    
            let params = {
                'csrf_token_form': e.target.dataset.csrfTokenForm,
                'id_country': e.target.dataset.idCountry,
                'code': code,
                'flag': flag(code)
            }
            await cnt.send('PUT', '/api/set_code_country', params)
        },

        // BOTÓN - Borrar película
        'delete-film': async (e) =>  {
            let params = {
                'csrf_token_movie': e.target.dataset.csrfTokenFilm,
                'id_movie': e.target.dataset.idFilm,
            }
            let dataJson = await cnt.send('DELETE', '/api/delete_movie', params)
            if (dataJson) {
                let cardInfoFilm = document.querySelector(`#card-info-film-${e.target.dataset.idFilm}`)
                cardInfoFilm.innerHTML = `<strong>Película ${e.target.dataset.titleFilm} eliminada</strong><p>${dataJson.message}</p>` 
            }
        },

        // BOTÓN - Borrar reporte en mantenimiento
        'delete-report': async (e) =>  {  
            let params = {
                'id_report': e.target.dataset.idReport,
                'csrf_token_form': e.target.dataset.csrfTokenForm
            }
            let dataJson = await cnt.send('DELETE', '/api/delete_report', params)
            if (dataJson) {
                let trReport = document.querySelector(`#report-tr-${e.target.dataset.idReport}`)
                trReport.innerHTML = `<tr><td colspan="11"${e.target.dataset.dateReport} ${dataJson.message}</td><tr>`  
            }         
        },

        // BOTÓN - Establecer película como presente
        'set-present': async (e) =>  { 
            let params = {
                'id_rating': e.target.dataset.idRating,
                'csrf_token_form': e.target.dataset.csrfTokenForm
            }
            let dataJson = await cnt.send('PUT', '/api/set_present', params)
            if (dataJson) {
                let trReport = document.querySelector(`#rating-tr-${e.target.dataset.idRating}`)
                trReport.innerHTML = `<tr><td colspan="4"ddddd</td><tr>`  
            }
        },

        // BOTÓN - Buscar la película que supuestamente está presente
        'present-view': async (e) =>  {
            searchForm.search.value = e.target.dataset.title
            searchForm.submit()
        },

        // INPUT - Habilitar botón de actualizar película en el formulario de edición
        'enable-update': () =>  {
            movieForm['btnUpdate'].disabled = false
        },

        // BOTÓN - Modificar los datos de una película
        'save-film': async (e) =>  {
            e.preventDefault()
            let params = {}
            let value

            // Transformar a array y recopilar datos de los inputs
            [...movieForm.elements].forEach((input) => {
                if (input.name != "") {             // Si tiene atributo name
                    value = input.value || null     // Obtener el valor
                    if (input.type == "checkbox") {
                        value = input.checked ? 1 : 0
                    } else if (input.type == "radio") {
                        value = parseInt(movieForm[input.name].value)    
                    }
                    params[input.name] = value
                }
            })
    
            await cnt.send('PUT', '/api/modify_movie', params)
            //fillFormEdit()                          // Refrescar los datos modificados
        },

        // BOTÓN - Actualizar los datos de una película
        'update-film': async (e) =>  {  
            e.preventDefault()
            showAndHidde(screenBlock, 'visible, 99')  // Trae al frente la pantalla de bloqueo
            // Guardar las modificaciones (url_desc) en la base de datos
            callbackCollection['save-film'](e)
            // Mandar como texto, formato json tiene ""
            let params = `{"id_movie": ${movieForm.dataset.idFilm}, "csrf_token_form": "${searchForm.csrf_token_form.value }"}`
            let dataJson = await cnt.send('GET', `/api/update_inet_movie/${params}`)
            if (dataJson) {
                // Vuelve a rellenar el formulario con los datos nuevos
                fillFormEdit()
            }
            showAndHidde(screenBlock, 'hidden', -1)     // Oculta la pantalla de bloqueo
        },

        // BOTÓN - Ordenar listado de películas por
        'sort-items':  async (e) =>  {
            const items = document.querySelector('.item-list')

            // Ordenar por 0 Título, 1 Valoración, 2 Año, 3 Duración
            let mySort = (a, b) => {
                let str1 = a.innerText.split('\n')
                let str2 = b.innerText.split('\n')
                let orderBy = e.target.dataset.idSort
                return str1[orderBy] > str2[orderBy] ? 1 : -1
            }
            
            // Filtrar solo los nodos tipo 1, ordenar, mostrar
            let aux = [...items.children]
                .filter(item => item.nodeType == 1)
                .sort(mySort)
                .forEach(node => items.appendChild(node))
        },

        // INPUT - Autocompletar con películas que coincidan de el texto introducido
        'autocomplete-search': async (e) =>  {
            let strSearch = searchForm.search.value
            if (strSearch.length >= 4) {                // Empezar a sugerir a partir de 4 letras
                let params = `{"search": "%${strSearch}%", "year": "${strSearch}", "limit": 10, "csrf_token_form": "${searchForm.csrf_token_form.value }"}`
                let dataJson = await cnt.send('GET', `/api/search_movies/${params}`)
                console.log(dataJson)
                
                if (dataJson) {
                    dataJson = dataJson.data
                    // Rellenar datalist con sugerencias
                    const dlSearch = searchForm.querySelector('#dlSearch')
                    dlSearch.innerHTML = ''             // Borrar contenido del datalist
                    dataJson.forEach(item => {
                        let option = document.createElement('option')
                        option.text = item.title + ' (' + item.year + ')'
                        option.value = item.title
                        dlSearch.appendChild(option)
                    })
                }
            }
        },

        // SELECT - Cuando se cambia el género o subgenero es necesario modificar el path de la película
        'change-path': (e) => {
            let id_genre = e.target.options[e.target.selectedIndex].value
            // Sacar de localStorage
            let dataJsonDataList = JSON.parse(localStorage.dataJson)
            let pathfolder = dataJsonDataList.get_all_pathgenres.find((item) => item[0] == id_genre)[1]
            movieForm['pathfile'].value = pathfolder + "/" + movieForm['pathfile'].value.split("/").at(-1)
        },

        // BUTTON - Mostrar el diálogo de confirmación
        'show-dialog': (e) => {
            let id_movie = e.target.dataset.idFilm
            const dialog = document.querySelector(`#dialog-${id_movie}`);
            dialog.showModal();
        },

        // INPUT - Borrar el campo de busqueda principal
        'clear-search': () =>  {
            searchForm['text-search'].value = ''
        },

        // BUTTON - Copiar la lista al portapapeles
        'copy-clipboard': () => {
            let content = document.querySelector('.list-copy').innerText
            navigator.clipboard.writeText(content)
            showMessage('Listado copiado al portapapeles', 'success')
        },

        // RADIO - Modo tema claro
        'light-mode': () =>  {  
            document.body.setAttribute('class', '')
            localStorage.setItem('theme', '') 
            const themeSwitch = document.querySelector('.theme-switch');
            themeSwitch.checked = localStorage.getItem('switchedTheme') === 'true';
            
            themeSwitch.addEventListener('change', function (e) {
                if(e.currentTarget.checked === true) {
                // Add item to localstorage
                    localStorage.setItem('switchedTheme', 'true');
                } else {
                // Remove item if theme is switched back to normal
                    localStorage.removeItem('switchedTheme');
                }
            });


        },

        // RADIO - Modo tema oscuro
        'dark-mode': () =>  {  
            document.body.setAttribute('class', 'theme theme-dark')
            localStorage.setItem('theme', 'dark') 
        },        

    }   // END callbackCollection
    
    // VINCULAR UN OBJECTO A UN EVENTO Y SU ACCIÓN
    const makeClickeable = (type, target) => {
        document.querySelectorAll(target).forEach(item => {
            // Solo si posee el atributo data-action
            if (item.dataset.action != undefined) {
                item.addEventListener(type, async(e) => callbackCollection[item.dataset.action](e))
            }
        })
    }

    // EVENTO - AL CLICKAR EN UNA CARTA DE PELÍCULA
    makeClickeable('click', '.card-click-film')

    // EVENTO - AL CLICKAR EN BOTONES
    makeClickeable('click', '.btn')

    // EVENTO - HABILITAR BOTÓN DE ACTUALIZAR PELÍCULA
    makeClickeable('change', '#urldesc')

    // EVENTO - AUTOCOMPLETAR BUSQUEDA
    makeClickeable('input', '#text-search')

    // EVENTO - AL SELECIONAR GÉNERO O SUBGÉNERO
    makeClickeable('change', '#id_genre')
    makeClickeable('change', '#id_subgenre')

    // EJECUTAR AL CARGAR
    let mode = localStorage.getItem('theme') == 'dark' ? 'theme theme-dark' : ''
    document.body.setAttribute('class', mode)
    document.querySelector("#dark-mode").checked = mode != ''? true : false

    // ----------------------------------- FUNCIONES -----------------------

    // RELLENAR DATALISTS Y SELECTS DEL FORMULARIO DE EDICIÓN DE PELÍCULA
    async function fillDataList() {

        const fillFormDataList = (target, dataJson, model=false) => {
            const datalistElem = movieForm.querySelector(target)
            dataJson.forEach(item => {
                let option = document.createElement('option')
                if (target == '#id_country') {
                    option.text = item.name
                    option.value = item.id_country  
                } else {
                    option.text = model ? item[0] : item[1]
                    option.value = item[0]
                }
                datalistElem.appendChild(option)
            })
        }   // END fillFormDataList

        // Si no está relleno el form
        if (beforeFillForm == false) {
            // Utilizar localStorage como cache para evitar peticiones
            if (localStorage.getItem('dataJson') == null) {
                let all_data = {}

                /*
                const getData = (async (item) => {
                    // Mandar como texto, formato json tiene ""
                    let params = `{"csrf_token_form": "${movieForm.csrf_token_form.value}"}`
                    let dataJson = await cnt.send('GET', `/api/${item}/${params}`)
                    console.log(item, dataJson)
                    return dataJson.data
                })

                // Obtener calidades, extensiones, resoluciones, fps, géneros, subgéneros, países
                const queries = ['select_quality', 'select_extension', 'select_resolution', 'select_fps', 'get_all_genres', 'get_all_subgenres', 'select_country']
                queries.forEach(item => { all_data[item] = getData(item) })*/

                let params = `{"csrf_token_form": "${movieForm.csrf_token_form.value}"}`
                // Obtener calidades
                let dataJson = await cnt.send('GET', `/api/select_quality/${params}`)
                all_data['select_quality'] = dataJson.data
                // Obtener extensiones
                dataJson = await cnt.send('GET', `/api/select_extension/${params}`)
                all_data['select_extension'] = dataJson.data
                // Obtener resoluciones
                dataJson = await cnt.send('GET', `/api/select_resolution/${params}`)
                all_data['select_resolution'] = dataJson.data
                // Obtener fps
                dataJson = await cnt.send('GET', `/api/select_fps/${params}`)
                all_data['select_fps'] = dataJson.data
                // Obtener géneros TODO (traer todo del tiron y filtrar )
                dataJson = await cnt.send('GET', `/api/get_all_genres/${params}`)
                all_data['get_all_genres'] = dataJson.data
                // Obtener subgéneros TODO (traer todo del tiron y filtrar )
                dataJson = await cnt.send('GET', `/api/get_all_subgenres/${params}`)
                all_data['get_all_subgenres'] = dataJson.data
                // Obtener pathgenres TODO (traer todo del tiron y filtrar )
                dataJson = await cnt.send('GET', `/api/get_all_pathgenres/${params}`)
                all_data['get_all_pathgenres'] = dataJson.data
                // Obtener países
                dataJson = await cnt.send('GET', `/api/select_country/${params}`)
                all_data['select_country'] = dataJson.data
                // Guardar en localStorage
                localStorage.setItem('dataJson', JSON.stringify(all_data))
            }

            // Sacar de localStorage
            let dataJsonDataList = JSON.parse(localStorage.dataJson)
            // Rellenar datalist de calidades
            fillFormDataList('#dlQuality', dataJsonDataList.select_quality, true) 
            // Rellenar datalist de extensiones
            fillFormDataList('#dlExtension', dataJsonDataList.select_extension, true)
            // Rellenar datalist de resoluciones
            fillFormDataList('#dlResolution', dataJsonDataList.select_resolution, true)
            // Rellenar datalist de fps
            fillFormDataList('#dlFps', dataJsonDataList.select_fps, true)
            // Rellenar select de géneros
            fillFormDataList('#id_genre', dataJsonDataList.get_all_genres)
            // Rellenar select de subgéreros
            fillFormDataList('#id_subgenre', dataJsonDataList.get_all_subgenres)
            // Rellenar select de países
            fillFormDataList('#id_country', dataJsonDataList.select_country)
            beforeFillForm = true                   // Para no volver a rellenar los datalist
        }
    }   // END fillDataList

    // RELLENAR FORMULARIO DE EDICIÓN DE PELÍCULA CON DATOS DE UNA PELÍCULA
    async function fillFormEdit() {
        movieForm.reset()                           // Limpiar formulario
        movieForm["btnUpdate"].disabled = true      // Deshabilitar el botón update por defecto
        // Mandar como texto, formato json tiene ""
        let params = `{"id_movie": ${movieForm.dataset.idFilm}, "csrf_token_form": "${movieForm.csrf_token_form.value}"}`
        let dataJson = await cnt.send('GET', `/api/get_movie/${params}`)
        dataJson = dataJson.data[0]                 // Solo se muestra una película (data[0])

        // Rellenar inputs del formulario
        for (let key in dataJson) {
            if (movieForm[key]) {
                movieForm[key].value = dataJson[key]
                if (movieForm[key].type == "checkbox") {
                    movieForm[key].checked = (dataJson[key] == 1 ? true : false)
                } else if (movieForm[key].type == "range") {
                    movieForm["v"+key].value = dataJson[key]
                } else if (movieForm[key].type == "select") {
                    movieForm[key].options[dataJson[key]].selected = true
                }
            }
        }

        // Extablecer en que disco duro está alojado la película
        movieForm['hdd_code_int'].checked = (dataJson['hdd_code'] == 0 ? true : false)
        movieForm['hdd_code_ext'].checked = (dataJson['hdd_code'] == 1 ? true : false)
    }

})  // END window load