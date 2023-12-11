
// CREAR POPUP CON UN MENSAJE SEGÚN SU TIPO
/* 
    info (azul): Información
    success (verder): Operación realizada con éxito
    warning (amarillo): Alerta de precaución
    danger (Rojo): Error, algo no fue bien
*/

export const showMessage = (message, type) => {
    let wrapper = document.createElement("div")
    wrapper.innerHTML = `
        <div class="alert alert-${type}" role="alert">
            <button type="button" class="btn-close" aria-label="Close"></button>
            <svg class="bi" role="img" aria-label="${type}:">
                <use href="#${type}-icon" />
            </svg>
            <div>${message}</div>
        </div>`
    const alertPlaceholder = document.querySelector("#alerts-container")
    alertPlaceholder.prepend(wrapper)

    // Hacer desaparecer el popup pasado un tiempo
    setTimeout(() => wrapper.remove(), 5000) 
    // Dar la función a los botones de cerrar
    document.querySelectorAll(".btn-close").forEach(button => {
        button.addEventListener("click", e => { button.parentNode.remove() })
    })  
}


export const Confirm = async (title, msg, doWord) => {
    let wrapper = document.createElement("div")
    wrapper.innerHTML = `
        <div class="dialog-ovelay">
            <div class="dialog"><header><h3>${title}</h3></header>
                <div class="dialog-msg"><p>${msg}</p></div>
                <footer>
                    <div class="controls">
                        <button class="button button-danger doAction">${doWord}</button> 
                        <button class="button button-default cancelAction">Cancelar</button>     
                    </div>
                </footer>
            </div>
        </div>`
            
    document.body.prepend(wrapper)

    document.querySelector('.doAction').addEventListener("click", (event) => {
        wrapper.remove()
        return Promise.resolve(true)
    })

    document.querySelector('.cancelAction').addEventListener("click", () => {
        wrapper.remove()
        return Promise.resolve(false)
    })

}