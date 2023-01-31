// This file is for the service avaliable on Mercury servers at "/mercury/services/cookies".

function _MercurySetCookie(cname: string, cvalue: string, exdays: number) {

    const d = new Date()
    d.setTime(d.getTime() + (exdays*24*60*60*1000))
    let expires = 'expires=' + d.toUTCString()

    if (_MercuryGetCookie(cname) != '') {
        _MercuryDelCookie(cname)
    }

    document.cookie = `${cname}=${cvalue};${expires};path=/`

}
  
function _MercuryGetCookie(cname: string) {

    let name = cname + '='
    let decodedCookie = decodeURIComponent(document.cookie)
    let ca = decodedCookie.split(';')

    for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) == ' ') {
            c = c.substring(1)
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length)
        }
    }

    return ''

}

function _MercuryDelCookie(cname: string) {

    let name = cname + '='
    let decodedCookie = decodeURIComponent(document.cookie)
    let ca = decodedCookie.split(';')

    for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) == ' ') {
            c = c.substring(1)
        }
        if (c.indexOf(name) == 0) {
            ca.splice(i, 1)
            document.cookie = ca.join(';')
            break
        }
    }

}

function setCookiePolicy(value: boolean): void {
    _MercurySetCookie('allowCookies', value.toString(), 60)
}

function getCookiePolicy(): boolean | undefined {
    let cookie = _MercuryGetCookie('allowCookies')
    if (cookie = "") {
        return undefined
    } else {
        return Boolean(cookie)
    }

}


document.addEventListener('DOMContentLoaded', () => {

    const content = document.querySelector('.mercury-container')
    const modalWrapper = document.querySelector('.mercury-cookieprompt-wrapper')
    const modalButtons = document.querySelectorAll('.mercury-cookie-button')
    
    let allow = _MercuryGetCookie('allowCookies')
    if (allow == '') {
        content.classList.toggle('mercury-cookieprompt-active')
        modalWrapper.classList.toggle('mercury-cookieprompt-active')
    }

    modalButtons.forEach(button => {
        button.addEventListener('click', () => {
            content.classList.toggle('mercury-cookieprompt-active')
            modalWrapper.classList.toggle('mercury-cookieprompt-active')
        })
    })
    
    const acceptButton = document.getElementById('mercuryCookieAccept')
    const rejectButton = document.getElementById('mercuryCookieReject')
    
    acceptButton.addEventListener('click', () => { 
        setCookiePolicy(true)
    })
    
    rejectButton.addEventListener('click', () => {
        setCookiePolicy(false)
    })


})
