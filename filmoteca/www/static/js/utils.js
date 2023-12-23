
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
