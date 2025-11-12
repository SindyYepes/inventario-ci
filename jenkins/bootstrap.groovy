import jenkins.model.*
import hudson.security.*

def instance = Jenkins.getInstanceOrNull()
if (instance == null) return

def adminUser = System.getenv('ADMIN_USER') ?: 'admin'
def adminPass = System.getenv('ADMIN_PASS') ?: 'admin123'

// Realm local con usuarios internos
def hudsonRealm = new HudsonPrivateSecurityRealm(false)
if (hudsonRealm.getUser(adminUser) == null) {
  hudsonRealm.createAccount(adminUser, adminPass)
}
instance.setSecurityRealm(hudsonRealm)

// Estrategia de autorización: solo autenticados
def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
strategy.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(strategy)

instance.save()
println "Jenkins bootstrap: usuario '${adminUser}' creado y Setup Wizard deshabilitado."

