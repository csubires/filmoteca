import { showMessage } from "./utils.js"

// Modulo para realizar peticiones json al servidor
export class Handler_connection {

    async send(method, url_page, params=null) {
        // Configuración base de una petición
        let configuration = {
            method: method,
            credentials: 'same-origin'
        }

        // PUT, DELETE, POST METHOD
        if (method !== 'GET') {
            configuration.headers = { 'Content-Type': 'application/json' }
            configuration.body = JSON.stringify(params)  
        }

        return fetch(url_page, configuration)
        .then(async(response) => {
            var data = await response.json()
            if (response.status == 200) {
                if (method !== 'GET') {
                    showMessage(data.message, 'success')
                }
                // console.log(data)
                return data
        
            } else {
                throw Error(data.message)
            }

        }).catch(error => {
            if (error.message == null)
                showMessage(error.message, 'danger')
            return null
        }) 

    }   // END send
}   // END Handler_connection
