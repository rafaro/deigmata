import { jwtDecode } from 'jwt-decode'
import { Notify } from 'quasar'
import { i18n } from 'src/boot/i18n'

class MyService {
  doLog() {
    return 'Log Teste'
  }

  doJwtDecode(jwtData) {
    return jwtDecode(jwtData)
  }

  saveToken(token) {
    window.sessionStorage.setItem('token', token)
  }
  getToken() {
    return window.sessionStorage.getItem('token')
  }

  signOut() {
    window.sessionStorage.removeItem('token')
  }

  getHost() {
    return `${process.env.API}`
  }

  getRoleUser() {
    const token = this.getToken()
    if (token) {
      const { role } = jwtDecode(token)
      return role
    } else {
      return 'EMPTY'
    }
  }

  isConfirmedEmail() {
    const token = this.getToken()
    if (token) {
      const { confirmedemail } = jwtDecode(token)
      return confirmedemail
    } else {
      return false
    }
  }

  isLogged() {
    const token = this.getToken()

    if (!token) {
      // Se não existe o token no LocalStorage
      // significa que o usuário não está assinado.
      return false
    }
    try {
      const { exp: expiration } = jwtDecode(token)
      const isLogged = !!expiration && Date.now() > expiration * 1000

      if (isLogged) {
        // Se o token tem uma data de expiração e
        // essa data é menor que a atual o usuário
        return false
      }
      // não está mais assinado.
      return true
    } catch (e) {
      console.log(e.message)
      // O "jwt-decode" lança erros pra tokens inválidos.
      return false // Com um token inválido o usuário não está assinado.
    }
  }

  isAllowed(rolePage) {
    return rolePage.includes(this.getRoleUser())
  }

  // https://forum.quasar-framework.org/topic/3415/how-to-use-quasar-plugins-notify-loading-inside-vuex-modules/10
  msgGreen(msg) {
    Notify.create({
      color: 'green-4',
      textColor: 'white',
      icon: 'check',
      html: true,
      message: msg,
    })
  }

  msgRed(msg) {
    Notify.create({
      color: 'red-4',
      textColor: 'white',
      icon: 'check',
      html: true,
      message: msg,
    })
  }

  msgYellow(msg) {
    Notify.create({
      color: 'warning',
      icon: 'warning',
      position: 'top',
      html: true,
      message: msg,
    })
  }

  msgError(msg) {
    let msgPrint
    if (Array.isArray(msg)) {
      msgPrint = msg
        .map((e) => {
          return `${e.toString()} <br/>`
        })
        .join(' ')
    } else {
      msgPrint = msg
    }
    Notify.create({
      color: 'red-4',
      textColor: 'white',
      icon: 'check',
      html: true,
      message: msgPrint,
    })
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  setCookie2(name, value, options = {}) {
    // https://javascript.info/cookie
    options = {
      path: '/',
      // add other defaults here if necessary
      ...options,
    }

    if (options.expires instanceof Date) {
      options.expires = options.expires.toUTCString()
    }

    let updatedCookie = encodeURIComponent(name) + '=' + encodeURIComponent(value)

    for (const optionKey in options) {
      updatedCookie += '; ' + optionKey
      const optionValue = options[optionKey]
      if (optionValue !== true) {
        updatedCookie += '=' + optionValue
      }
    }

    document.cookie = updatedCookie
  }

  validate() {
    return {
      async required(val) {
        return !!val || i18n.global.t('validation.required')
      },
      async charMax(val, num) {
        return (
          (val && Number(val.length) <= Number(num)) ||
          i18n.global.t('validation.maxLength', { num })
        )
      },
      async charEqual(val, num) {
        return (
          (val && Number(val.length) === Number(num)) ||
          i18n.global.t('validation.exactLength', { num })
        )
      },
    }
  }

  fetchGlobalData() {
    return {
      status: [
        { label: i18n.global.t('options.status.a'), value: 'A' },
        { label: i18n.global.t('options.status.i'), value: 'I' },
      ],
      role: [
        { label: i18n.global.t('options.role.guest'), value: 'GUEST' },
        { label: i18n.global.t('options.role.super'), value: 'SUPER' },
        { label: i18n.global.t('options.role.junior'), value: 'JUNIOR' },
        { label: i18n.global.t('options.role.user'), value: 'USER' },
      ],
    }
  }
}
const service = new MyService()

export default async ({ router }) => {
  router.beforeEach((to, from, next) => {
    const auth = to.matched[0].meta.auth || false

    if (auth) {
      // if (to.name !== 'auth/email/resend' && !service.isConfirmedEmail()) {
      //   return nexi18n.global.t({ name: 'auth/login' })
      // }
      const role = to.meta?.role || to.matched[0].meta.role || 'GUEST'
      if (auth && !service.isAllowed(role)) {
        service.msgError(i18n.global.t('validation.restrictedArea'))
        return next({ name: 'index' })
      }
      if (!service.isLogged()) {
        service.msgError(i18n.global.t('validation.restrictedArea'))
        return next({ name: 'auth/logout' })
      }
    }
    return next()
  })
}
export { service }
